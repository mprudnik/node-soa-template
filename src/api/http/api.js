/** @typedef {import('../types').API['http']} API */
import auth from './auth.js';
import account from './account.js';

/** @type API */
export const http = { auth, account };
