import fp from 'fastify-plugin';
import plugin from '@fastify/websocket';

export const websocket = (options) =>
  fp(async (fastify) => {
    await fastify.register(plugin, { options });
  });
