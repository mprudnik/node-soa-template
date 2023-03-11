/** @typedef {import('../logger/types').Logger} Logger */
/** @typedef {import('../redis/types').Redis} Redis */
/** @typedef {import('./types').DistributedBusOptions} Options */
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { init as initLogger } from '../logger/logger.js';
import { init as initRedis, teardown as teardownRedis } from '../redis/redis.js';
import { DistributedBus } from './distributed.js';

describe('distributed bus', () => {
  /** @type Logger */
  let logger;
  /** @type Redis */
  let redis;
  /** @type DistributedBus */
  let caller;
  /** @type DistributedBus */
  let receiver;

  /** @type {Omit<Options, 'serverId'>} */
  const commonOptions = {
    type: 'distributed',
    readInterval: 200,
    callTimeout: 100,
    maxCallStreamSize: 10,
    maxEventStreamSize: 10,
  };

  before(async () => {
    logger = initLogger({ env: 'test' });
    redis = await initRedis({ logger }, {});
  });

  beforeEach(async () => {
    if (caller && receiver) {
      await caller.teardown();
      await receiver.teardown();
    }

    const callerId = randomUUID();
    const receiverId = randomUUID();
    logger.debug({ callerId, receiverId }, 'Bus instances ids');

    caller = new DistributedBus({ logger, redis }, { ...commonOptions, serverId: callerId });
    receiver = new DistributedBus({ logger, redis }, { ...commonOptions, serverId: receiverId });
    const { handler } = dummyService.commands.echo;
    receiver.registerService('dummy', { echo: handler });
    await caller.listen();
  });

  after(async () => {
    await caller.teardown();
    await receiver.teardown();
    await teardownRedis({ redis, logger });
  });

  it('handles get/set schema', async () => {
    await receiver.listen();
    const { handler, ...schema } = dummyService.commands.echo;
    await caller.setSchema('dummyService', 'echo', schema);
    await receiver.prefetchSchemas();

    const echoSchema = receiver.getSchema('dummyService', 'echo');
    assert.deepEqual(echoSchema, schema);
    const missingSchema = caller.getSchema('dummyService', 'missing');
    assert.equal(missingSchema, undefined);
  });

  it('handles commands', async () => {
    await receiver.listen();
    const payload = { meta: {}, data: { test: 'test' } };

    const [error, result] = await caller.call({ service: 'dummy', method: 'echo' }, payload);
    assert.equal(error, null);
    assert.ok('operationId' in /** @type any */ (result).meta);
    assert.deepEqual(result, payload);
  });

  it('handles missing service/commands', async () => {
    await receiver.listen();
    const payload = { meta: {}, data: { test: 'test' } };

    const [missingServiceError] = await caller.call(
      { service: 'service', method: 'method' },
      payload,
    );
    assert.deepEqual(missingServiceError, {
      expected: false,
      message: 'Call timeout',
    });

    const [missingHandlerError] = await caller.call(
      { service: 'dummy', method: 'method' },
      payload,
    );
    assert.deepEqual(missingHandlerError, {
      expected: false,
      message: 'Call timeout',
    });
  });

  it('handles pub/sub', async () => {
    const results = {
      called: false,
      payload: /** @type any */ (null),
    };

    const eventName = 'testing:publish';
    receiver.subscribe(eventName, async (payload) => {
      results.called = true;
      results.payload = payload;
      return /** @type {any} */ ({});
    });
    await receiver.listen();

    const payload = { meta: {}, data: { test: 'test' } };

    await caller.publish(eventName, payload);
    await setTimeout(10);

    assert.ok(results.called);
    assert.ok('operationId' in results.payload.meta);
    assert.deepEqual(results.payload, payload);
  });
});

const dummyService = {
  commands: {
    echo: {
      auth: {},
      input: { type: 'object' },
      ouput: { type: 'object' },
      /** @type {(payload: any) => Promise<any>} */
      handler: async (payload) => [null, payload],
    },
  },
};
