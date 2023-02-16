/** @typedef {import('./types').Service} Service */
/** @typedef {import('./types').initCommands} initCommands */
/** @typedef {import('./types').initEventHandlers} initEventHandlers */
/** @typedef {import('./types').init} init */
import * as notification from './notification/notification.js';
import * as auth from './auth/auth.js';
import * as account from './account/account.js';

/** @type {Record<string, Service>} */
const services = {
  auth,
  notification,
  account,
};

/** @type initCommands */
const initCommands = async (infra, serviceName, commands) => {
  /** @type Service['commands'] */
  const initialized = {};

  for (const [name, command] of Object.entries(commands)) {
    const { handler, ...schema } = command;
    initialized[name] = handler.bind(null, infra);
    await infra.bus.setSchema(serviceName, name, schema);
  }

  infra.bus.registerService(serviceName, initialized);
};

/** @type initEventHandlers */
const initEventHandlers = (infra, handlers) => {
  for (const [eventName, handler] of Object.entries(handlers)) {
    infra.bus.subscribe(eventName, handler.bind(null, infra));
  }
};

/** @type init */
export const init = async (infra) => {
  for (const [name, service] of Object.entries(services)) {
    const { commands, eventHandlers } = service;
    if (commands) await initCommands(infra, name, commands);
    if (eventHandlers) initEventHandlers(infra, eventHandlers);
  }
};
