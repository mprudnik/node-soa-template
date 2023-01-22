/** @typedef {import('./types').Infra} Infra */
/** @typedef {import('./types').InfraConfig} Config */
import { init as initLogger } from './logger.js';
import { init as initDB, teardown as teardownDB } from './db.js';
import { init as initBus } from './bus.js';

/** @type function(Config): Promise<Infra> */
export const init = async (config) => {
  const bus = initBus();
  const logger = initLogger(config.logger);
  const db = await initDB({ logger }, config.db);

  return { bus, logger, db };
};

/** @type function(Infra): Promise<void> */
export const teardown = async ({ db, logger }) => {
  await teardownDB({ db, logger });
};
