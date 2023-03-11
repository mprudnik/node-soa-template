import config from './config/config.js';
import * as api from './api/api.js';
import { init as initInfra, teardown as teardownInfra } from './infra/infra.js';
import { init as initServices } from './services/services.js';
import { init as initServer, teardown as teardownServer } from './server/server.js';

export const start = async (conf = config) => {
  const infra = await initInfra(conf.infra);

  await initServices(infra, conf.services);

  await infra.bus.prefetchSchemas();
  const server = await initServer(infra, api, conf.server);

  await infra.bus.listen();

  if (conf.env !== 'test') {
    const { host, port } = conf.server;
    await server.listen({ host, port });
  }

  return {
    app: server,
    infra,
    teardown: async () => {
      infra.logger.info('Starting graceful shutdown');
      await teardownServer(infra, server);
      await teardownInfra(infra);
      infra.logger.info('App terminated successfully');
    },
  };
};
