/** @typedef {import('./types').Config} Config */
import infra from './infra.js';
import services from './services.js';
import server from './server.js';
import { nodeEnv } from './util.js';

/** @type Config */
export default {
  env: nodeEnv,
  infra,
  services,
  server,
};
