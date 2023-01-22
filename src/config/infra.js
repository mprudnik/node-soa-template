/** @typedef {import('./types').Config['infra']} Infra */
import { nodeEnv } from './util.js';

/** @type Infra */
export default {
  logger: { env: nodeEnv },
  db: { errorFormat: 'minimal' },
};
