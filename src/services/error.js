/** @typedef {import('./types')} ServiceFuncs */

export class ServiceError extends Error {}

/** @type ServiceFuncs['processServiceError'] */
export const processServiceError = (error, logger, options) => {
  const { logPrefix, operationId } = options;
    const expected = error instanceof ServiceError;
    const { message, stack } = error;
    logger[expected ? 'warn' : 'error'](
      { stack, operationId },
      `[${logPrefix}] ${message}`,
    );
    return { message, expected };
};
