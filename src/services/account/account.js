/** @typedef {import('./types').AccountCommands} Commands */
/** @typedef {import('./types').getAccountBalance} getAccountBalance */
import { ServiceError } from '../error.js';
import {
  depositInput,
  getBalanceInput,
  getBalanceOutput,
  getTransactionsInput,
  getTransactionsOutput,
  transferInput,
  withdrawInput,
} from './schema.js';

/** @type Commands['deposit'] */
const deposit = {
  auth: {},
  input: depositInput,
  handler: async (infra, { data: { accountId, amount } }) => {
    const { db, bus } = infra;

    const ledger = await db.ledger.findUnique({ where: { name: 'HouseCash' } });
    if (!ledger) throw new ServiceError('Transaction failed');

    await db.accountTransaction.create({
      data: {
        accountId,
        amount,
        ledgerId: ledger.id,
        typeInternal: 'debit',
        typeExternal: 'deposit',
      },
    });
    await bus.publish('account:deposit', { data: { accountId, amount } });
  },
};

/** @type Commands['withdraw'] */
const withdraw = {
  auth: {},
  input: withdrawInput,
  handler: async (infra, { data: { accountId, amount } }) => {
    const { db, bus } = infra;

    const ledger = await db.ledger.findUnique({ where: { name: 'HouseCash' } });
    if (!ledger) throw new ServiceError('Transaction failed');

    await db.$transaction(async (tx) => {
      const balance = await getAccountBalance(tx, accountId);
      if (amount > balance) throw new ServiceError('Insufficient funds');

      await tx.accountTransaction.create({
        data: {
          accountId,
          amount,
          ledgerId: ledger.id,
          typeInternal: 'credit',
          typeExternal: 'withdrawal',
        },
      });
    });
    await bus.publish('account:withdraw', { data: { accountId, amount } });
  },
};

/** @type Commands['transfer'] */
const transfer = {
  auth: {},
  input: transferInput,
  handler: async (infra, { data: { fromId, toId, amount } }) => {
    const { db, bus } = infra;

    const reserveLedger = await db.ledger.findUnique({
      where: { name: 'HouseReserve' },
    });
    const cashLedger = await db.ledger.findUnique({
      where: { name: 'HouseCash' },
    });
    if (!reserveLedger || !cashLedger) {
      throw new ServiceError('Transaction failed');
    }

    await db.$transaction(async (tx) => {
      const balance = await getAccountBalance(tx, fromId);
      if (amount > balance) throw new ServiceError('Insufficient funds');

      await tx.accountTransaction.create({
        data: {
          accountId: fromId,
          amount,
          ledgerId: reserveLedger.id,
          typeInternal: 'credit',
          typeExternal: 'withdrawal',
        },
      });
    });
    await bus.publish('account:transfer', {
      data: {
        fromId,
        toId,
        amount,
        state: 'initial',
      },
    });

    await db.ledgerTransaction.create({
      data: {
        fromId: reserveLedger.id,
        toId: cashLedger.id,
        amount,
      },
    });
    await bus.publish('account:transfer', {
      data: {
        fromId,
        toId,
        amount,
        state: 'partial',
      },
    });

    await db.accountTransaction.create({
      data: {
        accountId: toId,
        amount,
        ledgerId: cashLedger.id,
        typeInternal: 'debit',
        typeExternal: 'deposit',
      },
    });
    await bus.publish('account:transfer', {
      data: {
        fromId,
        toId,
        amount,
        state: 'completed',
      },
    });
  },
};

/** @type Commands['getBalance'] */
const getBalance = {
  auth: {},
  input: getBalanceInput,
  output: getBalanceOutput,
  handler: async (infra, { data: { accountId } }) => {
    const balance = await getAccountBalance(infra.db, accountId);
    return { balance };
  },
};

/** @type Commands['getTransactions'] */
const getTransactions = {
  auth: {},
  input: getTransactionsInput,
  output: getTransactionsOutput,
  handler: async (infra, { data: { accountId } }) => {
    const { db } = infra;
    const txs = await db.accountTransaction.findMany({
      where: { accountId },
    });
    const transactions = txs.map(({ date, typeExternal, ...rest }) => ({
      ...rest,
      date: date.toISOString(),
      type: typeExternal,
    }));
    return transactions;
  },
};

/** @type getAccountBalance */
const getAccountBalance = async (db, accountId) => {
  const [statement] = await db.accountStatement.findMany({
    where: { accountId },
    select: { balance: true, date: true },
    orderBy: { date: 'desc' },
    take: 1,
  });

  const filter = { accountId, date: { gt: new Date(0) } };
  if (statement) filter.date.gt = statement.date;

  const { _sum: debitSum } = await db.accountTransaction.aggregate({
    _sum: { amount: true },
    where: { ...filter, typeInternal: 'debit' },
  });
  const { _sum: creditSum } = await db.accountTransaction.aggregate({
    _sum: { amount: true },
    where: { ...filter, typeInternal: 'credit' },
  });
  const debit = debitSum.amount ?? 0;
  const credit = creditSum.amount ?? 0;
  const balance = statement ? statement.balance + (debit - credit) : debit - credit;
  return balance;
};

/** @type Commands */
export const commands = {
  deposit,
  withdraw,
  transfer,
  getBalance,
  getTransactions,
};
