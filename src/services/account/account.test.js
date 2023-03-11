/** @typedef {import('../../infra/types').Infra} Infra */
import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import { init as initInfra, teardown as teardownInfra } from '../../infra/infra.js';
import * as account from './account.js';

describe('account', () => {
  /** @type Infra */
  let infra;
  const account1 = { id: 'account1', initialBalance: 1000 };
  const account2 = { id: 'account2', initialBalance: 1000 };

  before(async () => {
    infra = await initInfra({
      logger: { env: 'test' },
      db: {},
      bus: { type: 'local' },
      redis: {},
    });
    const { db } = infra;

    const user = await db.user.create({
      data: {
        email: 'test@email.com',
        firstName: 'test',
        lastName: 'test',
        passwordHash: 'test',
      },
    });
    await db.account.createMany({
      data: [
        { id: account1.id, userId: user.id },
        { id: account2.id, userId: user.id },
      ],
    });
    await db.accountStatement.createMany({
      data: [
        {
          accountId: account1.id,
          balance: account1.initialBalance,
          date: new Date(),
        },
        {
          accountId: account2.id,
          balance: account2.initialBalance,
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

  afterEach(async () => {
    const { db } = infra;
    await db.accountTransaction.deleteMany({});
    await db.ledgerTransaction.deleteMany({});
  });

  after(async () => {
    const { db } = infra;
    await db.accountTransaction.deleteMany({});
    await db.ledgerTransaction.deleteMany({});
    await db.accountStatement.deleteMany({});
    await db.account.deleteMany({});
    await db.ledger.deleteMany({});
    await db.user.deleteMany({});
    await teardownInfra(infra);
  });

  it('deposits', async () => {
    const amount = 50;
    await account.commands.deposit.handler(infra, {
      meta: null,
      data: { accountId: account1.id, amount },
    });

    const currentBalance = await account.commands.getBalance.handler(infra, {
      meta: null,
      data: { accountId: account1.id },
    });
    assert.equal(currentBalance.balance, account1.initialBalance + amount);
    const transactions = await account.commands.getTransactions.handler(infra, {
      meta: null,
      data: { accountId: account1.id },
    });
    assert.equal(transactions.length, 1);
    const tx = transactions[0];
    assert.equal(tx.amount, amount);
    assert.equal(tx.accountId, account1.id);
    assert.equal(tx.type, 'deposit');
  });

  it('withdraws', async () => {
    const amount = 100;
    await account.commands.withdraw.handler(infra, {
      meta: null,
      data: { accountId: account1.id, amount },
    });

    const currentBalance = await account.commands.getBalance.handler(infra, {
      meta: null,
      data: { accountId: account1.id },
    });
    assert.equal(currentBalance.balance, account1.initialBalance - amount);
    const transactions = await account.commands.getTransactions.handler(infra, {
      meta: null,
      data: { accountId: account1.id },
    });
    assert.equal(transactions.length, 1);
    const tx = transactions[0];
    assert.equal(tx.amount, amount);
    assert.equal(tx.accountId, account1.id);
    assert.equal(tx.type, 'withdrawal');
  });

  it('transfers', async () => {
    const amount = 200;
    await account.commands.transfer.handler(infra, {
      meta: null,
      data: {
        fromId: account1.id,
        toId: account2.id,
        amount,
      },
    });

    const currentBalance1 = await account.commands.getBalance.handler(infra, {
      meta: null,
      data: { accountId: account1.id },
    });
    const currentBalance2 = await account.commands.getBalance.handler(infra, {
      meta: null,
      data: { accountId: account2.id },
    });
    assert.equal(currentBalance1.balance, account1.initialBalance - amount);
    assert.equal(currentBalance2.balance, account2.initialBalance + amount);
    const transactions1 = await account.commands.getTransactions.handler(infra, {
      meta: null,
      data: { accountId: account1.id },
    });
    assert.equal(transactions1.length, 1);
    const tx1 = transactions1[0];
    assert.equal(tx1.amount, amount);
    assert.equal(tx1.accountId, account1.id);
    assert.equal(tx1.type, 'withdrawal');
    const transactions2 = await account.commands.getTransactions.handler(infra, {
      meta: null,
      data: { accountId: account2.id },
    });
    assert.equal(transactions2.length, 1);
    const tx2 = transactions2[0];
    assert.equal(tx2.amount, amount);
    assert.equal(tx2.accountId, account2.id);
    assert.equal(tx2.type, 'deposit');
  });
});
