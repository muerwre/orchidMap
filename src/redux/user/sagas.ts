import { REHYDRATE, RehydrateAction } from "redux-persist";
import { delay, SagaIterator } from "redux-saga";
import {
  takeLatest,
  select,
  call,
  put,
  takeEvery,
  race,
  take,
  TakeEffect
} from "redux-saga/effects";
import {
  checkIframeToken,
  checkOSRMService,
  checkUserToken,
  dropRoute,
  getGuestToken,
  getRouteList,
  getStoredMap,
  modifyRoute,
  postMap,
  sendRouteStarred
} from "$utils/api";
import {
  hideRenderer,
  searchPutRoutes,
  searchSetLoading,
  setActiveSticker,
  setAddress,
  setChanged,
  setDialogActive,
  setEditing,
  setMode,
  setReady,
  setRenderer,
  setSaveError,
  setSaveOverwrite,
  setSaveSuccess,
  setTitle,
  searchSetTab,
  setUser,
  setDialog,
  setPublic,
  setAddressOrigin,
  setProvider,
  changeProvider,
  setSaveLoading,
  mapsSetShift,
  searchChangeDistance,
  clearAll,
  setFeature,
  searchSetTitle,
  setRouteStarred,
  setDescription
} from "$redux/user/actions";
import {
  getUrlData,
  parseQuery,
  pushLoaderState,
  pushNetworkInitError,
  pushPath,
  replacePath
} from "$utils/history";
import { editor } from "$modules/Editor";
import { ACTIONS } from "$redux/user/constants";
import { MODES } from "$constants/modes";
import { DEFAULT_USER, IUser } from "$constants/auth";
import { TIPS } from "$constants/tips";
import {
  composeArrows,
  composeDistMark,
  composeImages,
  composePoly,
  composeStickers,
  downloadCanvas,
  fetchImages,
  getPolyPlacement,
  getStickersPlacement,
  getTilePlacement,
  imageFetcher
} from "$utils/renderer";
import { LOGOS } from "$constants/logos";
import { DEFAULT_PROVIDER } from "$constants/providers";
import { DIALOGS, TABS } from "$constants/dialogs";

import * as ActionCreators from "$redux/user/actions";
import { IRootState } from "$redux/user/reducer";
import { downloadGPXTrack, getGPXString } from "$utils/gpx";
import { Unwrap } from "$utils/middleware";
import { IState } from "$redux/store";

const getUser = (state: IState) => state.user.user;
const getState = (state: IState) => state.user;

const hideLoader = () => {
  document.getElementById("loader").style.opacity = String(0);
  document.getElementById("loader").style.pointerEvents = "none";

  return true;
};

function* generateGuestSaga() {
  const {
    data: { user, random_url }
  }: Unwrap<typeof getGuestToken> = yield call(getGuestToken);

  yield put(setUser({ ...user, random_url }));

  return { ...user, random_url };
}

function* startEmptyEditorSaga() {
  const {
    user: { id, random_url },
    provider = DEFAULT_PROVIDER
  } = yield select(getState);

  pushPath(`/${random_url}/edit`);

  editor.owner = id;
  editor.setProvider(provider);
  editor.startEditing();

  yield put(setChanged(false));
  yield put(setEditing(true));

  return yield call(setReadySaga);
}

function* startEditingSaga() {
  const { path } = getUrlData();
  yield pushPath(`/${path}/edit`);
}

function* stopEditingSaga() {
  const { changed, editing, mode, address_origin } = yield select(getState);
  const { path } = getUrlData();

  if (!editing) return;
  if (changed && mode !== MODES.CONFIRM_CANCEL) {
    yield put(setMode(MODES.CONFIRM_CANCEL));
    return;
  }

  yield editor.cancelEditing();
  yield put(setMode(MODES.NONE));
  yield put(setChanged(false));
  yield put(setEditing(editor.hasEmptyHistory)); // don't close editor if no previous map

  yield pushPath(`/${address_origin || path}/`);
}

function* loadMapSaga(path) {
  const {
    data: { route, error, random_url }
  }: Unwrap<typeof getStoredMap> = yield call(getStoredMap, { name: path });

  if (route && !error) {
    yield editor.clearAll();
    yield editor.setData(route);
    yield editor.fitDrawing();
    yield editor.setInitialData();

    yield put(setChanged(false));

    return { route, random_url };
  }

  return null;
}

function* replaceAddressIfItsBusy(destination, original) {
  if (original) {
    yield put(setAddressOrigin(original));
  }

  pushPath(`/${destination}/edit`);
}

function* checkOSRMServiceSaga() {
  const north_east = editor.map.map.getBounds().getNorthEast();
  const south_west = editor.map.map.getBounds().getSouthWest();
  const routing = yield call(checkOSRMService, [north_east, south_west]);

  yield put(setFeature({ routing }));
}

function* setReadySaga() {
  yield put(setReady(true));
  hideLoader();

  yield call(checkOSRMServiceSaga);
  yield put(searchSetTab(TABS.MY));
}

function* mapInitSaga() {
  pushLoaderState(90);

  const { path, mode, hash } = getUrlData();
  const {
    provider,
    user: { id }
  } = yield select(getState);

  editor.map.setProvider(provider);
  yield put(changeProvider(provider));

  if (hash && /^#map/.test(hash)) {
    const [, newUrl] = hash.match(/^#map[:/?!](.*)$/);

    if (newUrl) {
      yield pushPath(`/${newUrl}`);
      return yield call(setReadySaga);
    }
  }

  if (path) {
    const map = yield call(loadMapSaga, path);

    if (map && map.route) {
      if (mode && mode === "edit") {
        if (
          map &&
          map.route &&
          map.route.owner &&
          mode === "edit" &&
          map.route.owner !== id
        ) {
          yield call(setReadySaga);
          yield call(replaceAddressIfItsBusy, map.random_url, map.address);
        } else {
          yield put(setAddressOrigin(""));
        }

        yield put(setEditing(true));
        editor.startEditing();
      } else {
        yield put(setEditing(false));
        editor.stopEditing();
      }

      yield call(setReadySaga);
      return true;
    }
  }

  yield call(startEmptyEditorSaga);
  yield put(setReady(true));

  pushLoaderState(100);

  return true;
}

function* authCheckSaga({ key }: RehydrateAction) {
  if (key !== 'user') return;

  pushLoaderState(70);

  const { id, token } = yield select(getUser);
  const { ready } = yield select(getState);

  if (window.location.search || true) {
    const { viewer_id, auth_key } = yield parseQuery(window.location.search);

    if (viewer_id && auth_key && id !== `vk:${viewer_id}`) {
      const user = yield call(checkIframeToken, { viewer_id, auth_key });

      if (user) {
        yield put(setUser(user));

        pushLoaderState(99);

        return yield call(mapInitSaga);
      }
    }
  }

  if (id && token) {
    const {
      data: { user, random_url }
    }: Unwrap<typeof checkUserToken> = yield call(checkUserToken, {
      id,
      token
    });

    if (user) {
      yield put(setUser({ ...user, random_url }));

      pushLoaderState(99);

      return yield call(mapInitSaga);
    } else if (!ready) {
      pushNetworkInitError();
      return;
    }
  }

  yield call(generateGuestSaga);

  pushLoaderState(80);

  return yield call(mapInitSaga);
}

function* setModeSaga({ mode }: ReturnType<typeof ActionCreators.setMode>) {
  return yield editor.changeMode(mode);
  // console.log('change', mode);
}

function* setActiveStickerSaga({
  activeSticker
}: {
  type: string;
  activeSticker: IRootState["activeSticker"];
}) {
  yield (editor.activeSticker = activeSticker);
  yield put(setMode(MODES.STICKERS));

  return true;
}

function* setLogoSaga({ logo }: { type: string; logo: string }) {
  const { mode } = yield select(getState);
  editor.logo = logo;

  yield put(setChanged(true));

  if (mode === MODES.LOGO) {
    yield put(setMode(MODES.NONE));
  }
}

function* routerCancelSaga() {
  yield call(editor.router.cancelDrawing);
  yield put(setMode(MODES.NONE));

  return true;
}

function* routerSubmitSaga() {
  yield call(editor.router.submitDrawing);
  yield put(setMode(MODES.NONE));

  return true;
}

function* clearSaga({ type }) {
  switch (type) {
    case ACTIONS.CLEAR_POLY:
      yield editor.poly.clearAll();
      yield editor.router.clearAll();
      break;

    case ACTIONS.CLEAR_STICKERS:
      yield editor.stickers.clearAll();
      break;

    case ACTIONS.CLEAR_ALL:
      yield editor.clearAll();
      yield put(setChanged(false));
      break;

    default:
      break;
  }

  yield put(setActiveSticker(null));
  yield put(setMode(MODES.NONE));
}

function* sendSaveRequestSaga({
  title,
  address,
  force,
  is_public,
  description
}: ReturnType<typeof ActionCreators.sendSaveRequest>) {
  if (editor.isEmpty) return yield put(setSaveError(TIPS.SAVE_EMPTY));

  const { route, stickers, provider } = editor.dumpData();
  const { logo, distance } = yield select(getState);
  const { token } = yield select(getUser);

  yield put(setSaveLoading(true));

  const {
    result,
    timeout,
    cancel
  }: {
    result: Unwrap<typeof postMap>;
    timeout: boolean;
    cancel: TakeEffect;
  } = yield race({
    result: postMap({
      token,
      route,
      stickers,
      title,
      force,
      address,
      logo,
      distance,
      provider,
      is_public,
      description
    }),
    timeout: delay(10000),
    cancel: take(ACTIONS.RESET_SAVE_DIALOG)
  });

  yield put(setSaveLoading(false));

  if (cancel) return yield put(setMode(MODES.NONE));

  if (result && result.data.code === "already_exist")
    return yield put(setSaveOverwrite());
  if (result && result.data.code === "conflict")
    return yield put(setSaveError(TIPS.SAVE_EXISTS));
  if (timeout || !result || !result.data.route || !result.data.route.address)
    return yield put(setSaveError(TIPS.SAVE_TIMED_OUT));

  return yield put(
    setSaveSuccess({
      address: result.data.route.address,
      title: result.data.route.title,
      is_public: result.data.route.is_public,
      description: result.data.route.description,

      save_error: TIPS.SAVE_SUCCESS
    })
  );
}

function* getRenderData() {
  yield put(setRenderer({ info: "Загрузка тайлов", progress: 0.1 }));

  const canvas = <HTMLCanvasElement>document.getElementById("renderer");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");

  const geometry = getTilePlacement();
  const points = getPolyPlacement();
  const stickers = getStickersPlacement();
  const distance = editor.poly.poly.distance;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const images = yield fetchImages(ctx, geometry);

  yield put(setRenderer({ info: "Отрисовка", progress: 0.5 }));

  yield composeImages({ geometry, images, ctx });
  yield composePoly({ points, ctx });
  yield composeArrows({ points, ctx });
  yield composeDistMark({ ctx, points, distance });
  yield composeStickers({ stickers, ctx });

  yield put(setRenderer({ info: "Готово", progress: 1 }));

  return yield canvas.toDataURL("image/jpeg");
}

function* takeAShotSaga() {
  const worker = call(getRenderData);

  const { result, timeout } = yield race({
    result: worker,
    timeout: delay(500)
  });

  if (timeout) yield put(setMode(MODES.SHOT_PREFETCH));

  const data = yield result || worker;

  yield put(setMode(MODES.NONE));
  yield put(
    setRenderer({
      data,
      renderer_active: true,
      width: window.innerWidth,
      height: window.innerHeight
    })
  );
}

function* getCropData({ x, y, width, height }) {
  const {
    logo,
    renderer: { data }
  } = yield select(getState);
  const canvas = <HTMLCanvasElement>document.getElementById("renderer");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const image = yield imageFetcher(data);

  ctx.drawImage(image, -x, -y);

  if (logo && LOGOS[logo][1]) {
    const logoImage = yield imageFetcher(LOGOS[logo][1]);
    ctx.drawImage(
      logoImage,
      width - logoImage.width,
      height - logoImage.height
    );
  }

  return yield canvas.toDataURL("image/jpeg");
}

function* cropAShotSaga(params) {
  const { title, address } = yield select(getState);
  yield call(getCropData, params);
  const canvas = document.getElementById("renderer") as HTMLCanvasElement;

  downloadCanvas(canvas, (title || address).replace(/\./gi, " "));

  return yield put(hideRenderer());
}

function* changeProviderSaga({
  provider
}: ReturnType<typeof ActionCreators.changeProvider>) {
  const { provider: current_provider } = yield select(getState);

  yield put(setProvider(provider));

  if (current_provider === provider) return;

  yield put(setChanged(true));

  editor.provider = provider;
  editor.map.setProvider(provider);

  return put(setMode(MODES.NONE));
}

function* locationChangeSaga({
  location
}: ReturnType<typeof ActionCreators.locationChanged>) {
  const {
    address,
    ready,
    user: { id, random_url }
  } = yield select(getState);

  if (!ready) return;

  const { path, mode } = getUrlData(location);

  if (address !== path) {
    const map = yield call(loadMapSaga, path);

    if (
      map &&
      map.route &&
      map.route.owner &&
      mode === "edit" &&
      map.route.owner !== id
    ) {
      console.log("replace address if its busy");
      return yield call(replaceAddressIfItsBusy, map.random_url, map.address);
    }
  } else if (mode === "edit" && editor.owner !== id) {
    return yield call(replaceAddressIfItsBusy, random_url, address);
  } else {
    yield put(setAddressOrigin(""));
  }

  if (mode !== "edit") {
    yield put(setEditing(false));
    editor.stopEditing();
  } else {
    yield put(setEditing(true));
    editor.startEditing();
  }
}

function* gotVkUserSaga({
  user: u
}: ReturnType<typeof ActionCreators.gotVkUser>) {
  const {
    data: { user, random_url }
  }: Unwrap<typeof checkUserToken> = yield call(checkUserToken, u);

  yield put(setUser({ ...user, random_url }));
}

function* keyPressedSaga({
  key,
  target
}: ReturnType<typeof ActionCreators.keyPressed>): any {
  if (target === "INPUT" || target === "TEXTAREA") {
    return;
  }

  if (key === "Escape") {
    const {
      dialog_active,
      mode,
      renderer: { renderer_active }
    } = yield select(getState);

    if (renderer_active) return yield put(hideRenderer());
    if (dialog_active) return yield put(setDialogActive(false));
    if (mode !== MODES.NONE) return yield put(setMode(MODES.NONE));
  } else if (key === "Delete") {
    const {
      user: { editing }
    } = yield select();

    if (!editing) return;

    const { mode } = yield select(getState);

    if (mode === MODES.TRASH) {
      yield put(clearAll());
    } else {
      yield put(setMode(MODES.TRASH));
    }
  }
}

function* searchGetRoutes() {
  const { token } = yield select(getUser);

  const {
    routes: {
      step,
      shift,
      filter: { title, distance, tab }
    }
  } = yield select(getState);

  const result: Unwrap<typeof getRouteList> = yield getRouteList({
    token,
    search: title,
    min: distance[0],
    max: distance[1],
    step,
    shift,
    tab
  });

  return result;
}

function* searchSetSagaWorker() {
  const {
    routes: { filter }
  }: ReturnType<typeof getState> = yield select(getState);

  const {
    data: {
      routes,
      limits: { min, max, count: limit },
      filter: { shift, step }
    }
  }: Unwrap<typeof getRouteList> = yield call(searchGetRoutes);

  yield put(searchPutRoutes({ list: routes, min, max, limit, shift, step }));

  // change distange range if needed and load additional data
  if (
    (filter.min > min && filter.distance[0] <= filter.min) ||
    (filter.max < max && filter.distance[1] >= filter.max)
  ) {
    yield put(
      searchChangeDistance([
        filter.min > min && filter.distance[0] <= filter.min
          ? min
          : filter.distance[0],
        filter.max < max && filter.distance[1] >= filter.max
          ? max
          : filter.distance[1]
      ])
    );
  }

  return yield put(searchSetLoading(false));
}

function* searchSetSaga() {
  yield put(searchSetLoading(true));
  yield put(mapsSetShift(0));
  yield delay(300);
  yield call(searchSetSagaWorker);
}

function* openMapDialogSaga({
  tab
}: ReturnType<typeof ActionCreators.openMapDialog>) {
  const {
    dialog_active,
    routes: {
      filter: { tab: current }
    }
  } = yield select(getState);

  if (dialog_active && tab === current) {
    return yield put(setDialogActive(false));
  }

  if (tab !== current) {
    // if tab wasnt changed just update data
    yield put(searchSetTab(tab));
  }

  yield put(setDialog(DIALOGS.MAP_LIST));
  yield put(setDialogActive(true));

  return tab;
}

function* searchSetTabSaga() {
  yield put(searchChangeDistance([0, 10000]));
  yield put(
    searchPutRoutes({ list: [], min: 0, max: 10000, step: 20, shift: 0 })
  );

  yield put(searchSetTitle(""));
}

function* setSaveSuccessSaga({
  address,
  title,
  is_public,
  description
}: ReturnType<typeof ActionCreators.setSaveSuccess>) {
  const { id } = yield select(getUser);
  const { dialog_active } = yield select(getState);

  replacePath(`/${address}/edit`);

  yield put(setTitle(title));
  yield put(setAddress(address));
  yield put(setPublic(is_public));
  yield put(setDescription(description));
  yield put(setChanged(false));

  editor.owner = id;

  if (dialog_active) {
    yield call(searchSetSagaWorker);
  }

  return yield editor.setInitialData();
}

function* userLogoutSaga(): SagaIterator {
  yield put(setUser(DEFAULT_USER));
  yield call(generateGuestSaga);
}

function* setUserSaga() {
  const { dialog_active } = yield select(getState);

  if (dialog_active) yield call(searchSetSagaWorker);

  return true;
}

function* setTitleSaga({
  title
}: ReturnType<typeof ActionCreators.setTitle>): SagaIterator {
  if (title) {
    document.title = `${title} | Редактор маршрутов`;
  }
}

function* getGPXTrackSaga(): SagaIterator {
  const { route, stickers } = editor.dumpData();
  const { title, address } = yield select(getState);

  if (!route || route.length <= 0) return;

  const track = getGPXString({ route, stickers, title: title || address });

  return downloadGPXTrack({ track, title });
}

function* mapsLoadMoreSaga() {
  const {
    routes: { limit, list, shift, step, loading, filter }
  } = yield select(getState);

  if (loading || list.length >= limit || limit === 0) return;

  yield delay(50);

  yield put(searchSetLoading(true));
  yield put(mapsSetShift(shift + step));

  const {
    data: {
      limits: { min, max, count },
      filter: { shift: resp_shift, step: resp_step },
      routes
    }
  }: Unwrap<typeof getRouteList> = yield call(searchGetRoutes);

  if (
    (filter.min > min && filter.distance[0] <= filter.min) ||
    (filter.max < max && filter.distance[1] >= filter.max)
  ) {
    yield put(
      searchChangeDistance([
        filter.min > min && filter.distance[0] <= filter.min
          ? min
          : filter.distance[0],
        filter.max < max && filter.distance[1] >= filter.max
          ? max
          : filter.distance[1]
      ])
    );
  }

  yield put(
    searchPutRoutes({
      min,
      max,
      limit: count,
      shift: resp_shift,
      step: resp_step,
      list: [...list, ...routes]
    })
  );
  yield put(searchSetLoading(false));
}

function* dropRouteSaga({
  address
}: ReturnType<typeof ActionCreators.dropRoute>): SagaIterator {
  const { token } = yield select(getUser);
  const {
    routes: {
      list,
      step,
      shift,
      limit,
      filter: { min, max }
    }
  } = yield select(getState);

  const index = list.findIndex(el => el.address === address);

  if (index >= 0) {
    yield put(
      searchPutRoutes({
        list: list.filter(el => el.address !== address),
        min,
        max,
        step,
        shift: shift > 0 ? shift - 1 : 0,
        limit: limit > 0 ? limit - 1 : limit
      })
    );
  }

  return yield call(dropRoute, { address, token });
}

function* modifyRouteSaga({
  address,
  title,
  is_public
}: ReturnType<typeof ActionCreators.modifyRoute>): SagaIterator {
  const { token } = yield select(getUser);
  const {
    routes: {
      list,
      step,
      shift,
      limit,
      filter: { min, max }
    }
  }: ReturnType<typeof getState> = yield select(getState);

  const index = list.findIndex(el => el.address === address);

  if (index >= 0) {
    yield put(
      searchPutRoutes({
        list: list.map(el =>
          el.address !== address ? el : { ...el, title, is_public }
        ),
        min,
        max,
        step,
        shift: shift > 0 ? shift - 1 : 0,
        limit: limit > 0 ? limit - 1 : limit
      })
    );
  }

  return yield call(modifyRoute, { address, token, title, is_public });
}

function* toggleRouteStarredSaga({
  address
}: ReturnType<typeof ActionCreators.toggleRouteStarred>) {
  const {
    routes: { list }
  }: IState["user"] = yield select(getState);

  const route = list.find(el => el.address === address);
  const { token } = yield select(getUser);

  yield put(setRouteStarred(address, !route.is_published));
  const result = yield sendRouteStarred({
    token,
    address,
    is_published: !route.is_published
  });

  if (!result) return yield put(setRouteStarred(address, route.is_published));
}

export function* userSaga() {
  yield takeLatest(REHYDRATE, authCheckSaga);
  yield takeEvery(ACTIONS.SET_MODE, setModeSaga);

  yield takeEvery(ACTIONS.START_EDITING, startEditingSaga);
  yield takeEvery(ACTIONS.STOP_EDITING, stopEditingSaga);

  yield takeEvery(ACTIONS.USER_LOGOUT, userLogoutSaga);
  yield takeEvery(ACTIONS.SET_ACTIVE_STICKER, setActiveStickerSaga);
  yield takeEvery(ACTIONS.SET_LOGO, setLogoSaga);

  yield takeEvery(ACTIONS.ROUTER_CANCEL, routerCancelSaga);
  yield takeEvery(ACTIONS.ROUTER_SUBMIT, routerSubmitSaga);
  yield takeEvery(
    [
      ACTIONS.CLEAR_POLY,
      ACTIONS.CLEAR_STICKERS,
      ACTIONS.CLEAR_ALL,
      ACTIONS.CLEAR_CANCEL
    ],
    clearSaga
  );

  yield takeLatest(ACTIONS.SEND_SAVE_REQUEST, sendSaveRequestSaga);
  yield takeLatest(ACTIONS.SET_SAVE_SUCCESS, setSaveSuccessSaga);
  yield takeLatest(ACTIONS.TAKE_A_SHOT, takeAShotSaga);
  yield takeLatest(ACTIONS.CROP_A_SHOT, cropAShotSaga);

  yield takeEvery(ACTIONS.CHANGE_PROVIDER, changeProviderSaga);
  yield takeLatest(ACTIONS.LOCATION_CHANGED, locationChangeSaga);

  yield takeLatest(ACTIONS.GOT_VK_USER, gotVkUserSaga);
  yield takeLatest(ACTIONS.KEY_PRESSED, keyPressedSaga);

  yield takeLatest(ACTIONS.SET_TITLE, setTitleSaga);

  yield takeLatest(
    [ACTIONS.SEARCH_SET_TITLE, ACTIONS.SEARCH_SET_DISTANCE],
    searchSetSaga
  );

  yield takeLatest(ACTIONS.OPEN_MAP_DIALOG, openMapDialogSaga);
  yield takeLatest(ACTIONS.SEARCH_SET_TAB, searchSetTabSaga);
  yield takeLatest(ACTIONS.SET_USER, setUserSaga);

  yield takeLatest(ACTIONS.GET_GPX_TRACK, getGPXTrackSaga);
  yield takeLatest(ACTIONS.MAPS_LOAD_MORE, mapsLoadMoreSaga);

  yield takeLatest(ACTIONS.DROP_ROUTE, dropRouteSaga);
  yield takeLatest(ACTIONS.MODIFY_ROUTE, modifyRouteSaga);
  yield takeLatest(ACTIONS.TOGGLE_ROUTE_STARRED, toggleRouteStarredSaga);
}
