/** @typedef {import('./types').SwaggerPlugin} Plugin */
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

/** @type Plugin */
const plugin = async (fastify, options) => {
  const { title, description, version, serverUrl, routePrefix } = options;

  await fastify.register(swagger, {
    openapi: {
      info: { title, description, version },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here',
      },
      servers: [{ url: serverUrl }],
      components: {
        securitySchemes: {
          token: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, { routePrefix });
};

export default fp(plugin);
