/** @typedef {import('./types').Config['infra']} Infra */
import { nodeEnv, serverId } from './util.js';

/** @type Infra */
export default {
  logger: { env: nodeEnv },
  db: { errorFormat: 'minimal' },
  redis: {},
  bus: { type: 'distributed', serverId },
};
