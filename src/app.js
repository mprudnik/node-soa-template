import { config } from './config.js';
import * as server from './server/server.js';
import * as infra from './infra/infra.js';
import * as services from './services/services.js';
import * as router from './api/router.js';

export const init = async () => {
  const infrastructure = await infra.init(config.infra);

  await services.init(infrastructure);

  const serverInstance = await server.init(
    router.http,
    infrastructure,
    config.server,
  );

  return async () => {
    infrastructure.logger.info('Stopping application');
    await serverInstance.close();
    await infra.teardown(infrastructure);
  };
};
