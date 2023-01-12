import fp from 'fastify-plugin';
import plugin from '@fastify/auth';

export const auth = (options) =>
  fp(async (fastify) => {
    await fastify.register(plugin, options);
  });
