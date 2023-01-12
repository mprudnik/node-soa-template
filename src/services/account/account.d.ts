import type { Infra } from '../../infra/types';
import type {
  Prisma,
  Account as AccountModel,
  AccountTransaction as AccountTransactionModel,
} from '@prisma/client';

interface Account {
  deposit(params: {
    accountId: AccountModel['id'],
    amount: AccountTransactionModel['amount'],
  }): Promise<void>;
  withdraw(params: {
    accountId: AccountModel['id'],
    amount: AccountTransactionModel['amount'],
  }): Promise<void>;
  transfer(params: {
    fromId: AccountModel['id'],
    toId: AccountModel['id'],
    amount: AccountTransactionModel['amount'],
  }): Promise<void>;
  getBalance(params: {
    accountId: AccountModel['id'],
  }): Promise<number>;
  getTransactions(params: {
    accountId: AccountModel['id'],
  }): Promise<AccountTransactionModel[]>;
}

export function getBalance(
  db: Infra['db'] | Prisma.TransactionClient,
  accountId: AccountModel['id'],
): Promise<number>

export function init(infra: Infra): Account;
