/** @typedef {import('./types').NotificationEventHandlers} EventHandlers */
import { ServiceError } from '../error.js';

const initialisedUsers = new Map();

/** @type EventHandlers['ws:connection:open'] */
const wsConnectionOpen = async (_i, { meta, data }) => {
  const { serverId, wsId } = meta;
  const { userId } = data;
  initialisedUsers.set(userId, { serverId, wsId });
};

/** @type EventHandlers['ws:connection:close'] */
const wsConnectionClose = async (_i, { data }) => {
  const { userId } = data;
  initialisedUsers.delete(userId);
};

/** @type EventHandlers['account:transfer'] */
const accountTransfer = async (infra, { data }) => {
  const { db, bus } = infra;
  const { fromId, toId, amount, state } = data;
  if (state !== 'completed') return;

  const sender = await db.account.findUnique({
    where: { id: fromId },
    include: { owner: true },
  });
  if (!sender) throw new ServiceError('Sender not found');
  const receiver = await db.account.findUnique({
    where: { id: toId },
    include: { owner: true },
  });
  if (!receiver) throw new ServiceError('Receiver not found');

  const senderMeta = initialisedUsers.get(sender.owner.id);
  if (senderMeta) {
    const { serverId, wsId } = senderMeta;
    const fullName = `${receiver.owner.firstName} ${receiver.owner.lastName}`;
    await bus.publish(`ws:message:${serverId}`, {
      meta: { wsId },
      data: { message: `Successfully sent ${amount}$ to ${fullName}` },
    });
  }

  const receiverMeta = initialisedUsers.get(receiver.owner.id);
  if (receiverMeta) {
    const { serverId, wsId } = receiverMeta;
    const fullName = `${sender.owner.firstName} ${sender.owner.lastName}`;
    await bus.publish(`ws:message:${serverId}`, {
      meta: { wsId },
      data: {
        message: `Successfully received ${amount}$ from ${fullName}`,
      },
    });
  }
};

/** @type EventHandlers */
export const eventHandlers = {
  'ws:connection:open': wsConnectionOpen,
  'ws:connection:close': wsConnectionClose,
  'account:transfer': accountTransfer,
};
