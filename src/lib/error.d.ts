export class AppError extends Error { }

export function handleError(error: unknown): [number, string, 'warn' | 'error', string | undefined];