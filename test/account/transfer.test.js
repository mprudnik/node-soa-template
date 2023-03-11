import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import WebSocket from 'ws';
import { start } from '../../src/app.js';
import defaultConfig from '../../src/config/config.js';
import * as crypto from '../../src/lib/crypto.js';

describe('account/transfer', () => {
  /** @type {Awaited<ReturnType<start>>} */
  let gateway;
  /** @type {Awaited<ReturnType<start>>} */
  let services;

  const userCommon = {
    firstName: 'Max',
    lastName: 'Prudnik',
    passwordHash: 'test',
  };
  const sender = { id: 'user1', email: '1@test.com', ...userCommon };
  const receiver = { id: 'user2', email: '2@test.com', ...userCommon };
  const sendSession = { userId: sender.id, token: crypto.randomUUID() };
  const recvSession = { userId: receiver.id, token: crypto.randomUUID() };
  const sendAccount = { id: 'account1', userId: sender.id };
  const recvAccount = { id: 'account2', userId: receiver.id };
  const initialBalance = 1000;

  before(async () => {
    const servicesId = crypto.randomUUID();
    const gatewayId = crypto.randomUUID();

    services = await start({
      ...defaultConfig,
      server: {
        ...defaultConfig.server,
        serverId: servicesId,
        enabledApi: { http: false, ws: false },
      },
      services: { enabledServices: 'all' },
      infra: {
        ...defaultConfig.infra,
        // logger: { env: 'development' },
        bus: {
          type: 'distributed',
          serverId: servicesId,
          readInterval: 100,
          callTimeout: 2000,
          maxCallStreamSize: 100,
          maxEventStreamSize: 100,
        },
      },
    });
    gateway = await start({
      ...defaultConfig,
      server: {
        ...defaultConfig.server,
        serverId: gatewayId,
        enabledApi: { http: true, ws: true },
      },
      services: { enabledServices: [] },
      infra: {
        ...defaultConfig.infra,
        // logger: { env: 'development' },
        bus: {
          type: 'distributed',
          serverId: gatewayId,
          readInterval: 100,
          callTimeout: 2000,
          maxCallStreamSize: 100,
          maxEventStreamSize: 100,
        },
      },
    });

    gateway.infra.logger.info({ gatewayId, servicesId }, 'Servers');

    const { db } = services.infra;

    await db.user.createMany({ data: [sender, receiver] });
    await db.session.createMany({ data: [sendSession, recvSession] });
    await db.account.createMany({ data: [sendAccount, recvAccount] });
    await db.accountStatement.createMany({
      data: [
        {
          accountId: sendAccount.id,
          balance: initialBalance,
          date: new Date(),
        },
        {
          accountId: recvAccount.id,
          balance: initialBalance,
          date: new Date(),
        },
      ],
    });
    await db.ledger.createMany({
      data: [
        { name: 'HouseCash', type: 'liability' },
        { name: 'HouseReserve', type: 'liability' },
      ],
    });
  });

  after(async () => {
    const { db } = services.infra;
    await db.accountTransaction.deleteMany({});
    await db.ledgerTransaction.deleteMany({});
    await db.accountStatement.deleteMany({});
    await db.account.deleteMany({});
    await db.ledger.deleteMany({});
    await db.session.deleteMany({});
    await db.user.deleteMany({});

    await gateway.teardown();
    await services.teardown();
  });

  it('handles transfer', async () => {
    const { host, port } = defaultConfig.server;
    await gateway.app.listen({ host, port });
    const wsUrl = `ws://${host}:${port}/ws`;
    const sendSocket = new WebSocket(wsUrl, [], {
      headers: { Authorization: `Bearer ${sendSession.token}` },
    });
    const recvSocket = new WebSocket(wsUrl, [], {
      headers: { Authorization: `Bearer ${recvSession.token}` },
    });
    const sendMessages = [];
    sendSocket.on('message', (msg) => sendMessages.push(JSON.parse(msg.toString())));
    const recvMessages = [];
    recvSocket.on('message', (msg) => recvMessages.push(JSON.parse(msg.toString())));

    await setTimeout(100);

    const amount = 100;
    const { statusCode } = await gateway.app.inject({
      method: 'POST',
      url: '/api/account/transfer',
      headers: { Authorization: `Bearer ${sendSession.token}` },
      payload: { fromId: sendAccount.id, toId: recvAccount.id, amount },
    });

    await setTimeout(200);

    gateway.app.log.warn({ sendMessages, recvMessages });
    assert.equal(statusCode, 204);
    const fullName = `${userCommon.firstName} ${userCommon.lastName}`;
    assert.equal(sendMessages.length, 1);
    assert.deepEqual(sendMessages[0], {
      message: `Successfully sent ${amount}$ to ${fullName}`,
    });
    assert.equal(recvMessages.length, 1);
    assert.deepEqual(recvMessages[0], {
      message: `Successfully received ${amount}$ from ${fullName}`,
    });
  });
});
