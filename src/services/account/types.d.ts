import { Command } from '../types';
import type {
  Prisma,
  PrismaClient,
  Account as AccountModel,
  AccountTransaction as AccountTransactionModel,
} from '@prisma/client';

interface AccountCommands {
  deposit: Command<
    null,
    {
      accountId: AccountModel['id'];
      amount: AccountTransactionModel['amount'];
    },
    void
  >;
  withdraw: Command<
    null,
    {
      accountId: AccountModel['id'];
      amount: AccountTransactionModel['amount'];
    },
    void
  >;
  transfer: Command<
    null,
    {
      fromId: AccountModel['id'];
      toId: AccountModel['id'];
      amount: AccountTransactionModel['amount'];
    },
    void
  >;
  getBalance: Command<null, { accountId: AccountModel['id'] }, number>;
  getTransactions: Command<
    null,
    { accountId: AccountModel['id'] },
    AccountTransactionModel[]
  >;
}

export function getAccountBalance(
  db: Prisma.TransactionClient | PrismaClient,
  accountId: AccountModel['id'],
): Promise<number>;
