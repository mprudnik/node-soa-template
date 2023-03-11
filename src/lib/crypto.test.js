import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from './crypto.js';

describe('crypto', () => {
  it('hashes password', async () => {
    const password = 'Password123!';
    const result = await crypto.hash(password);
    assert.ok(typeof result === 'string');
  });

  it('compares passwords', async () => {
    const password1 = 'Password123!';
    const password2 = 'Password123?';

    const passwordHash1 = await crypto.hash(password1);
    const passwordHash2 = await crypto.hash(password2);

    const password1Valid = await crypto.compare(password1, passwordHash1);
    const password2Valid = await crypto.compare(password2, passwordHash2);
    const password1Invalid = await crypto.compare(password2, passwordHash1);

    assert.ok(password1Valid);
    assert.ok(password2Valid);
    assert.ok(!password1Invalid);
  });
});
