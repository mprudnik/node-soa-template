/** @typedef {import('./notification')} Notification */
import { AppError } from '../../lib/error';

/** @type Notification['init'] */
export const init = ({ bus, db, ws }) => {
  bus.subscribe('account.transfer', async ({ fromId, toId, amount, state }) => {
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

    if (ws.has(sender.owner.id)) {
      const fullName = `${receiver.owner.firstName} ${receiver.owner.lastName}`;
      ws.send(sender.owner.id, {
        message: `Successfully sent ${amount}$ to ${fullName}`,
      });
    }

    if (ws.has(receiver.owner.id)) {
      const fullName = `${sender.owner.firstName} ${sender.owner.lastName}`;
      ws.send(receiver.owner.id, {
        message: `Successfully received ${amount}$ from ${fullName}`,
      });
    }
  });

  return {};
};
