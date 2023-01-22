import type { FastifyPluginAsync, FastifySchema } from "fastify";
import type { API, HTTPRoute } from '../../types';

export interface HttpPluginOptions {
  prefix: string;
  api: Required<API>['http'],
  executeCommand: (
    command: { service: string; method: string },
    meta: any,
    payload: any,
  ) => Promise<any>;
}

export interface SchemaOptions extends Pick<HTTPRoute, 'auth' | 'input' | 'output'> {
  service: string;
}

export function generateSchema(options: SchemaOptions): FastifySchema;

export type HttpPlugin = FastifyPluginAsync<HttpPluginOptions>;

