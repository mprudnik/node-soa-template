/** @typedef {import('../types').HTTPRoute} HttpRoute */

/** @type HttpRoute */
export const signUp = {
  method: 'POST',
  url: '/sign-up',
  inputSource: 'body',
  command: { service: 'auth', method: 'signUp' },
};

/** @type HttpRoute */
export const signIn = {
  method: 'POST',
  url: '/sign-in',
  inputSource: 'body',
  command: { service: 'auth', method: 'signIn' },
};

/** @type HttpRoute */
export const signOut = {
  method: 'POST',
  url: '/sign-out',
  inputSource: 'body',
  command: { service: 'auth', method: 'signOut' },
};

/** @type HttpRoute */
export const refresh = {
  method: 'POST',
  url: '/refresh',
  inputSource: 'body',
  command: { service: 'auth', method: 'refresh' },
};
