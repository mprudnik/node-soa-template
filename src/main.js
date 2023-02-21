import config from './config/config.js';
import * as api from './api/api.js';
import { init as initInfra, teardown as teardownInfra } from './infra/infra.js';
import { init as initServices } from './services/services.js';
import {
  init as initServer,
  teardown as teardownServer,
} from './server/server.js';

const start = async () => {
  const infra = await initInfra(config.infra);

  await initServices(infra);

  await infra.bus.listen();

  const server = await initServer(infra, api, config.server);

  return {
    app: server,
    teardown: async () => {
      infra.logger.info('Starting graceful shutdown');
      await teardownServer(infra, server);
      await teardownInfra(infra);
      infra.logger.info('App terminated successfully');
    },
  };
};

try {
  let stopping = false;
  const { teardown } = await start();
  process.on('SIGINT', async () => {
    if (stopping) return;
    stopping = true;
    await teardown();
    process.exit(0);
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
