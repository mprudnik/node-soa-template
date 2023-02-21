/** @typedef {import('./types').Config['services']} Services */

const enabledServices = process.env.ENABLED_SERVICES?.split(';');

/** @type Services */
export default {
  enabledServices: enabledServices ?? 'all',
};
