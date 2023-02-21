import type { Command } from '../types';
import type { FromSchema } from 'json-schema-to-ts';
import {
  signUpInput,
  signUpOutput,
  signInInput,
  signInOutput,
  signOutInput,
  refreshInput,
  refreshOutput,
  verifyInput,
  verifyOutput,
} from './schema.js';

interface AuthCommands {
  signUp: Command<{
    Data: FromSchema<typeof signUpInput>;
    Returns: FromSchema<typeof signUpOutput>;
  }>;
  signIn: Command<{
    Data: FromSchema<typeof signInInput>;
    Returns: FromSchema<typeof signInOutput>;
  }>;
  signOut: Command<{
    Data: FromSchema<typeof signOutInput>;
    Returns: void;
  }>;
  refresh: Command<{
    Data: FromSchema<typeof refreshInput>;
    Returns: FromSchema<typeof refreshOutput>;
  }>;
  verify: Command<{
    Data: FromSchema<typeof verifyInput>;
    Returns: FromSchema<typeof verifyOutput>;
  }>;
}
