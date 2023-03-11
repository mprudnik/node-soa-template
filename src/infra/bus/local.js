/** @typedef {import('./types').Bus} IBus */
/** @typedef {import('./types').Command} ICommand */
/** @typedef {import('./types').PubSub} IPubSub */
/** @typedef {import('./types').InitLocal} Init */
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';

/** @implements {IBus} */
export class LocalBus {
  #ee;
  #services;
  #schemas;

  #proxyMethods = ['call', 'publish'];

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
  getSchema = (service, method) => {
    const key = `${service}:${method}`;
    return this.#schemas.get(key);
  };

  /** @type IBus['setSchema'] */
  setSchema = async (service, method, schema) => {
    const key = `${service}:${method}`;
    this.#schemas.set(key, schema);
  };

  /** @type IBus['prefetchSchemas'] */
  // eslint-disable-next-line @typescript-eslint/no-empty-function, class-methods-use-this
  async prefetchSchemas() {}

  /** @type ICommand['call'] */
  call = async ({ service: serviceName, method }, { meta = {}, data }) => {
    const service = this.#services.get(serviceName);
    if (!service) {
      return [{ expected: false, message: 'Service not found' }, null];
    }

    const handler = service[method];
    if (!handler) {
      return [{ expected: false, message: 'Method not found' }, null];
    }

    meta.operationId = meta.operationId ?? randomUUID();
    const result = await handler({ meta, data });
    return result;
  };

  /** @type ICommand['registerService'] */
  registerService = (name, service) => {
    this.#services.set(name, service);
  };

  /** @type IPubSub['publish'] */
  publish = async (event, { meta = {}, data }) => {
    meta.operationId = meta.operationId ?? randomUUID();
    return this.#ee.emit(event, { meta, data });
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

  /** @type IBus['withMeta'] */
  withMeta = (meta) => {
    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop !== 'string' || !target.#proxyMethods.includes(prop)) {
          return undefined;
        }

        const method = target[prop];

        const handler = (/** @type {any} */ eventOrCommand, { meta: original = {}, data }) =>
          method(eventOrCommand, {
            data,
            meta: { ...original, ...meta },
          });

        return handler;
      },
    });
  };
}
