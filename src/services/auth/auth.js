/** @typedef {import('./types').AuthCommands} Commands */
import * as crypto from '../../lib/crypto.js';
import { ServiceError } from '../error.js';

/** @type Commands['signUp']  */
const signUp = async (infra, { data: { email, password, ...rest } }) => {
  const { db, bus } = infra;

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) throw new ServiceError('Already exists');

  const passwordHash = await crypto.hash(password);

  const { id: userId } = await db.user.create({
    data: { email, passwordHash, ...rest },
  });

  const token = crypto.random();
  await db.session.create({ data: { userId, token } });

  bus.publish('auth.signUp', { meta: {}, data: { email } });

  return { userId, token };
};

/** @type Commands['signIn']  */
const signIn = async (infra, { data: { email, password } }) => {
  const { db } = infra;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ServiceError('Invalid credentials');

  const valid = await crypto.compare(password, user.passwordHash);
  if (!valid) throw new ServiceError('Invalid credentials');

  const { id: userId } = user;
  const token = crypto.random();
  await db.session.create({ data: { userId, token } });

  return { userId, token };
};

/** @type Commands['signOut']  */
const signOut = async (infra, { data: { token } }) => {
  const { db } = infra;

  const exists = await db.session
    .delete({ where: { token } })
    .catch(() => false);
  if (!exists) throw new ServiceError('Not found');
};

/** @type Commands['refresh']  */
const refresh = async (infra, { data: { token } }) => {
  const { db } = infra;

  const session = await db.session.findUnique({ where: { token } });
  if (!session) throw new ServiceError('Not found');

  const newToken = crypto.random();
  await db.session.update({
    where: { id: session.id },
    data: { token: newToken },
  });

  return { token: newToken };
};

/** @type Commands['verify']  */
const verify = async (infra, { data: { token } }) => {
  const { db } = infra;

  const session = await db.session.findUnique({ where: { token } });
  if (!session) throw new ServiceError('Not found');

  return { userId: session.userId };
};

/** @type Commands */
export const commands = {
  signUp,
  signIn,
  signOut,
  refresh,
  verify,
};
