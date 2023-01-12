/** @typedef {import('./auth').init} init */
import * as crypto from '../../lib/crypto.js';
import { AppError } from '../../lib/error.js';

/** @type init  */
export const init = ({ db, bus }) => ({
  signUp: async ({ email, password, ...rest }) => {
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) throw new AppError('Already exists');

    const passwordHash = await crypto.hash(password);

    const { id: userId } = await db.user.create({
      data: { email, passwordHash, ...rest },
    });

    const token = crypto.random();
    await db.session.create({ data: { userId, token } });

    bus.publish('auth.signUp', { email });

    return { userId, token };
  },

  signIn: async ({ email, password }) => {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid credentials');

    const valid = await crypto.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials');

    const { id: userId } = user;
    const token = crypto.random();
    await db.session.create({ data: { userId, token } });

    return { userId, token };
  },

  signOut: async ({ token }) => {
    const exists = await db.session
      .delete({ where: { token } })
      .catch(() => false);
    if (!exists) throw new AppError('Not found');
  },

  refresh: async ({ token }) => {
    const session = await db.session.findUnique({ where: { token } });
    if (!session) throw new AppError('Not found');

    const newToken = crypto.random();
    await db.session.update({
      where: { id: session.id },
      data: { token: newToken },
    });

    return { token: newToken };
  },

  verify: async ({ token }) => {
    const session = await db.session.findUnique({ where: { token } });
    if (!session) throw new AppError('Not found');

    return { userId: session.userId };
  },
});
