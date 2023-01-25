/** @typedef {import('./types').Bus} BusInterface */
/** @typedef {import('./types').CommandHandler} CommandHandler */
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

/** @implements {BusInterface} */
class Bus {
  #ee;
  /** @type {Map<string, Record<string, CommandHandler>>} */
  #services;

  constructor() {
    this.#ee = new EventEmitter();
    this.#services = new Map();
  }

  /** @type BusInterface['command'] */
  command({ service: serviceName, method }, payload) {
    const service = this.#services.get(serviceName);
    if (!service) {
      return Promise.resolve([
        { expected: false, message: 'Service not found' },
        null,
      ]);
    }

    const handler = service[method];
    if (!handler) {
      return Promise.resolve([
        { expected: false, message: 'Method not found' },
        null,
      ]);
    }

    const operationId = randomUUID();
    const wrappedMeta = { ...payload.meta, operationId };
    return handler({ ...payload, meta: wrappedMeta });
  }

  /** @type BusInterface['registerService'] */
  registerService(name, service) {
    this.#services.set(name, service);
  }

  /** @type BusInterface['subscribe'] */
  subscribe(event, handler) {
    this.#ee.on(event, handler);
    return true;
  }

  /** @type BusInterface['unsubscribe'] */
  unsubscribe(event, handler) {
    this.#ee.removeListener(event, handler);
    return true;
  }

  /** @type BusInterface['publish'] */
  publish(event, payload) {
    return this.#ee.emit(event, payload);
  }
}

export const init = () => new Bus();
