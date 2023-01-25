/** @typedef {import('./types').init} init */
/** @typedef {import('./types').teardown} teardown */
import { randomUUID } from 'node:crypto';
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

  const serverId = randomUUID();
  const server = fastify({ logger });

  await server.register(auth, options.auth);
  await server.register(cors, options.cors);

  await server.register(swagger, options.swagger);
  await server.register(customAuth, {
    verifyToken: async (token, definition) => {
      const [error, result] = await bus.command(
        { service: 'auth', method: 'verify' },
        { meta: { definition }, data: { token } },
      );
      if (error) return { valid: false };
      return result;
    },
  });

  if (api.http) {
    await server.register(customHttp, {
      api: api.http,
      prefix: '/api',
      executeCommand: (command, payload, meta) =>
        bus.command(command, { meta, data: payload }),
    });
  }

  if (api.ws) {
    await server.register(customWebsocket, {
      serverId,
      bus,
    });
  }

  const { host, port, env, healthCheckUrl } = options;

  server.get(healthCheckUrl, async (_req, res) => {
    const dbHealthy = await db.$queryRaw`SELECT 1`.catch(() => false);

    const allGood = dbHealthy;

    return res.code(allGood ? 200 : 503).send('OK');
  });

  if (env !== 'test') await server.listen({ host, port });

  return server;
};

/** @type teardown */
export const teardown = async (infra, server) => {
  const { logger } = infra;
  logger.info('Stopping server');
  await server.close();
  logger.info('Server stoped');
};
