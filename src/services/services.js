/** @typedef {import('./types')} ServiceFuncs */
/** @typedef {import('./types').Service} Service */
/** @typedef {import('./types').WrappedCommandResult} CommandResult */
import * as auth from './auth/auth.js';
import * as account from './account/account.js';
import * as notification from './notification/notification.js';
import { AppError } from '../lib/error.js';

/** @type {Record<string, Service>} */
const services = {
  auth,
  account,
  notification,
};

/** @type ServiceFuncs['wrapCommand'] */
const wrapCommand = (infra, func) => async (payload) => {
  try {
    const result = func(infra, payload);
    return [null, result];
  } catch (/** @type any */ error) {
    const expected = error instanceof AppError;
    /** @type CommandResult */
    const wrapped = [{ message: error?.message, expected }, null];
    return wrapped;
  }
};

/** @type ServiceFuncs['initCommands'] */
const initCommands = (infra, serviceName, commands) => {
  /** @type Service['commands'] */
  const initialized = {};

  for (const [name, fn] of Object.entries(commands)) {
    initialized[name] = wrapCommand(infra, fn);
  }

  infra.bus.registerService(serviceName, initialized);
};

/** @type ServiceFuncs['initEventHandlers'] */
const initEventHandlers = (infra, handlers) => {
  for (const [eventName, handler] of Object.entries(handlers)) {
    infra.bus.subscribe(eventName, handler.bind(null, infra));
  }
};

/** @type ServiceFuncs['init'] */
export const init = async (infra) => {
  for (const [name, service] of Object.entries(services)) {
    const { commands, eventHandlers } = service;
    if (commands) initCommands(infra, name, commands);
    if (eventHandlers) initEventHandlers(infra, eventHandlers);
  }
};
