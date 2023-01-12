import fp from 'fastify-plugin';
import plugin from '@fastify/swagger';
import pluginUi from '@fastify/swagger-ui';

export const swagger = (options) =>
  fp(async (fastify) => {
    const { title, routePrefix, serverUrl, version } = options;
    await fastify.register(plugin, {
      openapi: {
        info: {
          title,
          description: `API docs for ${title} project`,
          version,
        },
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

    await fastify.register(pluginUi, { routePrefix });
  });
