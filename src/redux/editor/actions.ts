import { EDITOR_ACTIONS } from './constants';
import { IEditorState } from '.';
import { IRoute } from '../map/types';
import { KeyboardEvent } from 'react';

export const editorSetEditing = (editing: IEditorState['editing']) => ({
  type: EDITOR_ACTIONS.SET_EDITING,
  editing,
});

export const editorChangeMode = (mode: IEditorState['mode']) => ({
  type: EDITOR_ACTIONS.CHANGE_MODE,
  mode,
});

export const editorSetMode = (mode: IEditorState['mode']) => ({
  type: EDITOR_ACTIONS.SET_MODE,
  mode,
});

export const editorSetDistance = (distance: IEditorState['distance']) => ({
  type: EDITOR_ACTIONS.SET_DISTANCE,
  distance,
});
export const editorSetChanged = (changed: IEditorState['changed']) => ({
  type: EDITOR_ACTIONS.SET_CHANGED,
  changed,
});
export const editorSetSpeed = speed => ({ type: EDITOR_ACTIONS.SET_SPEED, speed });

export const editorStartEditing = () => ({ type: EDITOR_ACTIONS.START_EDITING });
export const editorStopEditing = () => ({ type: EDITOR_ACTIONS.STOP_EDITING });

export const editorRouterCancel = () => ({ type: EDITOR_ACTIONS.ROUTER_CANCEL });
export const editorRouterSubmit = () => ({ type: EDITOR_ACTIONS.ROUTER_SUBMIT });

export const editorClearPoly = () => ({ type: EDITOR_ACTIONS.CLEAR_POLY });
export const editorClearStickers = () => ({ type: EDITOR_ACTIONS.CLEAR_STICKERS });
export const editorClearAll = () => ({ type: EDITOR_ACTIONS.CLEAR_ALL });
export const editorClearCancel = () => ({ type: EDITOR_ACTIONS.CLEAR_CANCEL });

export const editorSendSaveRequest = (payload: {
  title: IRoute['title'];
  address: IRoute['address'];
  is_public: IRoute['is_public'];
  description: IRoute['description'];
  force: boolean;
}) => ({
  type: EDITOR_ACTIONS.SEND_SAVE_REQUEST,
  ...payload,
});

export const editorResetSaveDialog = () => ({ type: EDITOR_ACTIONS.RESET_SAVE_DIALOG });

export const editorSetSave = (save: Partial<IEditorState['save']>) => ({
  type: EDITOR_ACTIONS.SET_SAVE,
  save,
});

export const editorCancelSave = () => ({
  type: EDITOR_ACTIONS.CANCEL_SAVE,
});

export const editorHideRenderer = () => ({ type: EDITOR_ACTIONS.HIDE_RENDERER });
export const editorSetRenderer = payload => ({ type: EDITOR_ACTIONS.SET_RENDERER, payload });
export const editorTakeAShot = () => ({ type: EDITOR_ACTIONS.TAKE_A_SHOT });
export const editorCropAShot = payload => ({ type: EDITOR_ACTIONS.CROP_A_SHOT, ...payload });
export const editorSetDialog = dialog => ({ type: EDITOR_ACTIONS.SET_DIALOG, dialog });
export const editorSetDialogActive = dialog_active => ({
  type: EDITOR_ACTIONS.SET_DIALOG_ACTIVE,
  dialog_active,
});
export const editorSetReady = ready => ({ type: EDITOR_ACTIONS.SET_READY, ready });

export const editorGetGPXTrack = () => ({ type: EDITOR_ACTIONS.GET_GPX_TRACK });
export const editorSetMarkersShown = markers_shown => ({
  type: EDITOR_ACTIONS.SET_MARKERS_SHOWN,
  markers_shown,
});
export const editorSetIsEmpty = is_empty => ({ type: EDITOR_ACTIONS.SET_IS_EMPTY, is_empty });
export const editorSetFeature = (features: { [x: string]: boolean }) => ({
  type: EDITOR_ACTIONS.SET_FEATURE,
  features,
});

export const editorSetIsRouting = (is_routing: boolean) => ({
  type: EDITOR_ACTIONS.SET_IS_ROUTING,
  is_routing,
});

export const editorSetRouterPoints = (routerPoints: IEditorState['routerPoints']) => ({
  type: EDITOR_ACTIONS.SET_ROUTER_POINTS,
  routerPoints,
});

export const editorSetActiveSticker = (activeSticker: IEditorState['activeSticker']) => ({
  type: EDITOR_ACTIONS.SET_ACTIVE_STICKER,
  activeSticker,
});

export const editorLocationChanged = location => ({
  type: EDITOR_ACTIONS.LOCATION_CHANGED,
  location,
});

export const editorKeyPressed = ({
  key,
  target: { tagName },
}: {
  key: string;
  target: { tagName: string };
}) => ({
  type: EDITOR_ACTIONS.KEY_PRESSED,
  key,
  target: tagName,
});

export const editorSetRouter = (router: Partial<IEditorState['router']>) => ({
  type: EDITOR_ACTIONS.SET_ROUTER,
  router,
});

export const editorSetNominatim = (nominatim: Partial<IEditorState['nominatim']>) => ({
  type: EDITOR_ACTIONS.SET_NOMINATIM,
  nominatim,
});

export const editorSearchNominatim = (search: IEditorState['nominatim']['search']) => ({
  type: EDITOR_ACTIONS.SEARCH_NOMINATIM,
  search,
});

export const editorSetHistory = (history: Partial<IEditorState['history']>) => ({
  type: EDITOR_ACTIONS.SET_HISTORY,
  history,
});

export const editorUndo = () => ({
  type: EDITOR_ACTIONS.UNDO,
});

export const editorRedo = () => ({
  type: EDITOR_ACTIONS.REDO,
});

export const editorCaptureHistory = () => ({
  type: EDITOR_ACTIONS.CAPTURE_HIPSTORY,
});

export const editorSetDirection = (drawing_direction: IEditorState['drawing_direction']) => ({
  type: EDITOR_ACTIONS.SET_DIRECTION,
  drawing_direction,
});

export const editorSetGpx = (gpx: Partial<IEditorState['gpx']>) => ({
  type: EDITOR_ACTIONS.SET_GPX,
  gpx,
});

export const editorUploadGpx = (file: File) => ({
  type: EDITOR_ACTIONS.UPLOAD_GPX,
  file,
});

export const editorDropGpx = (index: number) => ({
  type: EDITOR_ACTIONS.DROP_GPX,
  index,
});
