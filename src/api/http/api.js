/** @typedef {import('../types').API['http']} API */
import * as auth from './auth.js';
import * as account from './account.js';

/** @type API */
export const http = { auth, account };
