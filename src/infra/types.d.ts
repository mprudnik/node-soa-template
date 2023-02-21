import type { Logger, LoggerOptions } from './logger/types';
import type { DB, DBOptions } from './db/types';
import type { Redis, RedisOptions } from './redis/types';
import type { Bus, BusOptions } from './bus/types';

export interface InfraOptions {
  logger: LoggerOptions;
  db: DBOptions;
  redis: RedisOptions;
  bus: BusOptions;
}

export interface Infra {
  logger: Logger;
  db: DB;
  redis: Redis;
  bus: Bus;
}

export function init(options: InfraOptions): Promise<Infra>;
export function teardown(infra: Infra): Promise<void>;
