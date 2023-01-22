/** @typedef {import('./types').Bus} BusInterface */
import { EventEmitter } from 'node:events';

/** @implements {BusInterface} */
class Bus {
  #ee;
  #services;

  constructor() {
    this.#ee = new EventEmitter();
    this.#services = new Map();
  }

  /** @type BusInterface['command'] */
  command({ service: serviceName, method }, payload) {
    const service = this.#services.get(serviceName);
    return service[method](payload);
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
