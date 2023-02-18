import type { FastifyPluginAsync, FastifySchema } from 'fastify';
import type { API, HTTPRoute } from '../../types';
import type { ValidationSchema } from '../../../services/types';

export interface HttpPluginOptions {
  prefix: string;
  api: Required<API>['http'];
  getSchema: (
    service: string,
    method: string,
  ) => Promise<ValidationSchema | undefined>;
  executeCommand: (
    command: { service: string; method: string },
    meta: any,
    payload: any,
  ) => Promise<any>;
}

export interface SchemaOptions
  extends ValidationSchema,
    Pick<HTTPRoute, 'inputSource'> {
  service: string;
}

export function generateSchema(options: SchemaOptions): FastifySchema;

export type HttpPlugin = FastifyPluginAsync<HttpPluginOptions>;
