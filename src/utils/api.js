import axios from 'axios/index';

import { API } from '$constants/api';

const arrayToObject = (array, key) => array.reduce((obj, el) => ({ ...obj, [el[key]]: el }), {});

export const checkUserToken = ({ id, token }) => axios.get(API.CHECK_TOKEN, {
  params: { id, token }
}).then(result => (result && result.data && {
  ...result.data,
  id,
  token,
  routes: (result.data.routes && result.data.routes.length > 0 && arrayToObject(result.data.routes, '_id')) || {},
})).catch(() => null);

export const getGuestToken = () => axios.get(API.GET_GUEST).then(result => (result && result.data));

export const getStoredMap = ({ name }) => axios.get(API.GET_MAP, {
  params: { name }
}).then(result => (result && result.data && result.data.success && result.data));

export const postMap = ({
  title, address, route, stickers, id, token, force, logo, distance, provider, is_public,
}) => axios.post(API.POST_MAP, {
  title,
  address,
  route,
  stickers,
  id,
  token,
  force,
  logo,
  distance,
  provider,
  is_public,
}).then(result => (result && result.data && result.data));

export const checkIframeToken = ({ viewer_id, auth_key }) => axios.get(API.IFRAME_LOGIN_VK, {
  params: { viewer_id, auth_key }
}).then(result => (result && result.data && result.data.success && result.data.user)).catch(() => (false));

export const getRouteList = ({
  title, distance, author, starred, id, token,
}) => axios.get(API.GET_ROUTE_LIST, {
  params: {
    title, distance, author, starred, id, token,
  }
}).then(result => (result && result.data && result.data.success && result.data))
  .catch(() => ({ list: [], min: 0, max: 0 }));
