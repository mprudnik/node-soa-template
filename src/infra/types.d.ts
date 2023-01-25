import type { PrismaClient, Prisma } from '@prisma/client';
import { BaseLogger } from 'pino';

export interface DefaultMeta {
  operationId: string;
  [key: string]: unknown;
}
export type Payload<Meta = object, Data = unknown> = { meta: Meta, data: Data };
export type Event = Payload;
type EventHandler = (event: Event) => any;
export type CommandHandler = (payload: Payload<DefaultMeta>) => Promise<CommandResult>;
export type ServiceError = { message: string; expected: boolean };
export type CommandResult = [ServiceError | null, any];

export type Logger = Pick<BaseLogger, 'silent' | 'trace' | 'level' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
export type DB = PrismaClient;
export interface Bus {
  command(command: { service: string; method: string; }, payload: Payload): Promise<CommandResult>;
  registerService(name: string, service: Record<string, CommandHandler>): void;
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
