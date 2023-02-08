import type { Command } from '../types';
import type {
  User as UserModel,
  Session as SessionModel,
} from '@prisma/client';

interface AuthResult {
  userId: UserModel['id'];
  token: SessionModel['token'];
}

interface AuthCommands {
  signUp: Command<
    null,
    Pick<UserModel, 'email' | 'firstName' | 'lastName'> & { password: string },
    AuthResult
  >;
  signIn: Command<
    null,
    { email: UserModel['email']; password: string },
    AuthResult
  >;
  signOut: Command<null, Pick<SessionModel, 'token'>, void>;
  refresh: Command<
    null,
    Pick<SessionModel, 'token'>,
    Pick<SessionModel, 'token'>
  >;
  verify: Command<
    null,
    Pick<SessionModel, 'token'>,
    { userId: UserModel['id'] }
  >;
}
