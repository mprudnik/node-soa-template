import fp from 'fastify-plugin';
import plugin from '@fastify/request-context';

export const context = (options) =>
  fp(async (fastify) => {
    await fastify.register(plugin, options);
  });
