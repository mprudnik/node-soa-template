import type { RedisClientType, RedisClientOptions } from 'redis';
import type { Logger } from '../logger/types';

export type RedisOptions = RedisClientOptions;
export type Redis = RedisClientType;

export function init(deps: { logger: Logger }, options: RedisOptions): Promise<Redis>;
export function teardown(deps: { logger: Logger; redis: Redis }): Promise<void>;
