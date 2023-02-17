/** @typedef {import('./types').Bus} IBus */
/** @typedef {import('./types').Command} ICommand */
/** @typedef {import('./types').PubSub} IPubSub */
/** @typedef {import('./types').CallData} CallData */
/** @typedef {import('./types').CallResponse} CallResponse */
/** @typedef {import('./types').InitLocal} Init */
import { EventEmitter } from 'node:events';

/** @implements {IBus} */
export class LocalBus {
  #ee;
  #services;
  #schemas;

  /** @type Init */
  constructor() {
    this.#ee = new EventEmitter();
    this.#services = new Map();
    this.#schemas = new Map();
  }

  /** @type IBus['listen'] */
  // eslint-disable-next-line @typescript-eslint/no-empty-function, class-methods-use-this
  async listen() {}

  /** @type IBus['teardown'] */
  // eslint-disable-next-line @typescript-eslint/no-empty-function, class-methods-use-this
  async teardown() {}

  /** @type IBus['getSchema'] */
  getSchema = async (service, method) => {
    const key = `${service}:${method}`;
    return this.#schemas.get(key);
  };

  /** @type IBus['setSchema'] */
  setSchema = async (service, method, schema) => {
    const key = `${service}:${method}`;
    this.#schemas.set(key, schema);
  };

  /** @type ICommand['call'] */
  call = async ({ service: serviceName, method }, payload) => {
    const service = this.#services.get(serviceName);
    const handler = service[method];
    if (!handler) {
      return [{ expected: false, message: 'Method not found' }, null];
    }
    const result = await handler(payload);
    return result;
  };

  /** @type ICommand['registerService'] */
  registerService = (name, service) => {
    this.#services.set(name, service);
  };

  /** @type IPubSub['publish'] */
  publish = async (event, payload) => {
    return this.#ee.emit(event, payload);
  };

  /** @type IPubSub['subscribe'] */
  subscribe = (event, handler) => {
    this.#ee.on(event, handler);
    return true;
  };

  /** @type IPubSub['unsubscribe'] */
  unsubscribe = (event, handler) => {
    this.#ee.removeListener(event, handler);
    return true;
  };
}
