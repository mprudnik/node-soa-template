import type { FastifyPluginAsync } from 'fastify';
import type { FastifyAuthFunction } from '@fastify/auth';

export interface AuthPluginOptions {
  verifyToken: (
    token: string,
    definition: any,
  ) => Promise<{
    valid: boolean;
    access: boolean;
    message: string;
    session: any;
  }>;
}

export type AuthPlugin = FastifyPluginAsync<AuthPluginOptions>;

export type CustomAuth = (definition: any) => FastifyAuthFunction;

declare module 'fastify' {
  interface FastifyInstance {
    customAuth: CustomAuth;
  }
  interface FastifyRequest {
    session: any;
  }
}
