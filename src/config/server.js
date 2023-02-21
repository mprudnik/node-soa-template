/** @typedef {import('./types').Config['server']} Server */
import { nodeEnv } from './util.js';

const host = process.env.HOST ?? '0.0.0.0';
const port = parseInt(process.env.PORT ?? '8000');

/** @type Server */
export default {
  host,
  port,
  env: nodeEnv,
  enabledApi: { http: true, ws: true },
  healthCheckUrl: '/',
  cors: {
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    credentials: true,
  },
  auth: {},
  swagger: {
    title: 'Supelle API',
    description: 'API docs for Supelle project',
    version: '1.0',
    serverUrl: process.env.SERVER_URL ?? `http://${host}:${port}`,
    routePrefix: '/docs',
  },
};
