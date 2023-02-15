/** @typedef {import('./types').Bus} IBus */
/** @typedef {import('./types').Command} ICommand */
/** @typedef {import('./types').PubSub} IPubSub */
/** @typedef {import('./types').CallData} CallData */
/** @typedef {import('./types').CallResponse} CallResponse */
/** @typedef {import('./types').InitDistributed} Init */
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

// Create general implementation that will work without
// dependency on local bus.
// PubSub should be implemented using redis streams.
/** @implements {IBus} */
export class DistributedBus {
  #services;
  #eventHandlers;
  #redis;
  #calls;

  /** @type string */
  #serverId;
  /** @type boolean */
  #terminating = false;

  /** @type Init */
  constructor({ redis }, { serverId }) {
    this.#serverId = serverId;
    this.#redis = redis;
    this.#eventHandlers = new Map();
    this.#services = new Map();
    this.#calls = new Map();
  }

  /** @type IBus['listen'] */
  async listen() {
    const subKey = `response:${this.#serverId}:*`;
    this.#redis.pSubscribe(subKey, this.#handleResponse);

    const services = this.#services.keys();
    for (const serviceName of services) {
      while (!this.#terminating) await this.#listenRemoteCalls(serviceName);
    }

    while (!this.#terminating) await this.#listenRemoteEvents();
  }

  /** @type IBus['teardown'] */
  async teardown() {
    this.#terminating = true;
    await setTimeout(10000);
  }

  /** @type ICommand['registerService'] */
  registerService(name, service) {
    this.#services.set(name, service);
  }

  /** @type IPubSub['publish'] */
  async publish(event, payload) {
    const streamKey = `${event}:event`;
    const data = {
      serverId: this.#serverId,
      payload: JSON.stringify(payload),
    };
    await this.#redis.xAdd(streamKey, '*', data, {
      TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: 10000 },
    });
    return true;
  }

  /** @type IPubSub['subscribe'] */
  subscribe(event, handler) {
    this.#eventHandlers.set(event, handler);
    return true;
  }

  /** @type IPubSub['unsubscribe'] */
  unsubscribe(event) {
    this.#eventHandlers.delete(event);
    return true;
  }

  /** @type ICommand['call'] */
  async call({ service: serviceName, method }, payload) {
    const callId = randomUUID();
    const streamKey = `${serviceName}:${method}:request`;
    /** @type CallData */
    const data = {
      serverId: this.#serverId,
      callId,
      payload: JSON.stringify(payload),
    };
    await this.#redis.xAdd(streamKey, '*', data, {
      TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: 10000 },
    });
    return new Promise((resolve, reject) => {
      this.#calls.set(callId, { resolve, reject });
    });
  }

  /** @type {(message: string, channel: string) => void} */
  #handleResponse(message, channel) {
    const callId = channel.split(':').at(-1);
    const promise = this.#calls.get(callId);
    if (!promise) return; // need to handle properly
    /** @type CallResponse */
    const response = JSON.parse(message);
    promise.resolve(response);
  }

  /** @type {(serviceName: string) => Promise<void>} */
  async #listenRemoteCalls(serviceName) {
    const service = this.#services.get(serviceName);
    const streams = [];
    for (const methodName of Object.keys(service)) {
      const key = `${serviceName}:${methodName}:request`;
      streams.push({ key, id: '>' });
    }
    const events = await this.#redis.xReadGroup(
      serviceName,
      this.#serverId,
      streams,
      { COUNT: 1, BLOCK: 10000, NOACK: true },
    );
    if (!events?.length) return;
    const { name: streamName, messages } = events[0];
    const { message } = messages[0];
    const payload = /** @type CallData */ (message);
    this.#handleRemoteCall(streamName, payload);
  }

  /** @type {(streamName: string, data: CallData) => Promise<void>} */
  async #handleRemoteCall(
    streamName,
    { serverId, callId, payload: strPayload },
  ) {
    const [service, method] = streamName.split(':');
    const payload = JSON.parse(strPayload);

    const result = await this.#localCall({ service, method }, payload);

    const message = JSON.stringify(result);
    this.#redis.publish(`response:${serverId}:${callId}`, message);
  }

  /** @type ICommand['call'] */
  async #localCall({ service: serviceName, method }, payload) {
    const service = this.#services.get(serviceName);
    const handler = service[method];
    if (!handler)
      return [{ expected: false, message: 'Method not found' }, null];
    const result = await handler(payload);
    return result;
  }

  async #listenRemoteEvents() {
    const eventNames = this.#eventHandlers.keys();
    const streams = [];
    for (const event of eventNames) {
      const key = `${event}:event`;
      streams.push({ key, id: '>' });
    }
    const events = await this.#redis.xReadGroup(
      'events',
      this.#serverId,
      streams,
      { COUNT: 1, BLOCK: 10000, NOACK: true },
    );
    if (!events?.length) return;
    const { name: streamName, messages } = events[0];
    const { message } = messages[0];
    const payload = /** @type CallData */ (message);
    this.#handleRemoteEvent(streamName, payload);
  }

  /** @type {(streamName: string, data: CallData) => Promise<void>} */
  async #handleRemoteEvent(streamName, { payload: strPayload }) {
    const [eventName] = streamName.split(':');
    const payload = JSON.parse(strPayload);
    const handler = this.#eventHandlers.get(eventName);
    if (!handler) console.log('Missing handler');
    await handler(payload);
  }
}
