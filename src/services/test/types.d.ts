import type { FromSchema } from 'json-schema-to-ts';
import type { Command } from '../types';
import { testInput, testOutput } from './schema.js';

export interface TestCommands {
  test: Command<{
    Meta: { operationId: string };
    Data: FromSchema<typeof testInput>;
    Returns: FromSchema<typeof testOutput>;
  }>;
}
