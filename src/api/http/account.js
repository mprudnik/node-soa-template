/** @typedef {import('../types').HTTPRoute} HttpRoute */

/** @type HttpRoute */
const transfer = {
  method: 'POST',
  url: '/transfer',
  inputSource: 'body',
  command: { service: 'account', method: 'transfer' },
};

export default [transfer];
