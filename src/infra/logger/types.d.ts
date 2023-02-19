import { BaseLogger, Logger as FullLogger } from 'pino';

export type Logger = BaseLogger & Pick<FullLogger, 'child'>;
export interface LoggerOptions {
  env: 'development' | 'production' | 'test';
}

export function init(options: LoggerOptions): Logger;
