/** @typedef {import('./types').init} init */
/** @typedef {import('./types').teardown} teardown */
import { fastify } from 'fastify';
import auth from '@fastify/auth';
import cors from '@fastify/cors';

import swagger from './plugins/swagger/swagger.js';
import customAuth from './plugins/auth/auth.js';
import customHttp from './plugins/http/http.js';
import customWebsocket from './plugins/websocket/websocket.js';

/** @type init */
export const init = async (infra, api, options) => {
  const { bus, logger, db } = infra;
  const { serverId, enabledApi, healthCheckUrl } = options;

  const server = fastify({ logger });

  await server.register(auth, options.auth);
  await server.register(cors, options.cors);

  await server.register(swagger, options.swagger);
  await server.register(customAuth, {
    verifyToken: async (token, definition) => {
      const [error, session] = await bus.call(
        { service: 'auth', method: 'verify' },
        { data: { token, definition } },
      );
      if (error) return { valid: false, access: false, message: error.message };

      return { valid: true, access: true, session };
    },
  });

  if (enabledApi.http && api.http) {
    await server.register(customHttp, {
      api: api.http,
      prefix: '/api',
      bus,
    });
  }

  if (enabledApi.ws) {
    await server.register(customWebsocket, {
      serverId,
      bus,
    });
  }

  server.get(healthCheckUrl, async (_req, res) => {
    const dbHealthy = await db.$queryRaw`SELECT 1`.catch(() => false);

    const allGood = dbHealthy;

    return res.code(allGood ? 200 : 503).send('OK');
  });

  return server;
};

/** @type teardown */
export const teardown = async (infra, server) => {
  const { logger } = infra;
  logger.info('Stopping server');
  await server.close();
  logger.info('Server stoped');
};
