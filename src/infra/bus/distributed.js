/** @typedef {import('../redis/types').Redis} Redis */
/** @typedef {import('./types').Bus} IBus */
/** @typedef {import('./types').Command} ICommand */
/** @typedef {import('./types').PubSub} IPubSub */
/** @typedef {import('./types').CallData} CallData */
/** @typedef {import('./types').CallResult} CallResult */
/** @typedef {import('./types').InitDistributed} Init */
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

/** @implements {IBus} */
export class DistributedBus {
  #redis;
  #logger;
  #options;

  #subClient;
  #services;
  #eventHandlers;
  /** @type {Map<
   * string,
   * { resolve: (result: CallResult) => void, timeout: AbortController }
   * >} */
  #calls;
  /** @type {Map<string, Promise<any>>} */
  #processing;
  #terminating;

  #eventsGroupName = 'events';
  #schemasKey = 'internal:schemas';

  /** @type Init */
  constructor({ redis, logger }, options) {
    this.#redis = redis;
    this.#logger = logger.child({
      source: 'bus',
      serverId: options.serverId,
    });
    this.#options = options;

    this.#subClient = redis.duplicate();
    this.#services = new Map();
    this.#eventHandlers = new Map();
    this.#calls = new Map();
    this.#processing = new Map();
    this.#terminating = false;
  }

  /** @type IBus['listen'] */
  listen = async () => {
    const { serverId } = this.#options;
    const subKey = `response:${serverId}:*`;
    await this.#subClient.connect();
    await this.#subClient.pSubscribe(subKey, this.#handleResponse);

    await this.#createReadGroups();

    const services = this.#services.keys();
    for (const service of services) this.#listenRemoteCalls(service);
    this.#listenRemoteEvents();
  };

  /** @type IBus['teardown'] */
  teardown = async () => {
    this.#logger.info('Stopping bus');
    this.#terminating = true;
    await this.#subClient.pUnsubscribe();
    await this.#subClient.quit();
    const processes = this.#processing.values();
    await Promise.allSettled(processes);
    await this.#cleanUpReadGroups();
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
    const data = { payload: JSON.stringify(payload) };

    const { maxEventStreamSize: threshold } = this.#options;
    await this.#redis.xAdd(streamKey, '*', data, {
      TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold },
    });

    this.#logger.info({ payload, streamKey }, `Published ${event}`);
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
    const { serverId } = this.#options;
    const callId = randomUUID();
    const streamKey = `${serviceName}:${method}:request`;
    /** @type CallData */
    const data = {
      serverId,
      callId,
      payload: JSON.stringify(payload),
    };

    const { maxCallStreamSize: threshold } = this.#options;
    await this.#redis.xAdd(streamKey, '*', data, {
      TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold },
    });

    this.#logger.info(
      { callId, streamKey },
      `Calling ${serviceName}/${method}`,
    );

    return this.#promisifyCall(serviceName, method, callId);
  };

  /** @type {(service: string, method: string, callId: string) => Promise<any>} */
  #promisifyCall = (service, method, callId) =>
    new Promise((resolve) => {
      const { callTimeout } = this.#options;
      const timeout = new AbortController();

      this.#calls.set(callId, { resolve, timeout });

      setTimeout(callTimeout, null, { signal: timeout.signal }).then(() => {
        this.#calls.delete(callId);
        const message = 'Call timeout';
        /** @type CallResult */
        const result = [{ expected: false, message }, null];
        resolve(result);
        this.#logger.warn({ callId, service, method }, message);
      });
    });

  /** @type {(message: string, channel: string) => void} */
  #handleResponse = (message, channel) => {
    const callId = channel.split(':').at(-1);
    if (!callId) {
      this.#logger.error({ message, channel }, 'Invalid channel format');
      return;
    }

    this.#logger.info({ channel, callId }, 'Received reply');

    const promise = this.#calls.get(callId);
    if (!promise) {
      this.#logger.warn({ channel, callId }, 'Missing promise for reply');
      return;
    }

    /** @type CallResult */
    const result = JSON.parse(message);
    promise.timeout.abort();
    promise.resolve(result);
    this.#calls.delete(callId);
  };

  #createReadGroups = async () => {
    for (const [serviceName, service] of this.#services.entries()) {
      for (const methodName of Object.keys(service)) {
        const key = `${serviceName}:${methodName}:request`;
        const groupName = serviceName;
        const groups = await this.#redis.xInfoGroups(key).catch(() => []);
        const alreadyExists = groups.find(({ name }) => name === groupName);
        if (alreadyExists) continue;
        await this.#redis.xGroupCreate(key, groupName, '0', {
          MKSTREAM: true,
        });
      }
    }
    for (const eventName of this.#eventHandlers.keys()) {
      const key = `${eventName}:event`;
      const groupName = this.#eventsGroupName;
      const groups = await this.#redis.xInfoGroups(key).catch(() => []);
      const alreadyExists = groups.find(({ name }) => name === groupName);
      if (alreadyExists) continue;
      await this.#redis.xGroupCreate(key, groupName, '0', {
        MKSTREAM: true,
      });
    }
  };

  #cleanUpReadGroups = async () => {
    const consumer = this.#options.serverId;
    for (const [serviceName, service] of this.#services.entries()) {
      for (const methodName of Object.keys(service)) {
        const key = `${serviceName}:${methodName}:request`;
        const groupName = serviceName;
        await this.#redis.xGroupDelConsumer(key, groupName, consumer);
      }
    }
    for (const eventName of this.#eventHandlers.keys()) {
      const key = `${eventName}:event`;
      const groupName = this.#eventsGroupName;
      await this.#redis.xGroupDelConsumer(key, groupName, consumer);
    }
  };

  /** @type {(serviceName: string) => Promise<void>} */
  #listenRemoteCalls = async (serviceName) => {
    const service = this.#services.get(serviceName);
    const streams = [];
    for (const methodName of Object.keys(service)) {
      const key = `${serviceName}:${methodName}:request`;
      streams.push({ key, id: '>' });
    }
    if (!streams.length) return;
    const redis = this.#redis.duplicate();
    await redis.connect();
    do {
      await this.#processGroupStreams(
        redis,
        serviceName,
        streams,
        this.#handleRemoteCall,
      );
    } while (!this.#terminating);
    await redis.quit();
  };

  /** @type {(streamName: string, data: CallData) => Promise<void>} */
  #handleRemoteCall = async (
    streamName,
    { serverId: remoteServerId, callId, payload: strPayload },
  ) => {
    const [service, method] = streamName.split(':');
    const payload = JSON.parse(strPayload);

    this.#logger.info(
      { remoteServerId, callId, payload },
      `Received call - ${service}/${method}`,
    );

    const result = await this.#localCall({ service, method }, payload);

    const message = JSON.stringify(result);
    const subKey = `response:${remoteServerId}:${callId}`;
    await this.#redis.publish(subKey, message);

    this.#logger.info(
      { callId, result, subKey },
      `Replied - ${service}/${method}`,
    );
  };

  /** @type ICommand['call'] */
  #localCall = async ({ service: serviceName, method }, payload) => {
    const service = this.#services.get(serviceName);
    if (!service) {
      return [{ expected: false, message: 'Service not found' }, null];
    }

    const handler = service[method];
    if (!handler) {
      return [{ expected: false, message: 'Method not found' }, null];
    }

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
    if (!streams.length) return;
    const redis = this.#redis.duplicate();
    await redis.connect();
    do {
      await this.#processGroupStreams(
        redis,
        this.#eventsGroupName,
        streams,
        this.#handleRemoteEvent,
      );
    } while (!this.#terminating);
    await redis.quit();
  };

  /** @type {(streamName: string, data: CallData) => Promise<void>} */
  #handleRemoteEvent = async (streamName, { payload: strPayload }) => {
    const eventName = streamName.slice(0, streamName.lastIndexOf(':'));
    const payload = JSON.parse(strPayload);

    this.#logger.info({ streamName, payload }, `Received event - ${eventName}`);

    const handler = this.#eventHandlers.get(eventName);
    if (!handler) {
      this.#logger.warn(
        { streamName, payload, eventName },
        'Missing event handler',
      );
      return;
    }

    await handler(payload);

    this.#logger.info(`Processed event - ${eventName}`);
  };

  /** @type {(
   * redis: Redis,
   * group: string,
   * streams: { key: string; id: string; }[],
   * processor: (streamName: string, data: CallData) => Promise<any>,
   * ) => Promise<void>} */
  #processGroupStreams = async (redis, group, streams, processor) => {
    const { serverId: consumer, readInterval } = this.#options;
    const events = await redis.xReadGroup(group, consumer, streams, {
      COUNT: 1,
      BLOCK: readInterval,
      NOACK: true,
    });
    if (!events?.length) return;
    const { name: streamName, messages } = events[0];
    const { message } = messages[0];
    const payload = /** @type CallData */ (message);
    const process = processor(streamName, payload);
    const processId = randomUUID();
    this.#processing.set(processId, process);
    process.then(() => this.#processing.delete(processId));
  };
}
