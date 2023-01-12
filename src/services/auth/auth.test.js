// @ts-nocheck
import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as auth from './auth.js';

const mocks = {
  getBus: () => ({
    events: [],
    publish(name, data) {
      this.events.push({ name, data });
    },
  }),

  getDb: () => ({
    user: {
      currentId: 0,
      users: new Map(),
      findInvokedWith: null,
      createInvokedWith: null,
      findUnique({ where }) {
        this.findInvokedWith = where;
        return Promise.resolve(null);
      },
      create({ data }) {
        this.createInvokedWith = data;
        const userId = String(this.currentId++);
        this.users.set(userId, data);
        return Promise.resolve({ id: userId });
      },
    },
    session: {
      createInvokedWith: null,
      create({ data }) {
        this.createInvokedWith = data;
        return Promise.resolve();
      },
    },
  }),
};

describe('auth/sign-up', () => {
  it('works', async () => {
    const bus = mocks.getBus();
    const db = mocks.getDb();
    const service = auth.init({ db, bus });

    const params = {
      email: 'test@mail.com',
      password: 'test',
      firstName: 'max',
      lastName: 'prudnik',
    };

    const result = await service.signUp(params);

    assert.ok(result.token);

    assert.equal(bus.events.length, 1);
    assert.deepEqual(bus.events[0], {
      name: 'auth.signUp',
      data: { email: params.email },
    });
  });
});
