export interface IActions {
  [x: string]: string,
}

export const ACTIONS: IActions = {
  SET_USER: 'SET_USER',
  USER_LOGOUT: 'USER_LOGOUT',

  SET_EDITING: 'SET_EDITING',
  SET_MODE: 'SET_MODE',
  SET_DISTANCE: 'SET_DISTANCE',
  SET_CHANGED: 'SET_CHANGED',
  SET_ROUTER_POINTS: 'SET_ROUTER_POINTS',
  SET_ACTIVE_STICKER: 'SET_ACTIVE_STICKER',
  SET_LOGO: 'SET_LOGO',
  SET_TITLE: 'SET_TITLE',
  SET_ADDRESS: 'SET_ADDRESS',
  SET_ADDRESS_ORIGIN: 'SET_ADDRESS_ORIGIN',
  SET_PUBLIC: 'SET_PUBLIC',

  START_EDITING: 'START_EDITING',
  STOP_EDITING: 'STOP_EDITING',

  ROUTER_CANCEL: 'ROUTER_CANCEL',
  ROUTER_SUBMIT: 'ROUTER_SUBMIT',

  CLEAR_POLY: 'CLEAR_POLY',
  CLEAR_STICKERS: 'CLEAR_STICKERS',
  CLEAR_ALL: 'CLEAR_ALL',
  CLEAR_CANCEL: 'CLEAR_CANCEL',

  SEND_SAVE_REQUEST: 'SEND_SAVE_REQUEST',
  SET_SAVE_LOADING: 'SET_SAVE_LOADING',
  CANCEL_SAVE_REQUEST: 'CANCEL_SAVE_REQUEST',
  RESET_SAVE_DIALOG: 'RESET_SAVE_DIALOG',

  SET_SAVE_SUCCESS: 'SET_SAVE_SUCCESS',
  SET_SAVE_ERROR: 'SET_SAVE_ERROR',
  SET_SAVE_OVERWRITE: 'SET_SAVE_OVERWRITE',

  SHOW_RENDERER: 'SHOW_RENDERER',
  HIDE_RENDERER: 'HIDE_RENDERER',
  SET_RENDERER: 'SET_RENDERER',
  TAKE_A_SHOT: 'TAKE_A_SHOT',
  CROP_A_SHOT: 'CROP_A_SHOT',

  SET_PROVIDER: 'SET_PROVIDER',
  CHANGE_PROVIDER: 'CHANGE_PROVIDER',

  SET_DIALOG: 'SET_DIALOG',
  SET_DIALOG_ACTIVE: 'SET_DIALOG_ACTIVE',
  LOCATION_CHANGED: 'LOCATION_CHANGED',
  SET_READY: 'SET_READY',

  GOT_VK_USER: 'GOT_VK_USER',
  KEY_PRESSED: 'KEY_PRESSED',

  IFRAME_LOGIN_VK: 'IFRAME_LOGIN_VK',

  SEARCH_SET_TITLE: 'SEARCH_SET_TITLE',
  SEARCH_SET_DISTANCE: 'SEARCH_SET_DISTANCE',

  SEARCH_SET_TAB: 'SEARCH_SET_TAB',
  SEARCH_PUT_ROUTES: 'SEARCH_PUT_ROUTES',
  SEARCH_SET_LOADING: 'SEARCH_SET_LOADING',

  OPEN_MAP_DIALOG: 'OPEN_MAP_DIALOG',
  SET_SPEED: 'SET_SPEED',

  SET_MARKERS_SHOWN: 'SET_MARKERS_SHOWN',

  GET_GPX_TRACK: 'GET_GPX_TRACK',
  SET_IS_EMPTY: 'SET_IS_EMPTY',
};
