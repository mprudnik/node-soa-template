/** @typedef {import('./redis').init} init */
/** @typedef {import('./redis').teardown} teardown */
import * as redis from 'redis';

/** @type init */
export const init = async ({ logger }, { url }) => {
  const client = redis.createClient({ url });

  await client.connect();
  logger.info('Redis connected');

  return client;
};

/** @type teardown */
export const teardown = async ({ logger, redis }) => {
  await redis.disconnect();
  logger.info('Redis disconnected');
};
