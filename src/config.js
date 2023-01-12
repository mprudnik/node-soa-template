/** @typedef {import('./server/types').ServerConfig} Server */
/** @typedef {import('./infra/types').InfraConfig} Infra */
/** @typedef Config
 * @property server {Server}
 * @property infra {Infra}
 */

const env = process.env.NODE_ENV || 'development';

/** @type Config */
export const config = {
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.PORT) || 9000,
    instance: {},
    cors: {
      origin: '*',
      methods: '*',
      allowedHeaders: '*',
      credentials: true,
    },
    swagger: {
      title: 'Test',
      version: '1.0.0',
      routePrefix: '/docs',
      serverUrl: process.env.SERVER_URL || 'http://localhost:9000',
    },
  },
  infra: {
    db: { errorFormat: 'minimal' },
    logger: { env },
  },
};
