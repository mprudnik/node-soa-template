import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { start } from '../src/app.js';
import defaultConfig from '../src/config/config.js';

describe('app', () => {
  it('starts with current config', async () => {
    const { app, teardown } = await start();
    const { statusCode } = await app.inject({ method: 'GET', url: '/' });
    assert.equal(statusCode, 200);
    await teardown();
  });

  it('starts as monolith', async () => {
    const { app, teardown } = await start({
      ...defaultConfig,
      server: { ...defaultConfig.server, enabledApi: { http: true, ws: true } },
      services: { enabledServices: 'all' },
      infra: { ...defaultConfig.infra, bus: { type: 'local' } },
    });
    const { statusCode } = await app.inject({ method: 'GET', url: '/' });
    assert.equal(statusCode, 200);
    await teardown();
  });

  it('starts as api gateway', async () => {
    const { app, teardown } = await start({
      ...defaultConfig,
      server: { ...defaultConfig.server, enabledApi: { http: true, ws: true } },
      services: { enabledServices: [] },
      infra: {
        ...defaultConfig.infra,
        bus: {
          type: 'distributed',
          serverId: 'test',
          readInterval: 100,
          callTimeout: 500,
          maxCallStreamSize: 100,
          maxEventStreamSize: 100,
        },
      },
    });
    const { statusCode } = await app.inject({ method: 'GET', url: '/' });
    assert.equal(statusCode, 200);
    await teardown();
  });

  it('starts as services server', async () => {
    const { app, teardown } = await start({
      ...defaultConfig,
      server: {
        ...defaultConfig.server,
        enabledApi: { http: false, ws: false },
      },
      services: { enabledServices: 'all' },
    });
    const { statusCode } = await app.inject({ method: 'GET', url: '/' });
    assert.equal(statusCode, 200);
    await teardown();
  });
});
