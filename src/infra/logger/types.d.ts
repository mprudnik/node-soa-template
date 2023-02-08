import { BaseLogger } from 'pino';

export type Logger = Pick<
  BaseLogger,
  'level' | 'silent' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
>;

export interface LoggerOptions {
  env: 'development' | 'production' | 'test';
}

export function init(options: LoggerOptions): Logger;
