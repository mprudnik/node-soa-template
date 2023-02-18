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
  const { api, prefix, getSchema, executeCommand } = options;

  for (const [service, routes] of Object.entries(api)) {
    for (const route of routes) {
      const { method, url, inputSource, command } = route;

      const validationSchema = await getSchema(command.service, command.method);
      if (!validationSchema) {
        server.log.warn(`Missing schema for ${service}${url}. Ignoring route`);
        continue;
      }

      const { auth, input, output } = validationSchema;
      const schema = generateSchema({
        service,
        inputSource,
        ...validationSchema,
      });

      /** @type RouteOptions */
      const routeOptions = {
        method,
        url: `${prefix}/${service}${url}`,
        schema,
        handler: async (req, res) => {
          const payload = input ? req[inputSource] : {};
          const { session } = req;
          const result = await executeCommand(command, payload, { session });
          const [code, data] = output ? [200, result] : [204, null];
          res.code(code).send(data);
        },
      };

      if (auth) routeOptions.onRequest = server.customAuth(auth);

      server.route(routeOptions);
    }
  }
};

export default fp(http, options);
