import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import { LocalBus } from './local.js';

describe('local bus', () => {
  /** @type LocalBus */
  let bus;

  before(async () => {
    bus = new LocalBus(/** @type any */ ({}), /** @type any */ ({}));
    const { handler } = dummyService.commands.echo;
    bus.registerService('dummy', { echo: handler });
  });

  after(async () => {
    await bus.teardown();
  });

  it('handles get/set schema', async () => {
    const { handler, ...schema } = dummyService.commands.echo;
    await bus.setSchema('dummyService', 'echo', schema);

    const echoSchema = await bus.getSchema('dummyService', 'echo');
    assert.deepEqual(echoSchema, schema);
    const missingSchema = await bus.getSchema('dummyService', 'missing');
    assert.equal(missingSchema, undefined);
  });

  it('handles commands', async () => {
    const payload = { meta: {}, data: { test: 'test' } };

    const [error, result] = await bus.call({ service: 'dummy', method: 'echo' }, payload);
    assert.equal(error, null);
    assert.ok('operationId' in /** @type any */ (result).meta);
    assert.deepStrictEqual(result, payload);
  });

  it('handles missing service/commands', async () => {
    const payload = { meta: {}, data: { test: 'test' } };

    const [missingServiceError] = await bus.call({ service: 'service', method: 'method' }, payload);
    assert.deepEqual(missingServiceError, {
      expected: false,
      message: 'Service not found',
    });
    const [missingHandlerError] = await bus.call({ service: 'dummy', method: 'method' }, payload);
    assert.deepEqual(missingHandlerError, {
      expected: false,
      message: 'Method not found',
    });
  });

  it('handles pub/sub', async () => {
    const results = {
      called: false,
      payload: /** @type any */ (null),
    };

    const eventName = 'testing:publish';
    bus.subscribe(eventName, async (payload) => {
      results.called = true;
      results.payload = payload;
      return /** @type {any} */ ({});
    });

    const payload = { meta: {}, data: { test: 'test' } };

    await bus.publish(eventName, payload);
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
