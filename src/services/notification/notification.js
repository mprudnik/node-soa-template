/** @typedef {import('./notification')} Notification */
import { AppError } from '../../lib/error.js';

/** @type Notification['init'] */
export const init = ({ bus, db }) => {
  const initialisedUsers = new Map();

  bus.subscribe('ws.connection.open', ({ meta, data }) => {
    const { serverId, wsId } = meta;
    const { userId } = data;
    initialisedUsers.set(userId, { serverId, wsId });
  });

  bus.subscribe('ws.connection.close', ({ data }) => {
    const { userId } = data;
    initialisedUsers.delete(userId);
  });

  bus.subscribe(
    'account.transfer',
    async ({ data: { fromId, toId, amount, state } }) => {
      if (state !== 'completed') return;

      const sender = await db.account.findUnique({
        where: { id: fromId },
        include: { owner: true },
      });
      if (!sender) throw new AppError('Sender not found');
      const receiver = await db.account.findUnique({
        where: { id: toId },
        include: { owner: true },
      });
      if (!receiver) throw new AppError('Receiver not found');

      const senderMeta = initialisedUsers.get(sender.owner.id);
      if (senderMeta) {
        const { serverId, wsId } = senderMeta;
        const fullName = `${receiver.owner.firstName} ${receiver.owner.lastName}`;
        bus.publish(`ws.message.${serverId}`, {
          meta: { wsId },
          data: { message: `Successfully sent ${amount}$ to ${fullName}` },
        });
      }

      const receiverMeta = initialisedUsers.get(receiver.owner.id);
      if (receiverMeta) {
        const { serverId, wsId } = receiverMeta;
        const fullName = `${sender.owner.firstName} ${sender.owner.lastName}`;
        bus.publish(`ws.message.${serverId}`, {
          meta: { wsId },
          data: {
            message: `Successfully received ${amount}$ from ${fullName}`,
          },
        });
      }
    },
  );

  return {};
};
