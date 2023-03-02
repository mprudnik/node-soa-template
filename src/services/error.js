/** @typedef {import('./types')} ServiceFuncs */

export class ServiceError extends Error {}

/** @type ServiceFuncs['processServiceError'] */
export const processServiceError = (error, logger) => {
  const expected = error instanceof ServiceError;
  const { message, stack } = error;
  logger[expected ? 'warn' : 'error']({ stack }, message);
  return { message, expected };
};
