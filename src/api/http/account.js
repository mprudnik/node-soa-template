/** @typedef {import('../types').HTTPRoute} HttpRoute */
import * as schemaUtils from '../../lib/schema.js';

/** @type HttpRoute */
const transfer = {
  method: 'POST',
  url: '/transfer',
  auth: {},
  input: {
    source: 'body',
    required: ['from', 'to', 'amount'],
    properties: {
      from: { type: 'string' },
      to: { type: 'string' },
      amount: { type: 'number' },
    },
  },
  output: schemaUtils.toObject({
    required: ['transactionId'],
    properties: { transactionId: { type: 'string' } },
  }),
  command: { service: 'account', method: 'transfer' },
};

export default [transfer];
