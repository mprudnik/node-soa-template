import type { FastifyPluginAsync } from 'fastify';
import type { Infra } from '../../../infra/types';

export interface WebsocketPluginOptions {
  serverId: string;
  bus: Infra['bus'];
}

export type WebsocketPlugin = FastifyPluginAsync<WebsocketPluginOptions>;
