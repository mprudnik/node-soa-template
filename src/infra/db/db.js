/** @typedef {import('./types').init} init */
/** @typedef {import('./types').teardown} teardown */
import { PrismaClient } from '@prisma/client';

/** @type init */
export const init = async ({ logger }, options = {}) => {
  const client = new PrismaClient(options);
  await client.$connect();
  logger.info('DB connected');
  return client;
};

/** @type teardown */
export const teardown = async ({ db, logger }) => {
  await db.$disconnect();
  logger.info('DB disconnected');
};
