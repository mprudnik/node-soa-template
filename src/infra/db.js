import { PrismaClient } from '@prisma/client';

export const init = async ({ logger }, options = {}) => {
  const client = new PrismaClient(options);
  await client.$connect();
  logger.info('DB connected');
  return client;
};

export const teardown = async ({ db, logger }) => {
  await db.$disconnect();
  logger.info('DB disconnected');
};
