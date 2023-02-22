/** @typedef {import('./types').Service} Service */
/** @typedef {import('./types')} ServiceFuncs */
import { processServiceError } from './error.js';
import * as notification from './notification/notification.js';
import * as auth from './auth/auth.js';
import * as account from './account/account.js';

/** @type {Record<string, Service>} */
const services = {
  auth,
  notification,
  account,
};

/** @type ServiceFuncs['init'] */
export const init = async (infra, config) => {
  const { enabledServices: enabled } = config;
  for (const [serviceName, service] of Object.entries(services)) {
    if (enabled !== 'all' && !enabled.includes(serviceName)) continue;
    const { commands, eventHandlers } = service;
    if (commands) await initCommands(infra, serviceName, commands);
    if (eventHandlers) initEventHandlers(infra, serviceName, eventHandlers);
  }
};

/** @type ServiceFuncs['initCommands'] */
const initCommands = async (infra, serviceName, commands) => {
  /** @type Service['commands'] */
  const initialized = {};

  for (const [commandName, command] of Object.entries(commands)) {
    const { handler, ...schema } = command;
    const wrapped = wrapServiceFunction(infra, handler, {
      source: `${serviceName}/${commandName}`,
    });
    initialized[commandName] = wrapped;
    await infra.bus.setSchema(serviceName, commandName, schema);
  }

  infra.bus.registerService(serviceName, initialized);
};

/** @type ServiceFuncs['initEventHandlers'] */
const initEventHandlers = (infra, serviceName, handlers) => {
  for (const [eventName, handler] of Object.entries(handlers)) {
    const wrapped = wrapServiceFunction(infra, handler, {
      source: `${serviceName} - ${eventName}`,
    });
    infra.bus.subscribe(eventName, wrapped);
  }
};

/** @type ServiceFuncs['wrapServiceFunction'] */
const wrapServiceFunction = (infra, fn, options) => async (payload) => {
  const { bus } = infra;
  const { source } = options;
  const { meta } = payload;
  const logger = infra.logger.child({ meta, source });
  try {
    const wrappedInfra = {
      ...infra,
      bus: bus.withMeta(meta),
      logger,
    };
    const result = await fn(wrappedInfra, payload);
    return [null, result];
  } catch (error) {
    const serviceError = processServiceError(error, logger);
    return [serviceError, null];
  }
};
