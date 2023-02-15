/** @typedef {import('./types').Init} Init */

import { LocalBus } from './local.js';
import { DistributedBus } from './distributed.js';

/** @type Init */
export const init = (deps, options) => {
  const bus =
    options.type === 'distributed'
      ? new DistributedBus(deps, options)
      : new LocalBus(deps, options);
  return bus;
};
