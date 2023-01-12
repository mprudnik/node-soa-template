/** @typedef {import('../infra/types').Infra} Infra */
import * as auth from './auth/auth.js';

const services = { auth };

/** @type function(Infra): Promise<void> */
export const init = async (infra) => {
  const { bus } = infra;
  for (const [serviceName, service] of Object.entries(services)) {
    const instance = await service.init(infra);
    bus.registerService(serviceName, instance);
  }
};
