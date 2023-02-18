/** @typedef {import('./types').Bus} IBus */
/** @typedef {import('./types').Command} ICommand */
/** @typedef {import('./types').PubSub} IPubSub */
/** @typedef {import('./types').CallData} CallData */
/** @typedef {import('./types').CallResponse} CallResponse */
/** @typedef {import('./types').InitDistributed} Init */
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

/** @implements {IBus} */
export class DistributedBus {
  #redis;
  #logger;
  #services;
  #eventHandlers;
  #calls;
  #processing;

  /** @type string */
  #serverId;
  /** @type boolean */
  #terminating = false;
  #schemasKey = 'internal:schemas';

  /** @type Init */
  constructor({ redis, logger }, { serverId }) {
    this.#serverId = serverId;
    this.#redis = redis;
    this.#logger = logger;
    this.#eventHandlers = new Map();
    this.#services = new Map();
    this.#calls = new Map();
    this.#processing = [];
  }

  /** @type IBus['listen'] */
  listen = async () => {
    const subKey = `response:${this.#serverId}:*`;
    await this.#redis.pSubscribe(subKey, this.#handleResponse);

    const services = this.#services.keys();
    for (const service of services) this.#listenRemoteCalls(service);
    this.#listenRemoteEvents();
  };

  /** @type IBus['teardown'] */
  teardown = async () => {
    this.#logger.info('Stopping bus');
    this.#terminating = true;
    const timeout = setTimeout(10_000);
    const finishProcessing = Promise.allSettled(this.#processing);
    await Promise.race([finishProcessing, timeout]);
    this.#logger.info('Bus stopped');
  };

  /** @type IBus['getSchema'] */
  getSchema = async (service, method) => {
    const key = `${service}:${method}`;
    const strSchema = await this.#redis.hGet(this.#schemasKey, key);
    if (!strSchema) return undefined;
    const schema = JSON.parse(strSchema);
    return schema;
  };

  /** @type IBus['setSchema'] */
  setSchema = async (service, method, schema) => {
    const key = `${service}:${method}`;
    const strSchema = JSON.stringify(schema);
    await this.#redis.hSet(this.#schemasKey, key, strSchema);
  };

  /** @type ICommand['registerService'] */
  registerService = (name, service) => {
    this.#services.set(name, service);
  };

  /** @type IPubSub['publish'] */
  publish = async (event, payload) => {
    const streamKey = `${event}:event`;
    const data = {
      serverId: this.#serverId,
      payload: JSON.stringify(payload),
    };
    await this.#redis.xAdd(streamKey, '*', data, {
      TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: 10000 },
    });
    return true;
  };

  /** @type IPubSub['subscribe'] */
  subscribe = (event, handler) => {
    this.#eventHandlers.set(event, handler);
    return true;
  };

  /** @type IPubSub['unsubscribe'] */
  unsubscribe = (event) => {
    this.#eventHandlers.delete(event);
    return true;
  };

  /** @type ICommand['call'] */
  call = async ({ service: serviceName, method }, payload) => {
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
  };

  /** @type {(message: string, channel: string) => void} */
  #handleResponse = (message, channel) => {
    const callId = channel.split(':').at(-1);
    const promise = this.#calls.get(callId);
    if (!promise) return; // need to handle properly
    /** @type CallResponse */
    const response = JSON.parse(message);
    promise.resolve(response);
  };

  /** @type {(serviceName: string) => Promise<void>} */
  #listenRemoteCalls = async (serviceName) => {
    const service = this.#services.get(serviceName);
    const streams = [];
    for (const methodName of Object.keys(service)) {
      const key = `${serviceName}:${methodName}:request`;
      streams.push({ key, id: '>' });
    }
    do {
      await this.#processGroupStreams(
        serviceName,
        this.#serverId,
        streams,
        this.#handleRemoteCall,
      );
    } while (!this.#terminating);
  };

  /** @type {(streamName: string, data: CallData) => Promise<void>} */
  #handleRemoteCall = async (
    streamName,
    { serverId, callId, payload: strPayload },
  ) => {
    const [service, method] = streamName.split(':');
    const payload = JSON.parse(strPayload);

    const result = await this.#localCall({ service, method }, payload);

    const message = JSON.stringify(result);
    this.#redis.publish(`response:${serverId}:${callId}`, message);
  };

  /** @type ICommand['call'] */
  #localCall = async ({ service: serviceName, method }, payload) => {
    const service = this.#services.get(serviceName);
    const handler = service[method];
    if (!handler)
      return [{ expected: false, message: 'Method not found' }, null];
    const result = await handler(payload);
    return result;
  };

  #listenRemoteEvents = async () => {
    const eventNames = this.#eventHandlers.keys();
    const streams = [];
    for (const event of eventNames) {
      const key = `${event}:event`;
      streams.push({ key, id: '>' });
    }
    do {
      await this.#processGroupStreams(
        'events',
        this.#serverId,
        streams,
        this.#handleRemoteEvent,
      );
    } while (!this.#terminating);
  };

  /** @type {(streamName: string, data: CallData) => Promise<void>} */
  #handleRemoteEvent = async (streamName, { payload: strPayload }) => {
    const [eventName] = streamName.split(':');
    const payload = JSON.parse(strPayload);
    const handler = this.#eventHandlers.get(eventName);
    if (!handler) console.log('Missing handler');
    await handler(payload);
  };

  /** @type {(
   * group: string,
   * consumer: string,
   * streams: { key: string; id: string; }[],
   * processor: (streamName: string, data: CallData) => Promise<any>,
   * ) => Promise<void>} */
  #processGroupStreams = async (group, consumer, streams, processor) => {
    const events = await this.#redis.xReadGroup(group, consumer, streams, {
      COUNT: 1,
      BLOCK: 10000,
      NOACK: true,
    });
    if (!events?.length) return;
    const { name: streamName, messages } = events[0];
    const { message } = messages[0];
    const payload = /** @type CallData */ (message);
    const process = processor(streamName, payload);
    this.#processing.push(process);
  };
}
