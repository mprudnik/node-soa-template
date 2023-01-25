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
    if (eventHandlers) initEventHandlers(infra, name, eventHandlers);
  }
};

/** @type ServiceFuncs['initCommands'] */
const initCommands = (infra, serviceName, commands) => {
  /** @type Service['commands'] */
  const initialized = {};

  for (const [commandName, fn] of Object.entries(commands)) {
    initialized[commandName] = wrapCommand(infra, fn, {
      logPrefix: `${serviceName}/${commandName}`,
    });
  }

  infra.bus.registerService(serviceName, initialized);
};

/** @type ServiceFuncs['initEventHandlers'] */
const initEventHandlers = (infra, serviceName, handlers) => {
  for (const [eventName, handler] of Object.entries(handlers)) {
    const wrapped = wrapEventHandler(infra, handler, {
      logPrefix: `${serviceName}/${eventName}`,
    });
    infra.bus.subscribe(eventName, wrapped);
  }
};

/** @type ServiceFuncs['wrapCommand'] */
const wrapCommand = (infra, func, options) => async (payload) => {
  const { logger } = infra;
  const { logPrefix } = options;
  const { operationId } = payload.meta;
  try {
    const wrappedInfra = wrapInfra(infra, operationId);
    const result = await func(wrappedInfra, payload);
    return [null, result];
  } catch (error) {
    const serviceError = processServiceError(error, logger, {
      operationId,
      logPrefix,
    });
    return [serviceError, null];
  }
};

/** @type ServiceFuncs['wrapEventHandler'] */
const wrapEventHandler = (infra, func, options) => async (payload) => {
  const { logger } = infra;
  const { logPrefix } = options;
  const { operationId } = payload.meta;
  try {
    const wrappedInfra = wrapInfra(infra, operationId);
    await func(wrappedInfra, payload);
  } catch (error) {
    processServiceError(error, logger, {
      operationId,
      logPrefix,
    });
  }
};

/** @type ServiceFuncs['wrapInfra'] */
const wrapInfra = (infra, operationId) => {
  const { bus, ...rest } = infra;
  return {
    ...rest,
    bus: {
      command: (commandName, payload) => {
        const wrappedMeta = { ...payload.meta, operationId };
        return bus.command(commandName, { ...payload, meta: wrappedMeta });
      },
      publish: (eventName, payload) => {
        const wrappedMeta = { ...payload.meta, operationId };
        return bus.publish(eventName, { ...payload, meta: wrappedMeta });
      },
    },
  };
};
