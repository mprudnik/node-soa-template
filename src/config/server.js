/** @typedef {import('./types').Config['server']} Server */
import { getServerId } from './util.js';

const host = process.env.HOST ?? '0.0.0.0';
const port = parseInt(process.env.PORT ?? '8000');
const httpEnabled = process.env.ENABLE_HTTP !== 'false';
const wsEnabled = process.env.ENABLE_WS !== 'false';

/** @type Server */
export default {
  serverId: getServerId(),
  host,
  port,
  enabledApi: { http: httpEnabled, ws: wsEnabled },
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
