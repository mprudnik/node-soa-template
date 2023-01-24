import type { PrismaClient, Prisma } from '@prisma/client';
import { BaseLogger } from 'pino';

type Event = { meta: any; data: any };
type EventHandler = (event: Event) => any;

export type Logger = Pick<BaseLogger, 'silent' | 'trace' | 'level' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
export type DB = PrismaClient;
export interface Bus {
  command(command: { service: string; method: string; }, payload: object): Promise<any>;
  registerService(name: string, service: object): void;
  unsubscribe(eventName: string, handler: EventHandler): boolean;
  subscribe(eventName: string, handler: EventHandler): boolean;
  publish(eventName: string, event: Event): boolean;
}

export type Infra = {
  bus: Bus;
  logger: Logger;
  db: DB;
};

export type LoggerConfig = { env: string };
export type DBConfig = Prisma.PrismaClientOptions;
export type InfraConfig = {
  logger: LoggerConfig;
  db: DBConfig;
}
