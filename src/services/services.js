/** @typedef {import('./types')} ServiceFuncs */
/** @typedef {import('./types').Service} Service */
import * as auth from './auth/auth.js';
import * as account from './account/account.js';
import * as notification from './notification/notification.js';
import { processServiceError } from './error.js';

/** @type {Record<string, Service>} */
const services = {
  auth,
  account,
  notification,
};

/** @type ServiceFuncs['init'] */
export const init = async (infra) => {
  for (const [name, service] of Object.entries(services)) {
    const { commands, eventHandlers } = service;
    if (commands) initCommands(infra, name, commands);
    if (eventHandlers) initEventHandlers(infra, eventHandlers);
  }
};

/** @type ServiceFuncs['initCommands'] */
const initCommands = (infra, serviceName, commands) => {
  /** @type Service['commands'] */
  const initialized = {};

  for (const [name, fn] of Object.entries(commands)) {
    initialized[name] = wrapCommand(infra, fn, {
      logPrefix: `${serviceName}/${name}`,
    });
  }

  infra.bus.registerService(serviceName, initialized);
};

/** @type ServiceFuncs['initEventHandlers'] */
const initEventHandlers = (infra, handlers) => {
  for (const [eventName, handler] of Object.entries(handlers)) {
    infra.bus.subscribe(eventName, handler.bind(null, infra));
  }
};

/** @type ServiceFuncs['wrapCommand'] */
const wrapCommand = (infra, func, options) => async (payload) => {
  const { logger } = infra;
  const { logPrefix } = options;
  const { operationId } = payload.meta;
  try {
    const result = func(infra, payload);
    return [null, result];
  } catch (error) {
    const serviceError = processServiceError(error, logger, {
      operationId,
      logPrefix,
    });
    return [serviceError, null];
  }
};
