/** @typedef {import('../types').HTTPRoute} HttpRoute */

/** @type HttpRoute */
const signUp = {
  method: 'POST',
  url: '/sign-up',
  inputSource: 'body',
  command: { service: 'auth', method: 'signUp' },
};

/** @type HttpRoute */
const signIn = {
  method: 'POST',
  url: '/sign-in',
  inputSource: 'body',
  command: { service: 'auth', method: 'signIn' },
};

/** @type HttpRoute */
const signOut = {
  method: 'POST',
  url: '/sign-out',
  inputSource: 'body',
  command: { service: 'auth', method: 'signOut' },
};

/** @type HttpRoute */
const refresh = {
  method: 'POST',
  url: '/refresh',
  inputSource: 'body',
  command: { service: 'auth', method: 'refresh' },
};

export default [signUp, signIn, signOut, refresh];
