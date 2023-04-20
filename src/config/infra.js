/** @typedef {import('./types').Config['infra']} Infra */
import { nodeEnv, getServerId } from './util.js';

const busType = /** @type Infra['bus']['type'] */ (process.env.BUS_TYPE) || 'local';
/** @type Infra['bus'] */
const busConfig =
  busType === 'local'
    ? { type: busType }
    : {
        type: busType,
        serverId: getServerId(),
        readInterval: parseInt(process.env.BUS_READ_INTERVAL || '') || 1000,
        callTimeout: parseInt(process.env.BUS_CALL_TIMEOUT || '') || 2000,
        maxEventStreamSize: parseInt(process.env.BUS_EVENT_STREAM_SIZE || '') || 500,
        maxCallStreamSize: parseInt(process.env.BUS_CALL_STREAM_SIZE || '') || 5000,
      };

/** @type Infra */
export default {
  logger: { env: nodeEnv },
  db: { errorFormat: 'minimal' },
  redis: { url: process.env.REDIS_URL },
  bus: busConfig,
};
