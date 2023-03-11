/** @typedef {import('../types').HTTPRoute} HttpRoute */

/** @type HttpRoute */
export const transfer = {
  method: 'POST',
  url: '/transfer',
  inputSource: 'body',
  command: { service: 'account', method: 'transfer' },
};
