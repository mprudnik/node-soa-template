import { randomUUID } from 'node:crypto';

/** @type {(name: string) => string} */
export const requiredEnv = (name) => {
  const env = process.env[name];
  if (!env) throw new Error(`Missing required env: ${name}`);
  return env;
};

/** @type {"development" | "production" | "test"} */
// @ts-ignore
export const nodeEnv = process.env.NODE_ENV ?? 'development';
export const serverId = randomUUID();
