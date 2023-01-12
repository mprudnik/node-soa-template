/** @typedef {import('./account')} AccountService */
import { AppError } from '../../lib/error.js';

/** @type AccountService['init'] */
export const init = ({ db, bus }) => ({
  deposit: async ({ accountId, amount }) => {
    const ledger = await db.ledger.findUnique({ where: { name: 'HouseCash' } });
    if (!ledger) throw new AppError('Transaction failed');

    await db.accountTransaction.create({
      data: {
        accountId,
        amount,
        ledgerId: ledger.id,
        typeInternal: 'debit',
        typeExternal: 'deposit',
      },
    });
    bus.publish('account.deposit', { accountId, amount });
  },
  withdraw: async ({ accountId, amount }) => {
    const ledger = await db.ledger.findUnique({ where: { name: 'HouseCash' } });
    if (!ledger) throw new AppError('Transaction failed');

    await db.$transaction(async (tx) => {
      const balance = await getBalance(tx, accountId);
      if (amount > balance) throw new AppError('Insufficient funds');

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
    bus.publish('account.withdraw', { accountId, amount });
  },
  transfer: async ({ fromId, toId, amount }) => {
    const reserveLedger = await db.ledger.findUnique({
      where: { name: 'HouseReserve' },
    });
    const cashLedger = await db.ledger.findUnique({
      where: { name: 'HouseCash' },
    });
    if (!reserveLedger || !cashLedger) throw new AppError('Transaction failed');

    await db.$transaction(async (tx) => {
      const balance = await getBalance(tx, fromId);
      if (amount > balance) throw new AppError('Insufficient funds');

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
    bus.publish('account.transfer', {
      fromId,
      toId,
      amount,
      state: 'initial',
    });

    await db.ledgerTransaction.create({
      data: {
        fromId: reserveLedger.id,
        toId: cashLedger.id,
        amount,
      },
    });
    bus.publish('account.transfer', {
      fromId,
      toId,
      amount,
      state: 'partial',
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
    bus.publish('account.transfer', {
      fromId,
      toId,
      amount,
      state: 'completed',
    });
  },
  getBalance: ({ accountId }) => getBalance(db, accountId),
  getTransactions: ({ accountId }) =>
    db.accountTransaction.findMany({ where: { accountId } }),
});

/** @type AccountService['getBalance'] */
const getBalance = async (db, accountId) => {
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
  const balance = statement
    ? statement.balance + (debit - credit)
    : debit - credit;
  return balance;
};
