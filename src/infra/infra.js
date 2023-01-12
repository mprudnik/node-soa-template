/** @typedef {import('./types').Infra} Infra */
/** @typedef {import('./types').InfraConfig} Config */
import { init as initLogger } from './logger.js';
import { init as initDB, teardown as teardownDB } from './db.js';
import { init as initWS } from './ws.js';
import { Bus } from './bus.js';

/** @type function(Config): Promise<Infra> */
export const init = async (config) => {
  const bus = new Bus();
  const logger = initLogger(config.logger);
  const db = await initDB({ logger }, config.db);
  const ws = initWS();

  return { bus, logger, db, ws };
};

/** @type function(Infra): Promise<void> */
export const teardown = async ({ db, logger }) => {
  await teardownDB({ db, logger });
};
