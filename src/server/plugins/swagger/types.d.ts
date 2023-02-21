import type { FastifyPluginAsync } from 'fastify';

export interface SwaggerPluginOptions {
  title: string;
  description: string;
  version: string;
  serverUrl: string;
  routePrefix: string;
}

export type SwaggerPlugin = FastifyPluginAsync<SwaggerPluginOptions>;
