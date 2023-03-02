/** @typedef {import('./types').Config['server']} Server */
import { getServerId } from './util.js';

const host = process.env.HOST ?? '0.0.0.0';
const port = parseInt(process.env.PORT ?? '8000');

/** @type Server */
export default {
  serverId: getServerId(),
  host,
  port,
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
    title: '{PROJECT} API',
    description: 'API docs for {PROJECT} project',
    version: '1.0',
    serverUrl: process.env.SERVER_URL ?? `http://${host}:${port}`,
    routePrefix: '/docs',
  },
};
