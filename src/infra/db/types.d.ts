import type { PrismaClient, Prisma } from '@prisma/client';
import type { Logger } from '../logger/types';

export type DBOptions = Prisma.PrismaClientOptions;
export type DB = PrismaClient;

export function init(deps: { logger: Logger }, options: DBOptions): Promise<DB>;
export function teardown(deps: { logger: Logger; db: DB }): Promise<void>;
