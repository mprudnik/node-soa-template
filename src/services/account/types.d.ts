import { Command } from '../types';
import type {
  Prisma,
  PrismaClient,
  Account as AccountModel,
  AccountTransaction as AccountTransactionModel,
} from '@prisma/client';

interface AccountCommands {
  deposit: Command<
    {},
    { accountId: AccountModel['id']; amount: AccountTransactionModel['amount']; },
    void
  >,
  withdraw: Command<
    {},
    { accountId: AccountModel['id']; amount: AccountTransactionModel['amount']; },
    void
  >,
  transfer: Command<
    {},
    {
      fromId: AccountModel['id'];
      toId: AccountModel['id'];
      amount: AccountTransactionModel['amount'];
    },
    void
  >,
  getBalance: Command<
    {},
    { accountId: AccountModel['id'] },
    number
  >,
  getTransactions: Command<
    {},
    { accountId: AccountModel['id'] },
    AccountTransactionModel[]
  >,
}

export function getAccountBalance(
  db: Prisma.TransactionClient | PrismaClient,
  accountId: AccountModel['id'],
): Promise<number>;

