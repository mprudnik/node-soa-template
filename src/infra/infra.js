/** @typedef {import('./types')} Infra */
import { init as initLogger } from './logger/logger.js';
import { init as initDB, teardown as teardownDB } from './db/db.js';
import { init as initRedis, teardown as teardownRedis } from './redis/redis.js';
import { init as initBus, teardown as teardownBus } from './bus/bus.js';

/** @type Infra['init'] */
export const init = async (config) => {
  const logger = initLogger(config.logger);
  const redis = await initRedis({ logger }, config.redis);
  const db = await initDB({ logger }, config.db);
  const bus = initBus({ logger, redis }, config.bus);

  return { logger, redis, db, bus };
};

/** @type Infra['teardown'] */
export const teardown = async ({ db, logger, redis, bus }) => {
  await teardownBus({ bus, logger });
  await teardownRedis({ redis, logger });
  await teardownDB({ db, logger });
};
