export const testInput = /** @type {const} */ ({
  type: 'object',
  additionalProperties: false,
  required: ['input'],
  properties: { input: { type: 'string' } },
});
export const testOutput = /** @type {const} */ ({
  type: 'object',
  additionalProperties: false,
  required: ['output'],
  properties: { output: { type: 'string' } },
});
