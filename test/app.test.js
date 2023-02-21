import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { start } from '../src/app.js';

describe('app', () => {
  it('starts with default config', async () => {
    const { app, teardown } = await start();
    const { statusCode } = await app.inject({ method: 'GET', url: '/' });
    assert.equal(statusCode, 200);
    await teardown();
  });
});
