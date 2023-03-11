/** @typedef {import('./types').init} init */
/** @typedef {import('pino').LoggerOptions} Options */
import { pino } from 'pino';

/** @type {Record<string, string>} */
const PinoLevelToSeverityLookup = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

/** @type {Record<string, Options>} */
const options = {
  development: {
    level: 'trace',
    transport: {
      target: 'pino-pretty',
      options: {
        ignore: 'pid,hostname',
      },
    },
  },
  production: {
    messageKey: 'message',
    formatters: {
      level(label, number) {
        return {
          severity: PinoLevelToSeverityLookup[label] || PinoLevelToSeverityLookup.info,
          level: number,
        };
      },
    },
  },
  test: {
    level: 'silent',
  },
};

/** @type init */
export const init = ({ env }) => pino(options[env]);
