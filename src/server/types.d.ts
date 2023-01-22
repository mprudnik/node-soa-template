import type { FastifyInstance, RouteOptions } from "fastify";
import type { Infra } from '../infra/types';
import type { FastifyCorsOptions } from '@fastify/cors';
import type { FastifyAuthPluginOptions } from '@fastify/auth';
import type { SwaggerPluginOptions } from './plugins/swagger/types';

export interface HTTPRoute extends Pick<RouteOptions, 'method' | 'url'> {
  auth?: unknown;
  input?: {
    source: 'body' | 'query';
    required?: string[];
    properties: Record<string, unknown>;
  };
  output?: unknown;
  command: { service: string; method: string; };
}

export type Server = FastifyInstance;
export type API = { http?: Record<string, HTTPRoute[]>; ws?: any };

export interface ServerConfig {
  host: string;
  port: number;
  healthCheckUrl: string;
  env: string;
  cors: FastifyCorsOptions;
  auth: FastifyAuthPluginOptions;
  swagger: SwaggerPluginOptions;
}

export function init(infra: Infra, api: API, config: ServerConfig): Promise<Server>;
export function teardown(infra: Infra, server: Server): Promise<void>;

