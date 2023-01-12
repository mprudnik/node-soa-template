import type { PrismaClient, Prisma } from '@prisma/client';
import { BaseLogger } from 'pino';
import { Session } from '../types';

type Event = Record<string, any>;
interface EventHandler {
  (event: Event): any;
}

export type Logger = Pick<BaseLogger, 'silent' | 'trace' | 'level' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
export type DB = PrismaClient;
export interface Bus {
  command(commandName: string, payload: object, session?: Session): Promise<any>;
  registerService(name: string, service: object): void;

  subscribe(eventName: string, handler: EventHandler): boolean;
  publish(eventName: string, event: Event): boolean;
}

type WSMessage = Record<string, any>;
export interface WS {
  has(id: string): boolean;
  add(id: string, socket: any): void;
  remove(id: string): void;
  send(id: string, data: WSMessage): void;
}
export type Infra = {
  bus: Bus;
  logger: Logger;
  db: DB;
  ws: WS;
};

export type LoggerConfig = { env: string };
export type DBConfig = Prisma.PrismaClientOptions;
export type InfraConfig = {
  logger: LoggerConfig;
  db: DBConfig;
}
