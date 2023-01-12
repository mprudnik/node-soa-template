/** @typedef {import('../types').HttpRoute} HttpRoute */

/** @type HttpRoute */
const transfer = {
  method: 'POST',
  url: '/transfer',
  schema: {
    source: 'body',
    input: {
      required: ['from', 'to', 'amount'],
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        amount: { type: 'number' },
      },
    },
    output: {
      required: ['transactionId'],
      properties: { transactionId: { type: 'string' } },
    },
  },
  command: 'account.transfert',
};

export const account = [transfer];
