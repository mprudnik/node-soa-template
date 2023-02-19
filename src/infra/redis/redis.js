/** @typedef {import('./types').init} init */
/** @typedef {import('./types').teardown} teardown */
import * as redis from 'redis';

/** @type init */
export const init = async ({ logger }, { url }) => {
  const client = redis.createClient({ url });

  await client.connect();
  logger.info('Redis connected');

  // @ts-ignore
  return client;
};

/** @type teardown */
export const teardown = async ({ logger, redis }) => {
  await redis.quit();
  logger.info('Redis disconnected');
};
