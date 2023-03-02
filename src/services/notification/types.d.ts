import { EventHandler } from '../types';
import {
  User as UserModel,
  Account as AccountModel,
  AccountTransaction as AccountTransactionModel,
} from '@prisma/client';

export type WSConnectionOpen = EventHandler<{
  Meta: { serverId: string; wsId: string };
  Data: { userId: UserModel['id'] };
}>;

export type WSConnectionClose = EventHandler<{
  Data: { userId: UserModel['id'] };
}>;

export type AccountTransfer = EventHandler<{
  Data: {
    fromId: AccountModel['id'];
    toId: AccountModel['id'];
    amount: AccountTransactionModel['amount'];
    state: string;
  };
}>;

export interface NotificationEventHandlers {
  'ws:connection:open': WSConnectionOpen;
  'ws:connection:close': WSConnectionClose;
  'account:transfer': AccountTransfer;
}
