import type { FastifyInstance, RouteOptions } from 'fastify';
import type { FastifyCorsOptions } from '@fastify/cors';
import type { FastifyAuthPluginOptions } from '@fastify/auth';
import type { SwaggerPluginOptions } from './plugins/swagger/types';
import type { Infra } from '../infra/types';

export type Bus = Infra['bus'];

export interface HTTPRoute extends Pick<RouteOptions, 'method' | 'url'> {
  inputSource: 'body' | 'query';
  command: { service: string; method: string };
}

export interface HTTPRouteRaw extends Pick<RouteOptions, 'method' | 'url' | 'schema'> {
  preValidation?: (bus: Bus) => RouteOptions['preValidation'];
  handler: (bus: Bus) => RouteOptions['handler'];
}

export type Server = FastifyInstance;
export type API = {
  http?: Record<string, Record<string, HTTPRoute | HTTPRouteRaw>>;
  ws?: any;
};

export interface ServerConfig {
  serverId: string;
  host: string;
  port: number;
  enabledApi: {
    http: boolean;
    ws: boolean;
  };
  healthCheckUrl: string;
  cors: FastifyCorsOptions;
  auth: FastifyAuthPluginOptions;
  swagger: SwaggerPluginOptions;
}

export function init(infra: Infra, api: API, config: ServerConfig): Promise<Server>;
export function teardown(infra: Infra, server: Server): Promise<void>;
