import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifySchema,
  RouteOptions,
} from 'fastify';
import type { API, HTTPRoute, HTTPRouteRaw, Bus } from '../../types';
import type { ValidationSchema } from '../../../services/types';

export interface HttpPluginOptions {
  prefix: string;
  api: Required<API>['http'];
  bus: Bus;
}

export interface SchemaOptions
  extends ValidationSchema,
    Pick<HTTPRoute, 'inputSource'> {
  service: string;
}

export function getRouteOptions(
  route: HTTPRoute,
  service: string,
  fullUrl: string,
  server: FastifyInstance,
  bus: Bus,
): Promise<RouteOptions | null>;
export function getRouteOptionsFromRaw(
  route: HTTPRouteRaw,
  fullUrl: string,
  bus: Bus,
): RouteOptions;

export function generateSchema(options: SchemaOptions): FastifySchema;

export type HttpPlugin = FastifyPluginAsync<HttpPluginOptions>;
