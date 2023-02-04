/** @typedef {import('./types').Bus} IBus */
/** @typedef {import('./types').Command} ICommand */
/** @typedef {import('./types').PubSub} IPubSub */
/** @typedef {import('./types').CommandResponse} CommandResponse */
/** @typedef {import('redis').RedisClientType} Redis */
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

/** @implements {IBus} */
class Bus {
  #ee;
  #localServices;
  /** @type Redis */
  #redisClient;
  #calls;

  /** @type string */
  #serverId;
  /** @type boolean */
  #terminating;

  constructor({ redis }, { serverId }) {
    this.#serverId = serverId;
    this.#terminating = false;
    this.#redisClient = redis;
    this.#ee = new EventEmitter();
    this.#localServices = new Map();
    this.#calls = new Map();
  }

  /** @type IBus['listen'] */
  async listen() {
    const subKey = `response:${this.#serverId}:*`;
    this.#redisClient.pSubscribe(subKey, this.#handleResponse);

    const services = this.#localServices.keys();
    for (const serviceName of services) {
      while (!this.#terminating) await this.#listenRemoteCommands(serviceName);
    }
  }

  /** @type IBus['teardown'] */
  async teardown() {
    this.#terminating = true;
    await setTimeout(10000);
    await this.#redisClient.unsubscribe();
  }

  /** @type ICommand['call'] */
  call(commandParams, payload) {
    return this.#localServices.has(commandParams.service)
      ? this.#localCall(commandParams, payload)
      : this.#remoteCall(commandParams, payload);
  }

  /** @type ICommand['registerService'] */
  registerService(name, service) {
    this.#localServices.set(name, service);
  }

  /** @type IPubSub['subscribe'] */
  subscribe(event, handler) {
    this.#ee.on(event, handler);
    return true;
  }

  /** @type IPubSub['publish'] */
  publish(event, payload) {
    return this.#ee.emit(event, payload);
  }

  /** @type ICommand['call'] */
  async #localCall({ service: serviceName, method }, payload) {
    const service = this.#localServices.get(serviceName);
    const handler = service[method];
    if (!handler)
      return [{ expected: false, message: 'Method not found' }, null];
    const result = await handler(payload);
    return result;
  }

  /** @type ICommand['call'] */
  async #remoteCall({ service: serviceName, method }, payload) {
    const callId = randomUUID();
    const streamKey = `${serviceName}:${method}:request`;
    await this.#redisClient.xAdd(
      streamKey,
      '*',
      { callId, serverId: this.#serverId, payload: JSON.stringify(payload) },
      { TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: 10000 } },
    );
    return new Promise((resolve, reject) => {
      this.#calls.set(callId, { resolve, reject });
    });
  }

  /** @type {(message: string, channel: string) => void} */
  #handleResponse(message, channel) {
    const callId = channel.split(':').at(-1);
    /** @type CommandResponse */
    const result = JSON.parse(message);
    const promise = this.#calls.get(callId);
    if (!promise) return; // need to handle properly
    promise.resolve(result);
  }

  async #handleRemoteCommand(streamName, { serverId, callId, payload }) {
    const [service, method] = streamName.split(':');
    const result = await this.#localCall({ service, method }, payload);
    const message = JSON.stringify(result);
    this.#redisClient.publish(`response:${serverId}:${callId}`, message);
  }

  async #listenRemoteCommands(serviceName) {
    const service = this.#localServices.get(serviceName);
    const streams = [];
    for (const methodName of Object.keys(service)) {
      const key = `${serviceName}:${methodName}:request`;
      streams.push({ key, id: '>' });
    }
    const events = await this.#redisClient.xReadGroup(
      serviceName,
      this.#serverId,
      streams,
      { COUNT: 1, BLOCK: 10000, NOACK: true },
    );
    if (!events?.length) return;
    const { name, messages } = events[0];
    const { message } = messages[0];
    this.#handleRemoteCommand(name, message);
  }
}

export const init = () => new Bus();
