import type { FastifyPluginAsync } from 'fastify';
import type { FastifyAuthFunction } from '@fastify/auth';

type AuthFailure = { valid: boolean; access: boolean; message: string };
type AuthSuccess = { valid: true; access: true; session: any };
export interface AuthPluginOptions {
  verifyToken: (token: string, definition: any) => Promise<AuthSuccess | AuthFailure>;
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
