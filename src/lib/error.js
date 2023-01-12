export class AppError extends Error {}

export const handleError = (error) =>
  error instanceof AppError
    ? [400, error.message, 'warn', undefined]
    : [500, 'Internal server error', 'error', error?.stack];
