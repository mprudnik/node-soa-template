import type { FastifyInstance,  FastifyServerOptions } from 'fastify';
import type { FastifyCorsOptions } from '@fastify/cors'
import type { HttpRouter } from '../api/types';
import type { Infra } from '../infra/types';
import type { Session } from '../types';

export type ServerConfig = {
  host: string;
  port: number;
  instance: FastifyServerOptions;
  cors: FastifyCorsOptions;
  swagger: {
    title: string;
    version: string;
    routePrefix: string;
    serverUrl: string;
  }
};

export function init(
  router: HttpRouter,
  infra: Infra,
  config: ServerConfig
): Promise<FastifyInstance>;

declare module 'fastify' {
  interface FastifyInstance {
    getAuthToken: (req: FastifyRequest) => string;
  }

  interface FastifyRequest {
    session: Session;
  }
}

