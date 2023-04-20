/** @typedef {import('./types').TestCommands} Commands */
import { testInput, testOutput } from './schema.js';

/** @type Commands['test'] */
const test = {
  input: testInput,
  output: testOutput,
  handler: async (_i, { meta, data }) => {
    const { operationId } = meta;
    const { input } = data;
    const output = `${operationId} - ${input}`;

    return { output };
  },
};

/** @type Commands */
export const commands = {
  test,
};
