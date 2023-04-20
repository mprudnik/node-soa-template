/** @typedef {import('../types').HTTPRoute} HttpRoute */

/** @type HttpRoute */
export const test = {
  method: 'POST',
  url: '/test',
  inputSource: 'body',
  command: { service: 'test', method: 'test' },
};
