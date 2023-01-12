import fp from 'fastify-plugin';
import plugin from '@fastify/cors';

export const cors = (options) =>
  fp(async (fastify) => {
    await fastify.register(plugin, options);
  });
