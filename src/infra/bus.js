/** @typedef {import('./types').Bus} IBus */
import { EventEmitter } from 'node:events';

/** @implements IBus */
export class Bus {
  #ee;
  #services;

  constructor() {
    this.#ee = new EventEmitter();
    this.#services = new Map();
  }

  command(name, payload, session) {
    const [serviceName, methodName] = name.split('.');
    const service = this.#services.get(serviceName);
    return service[methodName](payload, session);
  }

  registerService(name, service) {
    this.#services.set(name, service);
  }

  subscribe(event, handler) {
    this.#ee.on(event, handler);
    return true;
  }

  publish(event, data) {
    return this.#ee.emit(event, data);
  }
}
