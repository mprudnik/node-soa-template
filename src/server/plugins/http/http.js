/** @typedef {import('fastify').RouteOptions} RouteOptions */
/** @typedef {import('./types').HttpPlugin} Plugin */
/** @typedef {import('./types')} PluginFuncs */
import fp from 'fastify-plugin';
import { generateSchema } from './schema.js';

const options = {
  name: 'custom-http-routes',
  fastify: '4.x',
  dependencies: ['custom-auth'],
};

class SystemError extends Error {
  constructor({ message, expected, url }) {
    super(message);
    this.expected = expected;
    this.url = url;
  }
}

/** @type Plugin */
const http = async (server, options) => {
  const { api, prefix, bus } = options;

  for (const [service, routes] of Object.entries(api)) {
    for (const route of Object.values(routes)) {
      const fullUrl = `${prefix}/${service}${route.url}`;

      const routeOptions =
        'handler' in route
          ? getRouteOptionsFromRaw(route, fullUrl, bus)
          : getRouteOptions(route, fullUrl, bus, server);

      if (!routeOptions) continue;

      server.route(routeOptions);
    }
  }

  const defaultErrorHandler = server.errorHandler;
  server.setErrorHandler((error, req, res) => {
    if (error instanceof SystemError) {
      const [code, message, logLevel] = error.expected
        ? [400, error.message, 'warn']
        : [500, 'Internal server error', 'error'];

      server.log[logLevel]({ url: error.url }, `Server error`);
      return res.code(code).send({ message });
    } else return defaultErrorHandler(error, req, res);
  });
};

/** @type PluginFuncs['getRouteOptions'] */
const getRouteOptions = (route, url, bus, server) => {
  const { method, inputSource, command } = route;

  const validationSchema = bus.getSchema(command.service, command.method);
  if (!validationSchema) {
    server.log.warn(`Missing schema for ${url}. Ignoring route`);
    return null;
  }

  const { auth, input, output } = validationSchema;
  const schema = generateSchema({
    service: command.service,
    inputSource,
    ...validationSchema,
  });

  /** @type RouteOptions */
  const routeOptions = {
    method,
    url,
    schema,
    handler: async (req, res) => {
      const { operationId, ...data } = /** @type any */ (input ? req[inputSource] : {});
      const { session } = req;
      const payload = { meta: { ...session, operationId }, data };

      const [err, result] = await bus.call(command, payload);

      if (err) throw new SystemError({ ...err, url });

      const [code, response] = output ? [200, result] : [204, null];
      return res.code(code).send(response);
    },
  };

  if (auth) routeOptions.onRequest = server.customAuth(auth);

  return routeOptions;
};

/** @type PluginFuncs['getRouteOptionsFromRaw'] */
const getRouteOptionsFromRaw = (route, url, bus) => {
  const { method, schema, handler, preValidation } = route;

  /** @type RouteOptions */
  const routeOptions = {
    method,
    url,
    schema,
    handler: handler.bind(null, bus),
  };

  if (preValidation) {
    routeOptions.preValidation = preValidation.bind(null, bus);
  }

  return routeOptions;
};

export default fp(http, options);
