import { REHYDRATE } from 'redux-persist';
import { delay } from 'redux-saga';
import { takeLatest, select, call, put, takeEvery, race, take } from 'redux-saga/effects';
import {
  checkIframeToken,
  checkUserToken,
  getGuestToken,
  getStoredMap,
  postMap
} from '$utils/api';
import {
  hideRenderer,
  setActiveSticker, setAddress,
  setChanged, setDialogActive,
  setEditing,
  setMode, setReady, setRenderer,
  setSaveError,
  setSaveOverwrite, setSaveSuccess, setTitle,
  setUser
} from '$redux/user/actions';
import { getUrlData, parseQuery, pushLoaderState, pushNetworkInitError, pushPath, replacePath } from '$utils/history';
import { editor } from '$modules/Editor';
import { ACTIONS } from '$redux/user/constants';
import { MODES } from '$constants/modes';
import { DEFAULT_USER } from '$constants/auth';
import { TIPS } from '$constants/tips';
import {
  composeImages,
  composePoly, composeStickers, downloadCanvas,
  fetchImages,
  getPolyPlacement, getStickersPlacement,
  getTilePlacement,
  imageFetcher
} from '$utils/renderer';
import { LOGOS } from '$constants/logos';
import { DEFAULT_PROVIDER } from '$constants/providers';

const getUser = state => (state.user.user);
const getState = state => (state.user);

const hideLoader = () => {
  document.getElementById('loader').style.opacity = 0;
  document.getElementById('loader').style.pointerEvents = 'none';

  return true;
};

function* generateGuestSaga() {
  const user = yield call(getGuestToken);
  yield put(setUser(user));

  return user;
}

function* startEmptyEditorSaga() {
  const { id, random_url, provider = DEFAULT_PROVIDER } = yield select(getUser);

  pushPath(`/${random_url}/edit`);

  editor.owner = { id };
  editor.setProvider(provider);
  editor.startEditing();

  yield put(setChanged(false));
  yield put(setEditing(true));

  return hideLoader();
}

function* startEditingSaga() {
  // yield put(setEditing(true));
  // yield editor.startEditing();
  const { path } = getUrlData();
  yield pushPath(`/${path}/edit`);
}

function* stopEditingSaga() {
  const { changed, editing, mode } = yield select(getState);
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

  yield pushPath(`/${path}/`);
}

function* loadMapSaga(path) {
  const map = yield call(getStoredMap, { name: path });

  if (map) {
    yield editor.clearAll();
    yield editor.setData(map);
    yield editor.fitDrawing();
    yield editor.setInitialData();

    yield put(setChanged(false));
  }

  return map;
}

function* iframeLoginVkSaga({ viewer_id, access_token, auth_key }) {
  return yield console.log('GOT', { viewer_id, access_token, auth_key });
}

function* mapInitSaga() {
  pushLoaderState(90);

  const { hash } = getUrlData();

  if (hash && /^#map/.test(hash)) {
    const [, newUrl] = hash.match(/^#map[:/?!](.*)$/);

    if (newUrl) {
      yield pushPath(`/${newUrl}`);
    }
  }

  const { path, mode } = getUrlData();

  if (path) {
    const map = yield call(loadMapSaga, path);

    if (map) {
      if (mode && mode === 'edit') {
        yield put(setEditing(true));
        editor.startEditing();
      } else {
        yield put(setEditing(false));
        editor.stopEditing();
      }

      yield put(setReady(true));
      hideLoader();
      return true;
    }
  }

  yield call(startEmptyEditorSaga);
  yield put(setReady(true));

  pushLoaderState(100);

  return true;
}

function* authCheckSaga() {
  pushLoaderState(70);

  const { id, token } = yield select(getUser);
  const { ready } = yield select(getState);

  if (window.location.search || true) {
    const { viewer_id, auth_key } = yield parseQuery(window.location.search);

    if (viewer_id && auth_key && id !== `vk:${viewer_id}`) {
      const user = yield call(checkIframeToken, { viewer_id, auth_key });

      if (user) {
        yield put(setUser(user));

        pushLoaderState('   ...готово');

        return yield call(mapInitSaga);
      }
    }
  }

  if (id && token) {
    const user = yield call(checkUserToken, { id, token });

    if (user) {
      yield put(setUser(user));

      pushLoaderState('   ...готово');

      return yield call(mapInitSaga);
    } else if (!ready) {
      pushNetworkInitError();
    }
  }

  yield call(generateGuestSaga);

  pushLoaderState(80);

  return yield call(mapInitSaga);
}

function* setModeSaga({ mode }) {
  return yield editor.changeMode(mode);
  // console.log('change', mode);
}

function* userLogoutSaga() {
  yield put(setUser(DEFAULT_USER));
  yield call(generateGuestSaga);
}

function* setActiveStickerSaga({ activeSticker }) {
  yield editor.activeSticker = activeSticker;
  yield put(setMode(MODES.STICKERS));

  return true;
}

function* setLogoSaga({ logo }) {
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

    default: break;
  }

  yield put(setActiveSticker(null));
  yield put(setMode(MODES.NONE));
}

function* sendSaveRequestSaga({ title, address, force }) {
  if (editor.isEmpty) return yield put(setSaveError(TIPS.SAVE_EMPTY));

  const { route, stickers, provider } = editor.dumpData();
  const { logo, distance } = yield select(getState);
  const { id, token } = yield select(getUser);

  const { result, timeout, cancel } = yield race({
    result: postMap({
      id, token, route, stickers, title, force, address, logo, distance, provider,
    }),
    timeout: delay(10000),
    cancel: take(ACTIONS.RESET_SAVE_DIALOG),
  });

  if (cancel) return yield put(setMode(MODES.NONE));
  if (result && result.mode === 'overwriting') return yield put(setSaveOverwrite());
  if (result && result.mode === 'exists') return yield put(setSaveError(TIPS.SAVE_EXISTS));
  if (timeout || !result || !result.success || !result.address) return yield put(setSaveError(TIPS.SAVE_TIMED_OUT));

  return yield put(setSaveSuccess({ address: result.address, save_error: TIPS.SAVE_SUCCESS, title }));
}

function* refreshUserData() {
  const user = yield select(getUser);
  const data = yield call(checkUserToken, user);

  return yield put(setUser(data));
}

function* setSaveSuccessSaga({ address, title }) {
  const { id } = yield select(getUser);

  replacePath(`/${address}/edit`);

  yield put(setTitle(title));
  yield put(setAddress(address));
  yield put(setChanged(false));

  yield editor.owner = { id };

  yield call(refreshUserData);

  return yield editor.setInitialData();
}

function* getRenderData() {
  yield put(setRenderer({ info: 'Загрузка тайлов', progress: 0.1 }));

  const canvas = document.getElementById('renderer');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const geometry = getTilePlacement();
  const points = getPolyPlacement();
  const stickers = getStickersPlacement();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const images = yield fetchImages(ctx, geometry);

  yield put(setRenderer({ info: 'Отрисовка', progress: 0.5 }));

  yield composeImages({ geometry, images, ctx });
  yield composePoly({ points, ctx });
  yield composeStickers({ stickers, ctx });

  yield put(setRenderer({ info: 'Готово', progress: 1 }));

  return yield canvas.toDataURL('image/jpeg');
}

function* takeAShotSaga() {
  const worker = call(getRenderData);

  const { result, timeout } = yield race({
    result: worker,
    timeout: delay(500),
  });

  // if (cancel) return;
  if (timeout) yield put(setMode(MODES.SHOT_PREFETCH));

  const data = yield (result || worker);
  yield put(setMode(MODES.NONE));
  yield put(setRenderer({
    data, renderer_active: true, width: window.innerWidth, height: window.innerHeight
  }));
}

function* getCropData({
  x, y, width, height
}) {
  const { logo, renderer: { data } } = yield select(getState);
  const canvas = document.getElementById('renderer');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const image = yield imageFetcher(data);

  ctx.drawImage(image, -x, -y);

  if (logo && LOGOS[logo][1]) {
    const logoImage = yield imageFetcher(LOGOS[logo][1]);
    ctx.drawImage(logoImage, width - logoImage.width, height - logoImage.height);
  }

  return yield canvas.toDataURL('image/jpeg');
}

function* cropAShotSaga(params) {
  const { title, address } = yield select(getState);
  yield call(getCropData, params);
  const canvas = document.getElementById('renderer');

  downloadCanvas(canvas, (title || address));

  return yield put(hideRenderer());
}

function* setProviderSaga({ provider }) {
  // editor.setProvider(provider);
  editor.provider = provider;
  editor.map.setProvider(provider);

  yield put(setChanged(true));

  return put(setMode(MODES.NONE));
}

function* locationChangeSaga({ location }) {
  const { address, ready, user: { id, random_url } } = yield select(getState);

  if (!ready) return;

  const { path, mode } = getUrlData(location);

  if (address !== path) {
    const map = yield call(loadMapSaga, path);

    if (map && map.owner && mode === 'edit' && map.owner.id !== id) {
      pushPath(`/${map.random_url}/edit`);
      return;
    }
  } else if (mode === 'edit' && editor.owner.id !== id) {
    pushPath(`/${random_url}/edit`);
    return;
  }

  if (mode !== 'edit') {
    yield put(setEditing(false));
    editor.stopEditing();
  } else {
    yield put(setEditing(true));
    editor.startEditing();
  }
}

function* gotVkUserSaga({ user }) {
  const data = yield call(checkUserToken, user);
  yield put(setUser(data));
}

function* keyPressedSaga({ key }): void {
  if (key === 'Escape') {
    const { dialog_active, mode, renderer: { renderer_active } } = yield select(getState);

    if (renderer_active) return yield put(hideRenderer());
    if (dialog_active) return yield put(setDialogActive(false));
    if (mode !== MODES.NONE) return yield put(setMode(MODES.NONE));
  }

  return;
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
  yield takeEvery([
    ACTIONS.CLEAR_POLY,
    ACTIONS.CLEAR_STICKERS,
    ACTIONS.CLEAR_ALL,
    ACTIONS.CLEAR_CANCEL,
  ], clearSaga);

  yield takeLatest(ACTIONS.SEND_SAVE_REQUEST, sendSaveRequestSaga);
  yield takeLatest(ACTIONS.SET_SAVE_SUCCESS, setSaveSuccessSaga);
  yield takeLatest(ACTIONS.TAKE_A_SHOT, takeAShotSaga);
  yield takeLatest(ACTIONS.CROP_A_SHOT, cropAShotSaga);

  yield takeEvery(ACTIONS.SET_PROVIDER, setProviderSaga);
  yield takeLatest(ACTIONS.LOCATION_CHANGED, locationChangeSaga);

  yield takeLatest(ACTIONS.GOT_VK_USER, gotVkUserSaga);
  yield takeLatest(ACTIONS.KEY_PRESSED, keyPressedSaga);

  yield takeLatest(ACTIONS.IFRAME_LOGIN_VK, iframeLoginVkSaga);
}
