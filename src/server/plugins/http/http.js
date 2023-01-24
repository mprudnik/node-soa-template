/** @typedef {import('fastify').RouteOptions} RouteOptions */
/** @typedef {import('./types').HttpPlugin} Plugin */
import fp from 'fastify-plugin';
import { generateSchema } from './schema.js';

const options = {
  name: 'custom-http-routes',
  fastify: '4.x',
  dependencies: ['custom-auth'],
};

/** @type Plugin */
const http = async (server, options) => {
  const { api, prefix, executeCommand } = options;

  for (const [service, routes] of Object.entries(api)) {
    for (const route of routes) {
      const { method, url, input, output, auth, command } = route;

      const schema = generateSchema({ service, input, output, auth });

      /** @type RouteOptions */
      const routeOptions = {
        method,
        url: `${prefix}/${service}${url}`,
        schema,
        handler: async (req, res) => {
          const payload = input ? req[input.source] : {};
          const { session } = req;
          const [error, result] = await executeCommand(command, payload, {
            session,
          });
          if (error) {
            const [code, message, level, stack] = error.expected
              ? [400, error.message, 'warn', undefined]
              : [500, 'Internal server error', 'error', error?.stack];
            res.log[level]({ stack }, `${service}${url}: ${error?.message}`);
            return res.code(code).send({ message });
          }
          const [code, data] = output ? [200, result] : [204, null];
          return res.code(code).send(data);
        },
      };

      if (auth) routeOptions.onRequest = server.customAuth(auth);

      server.route(routeOptions);
    }
  }
};

export default fp(http, options);
