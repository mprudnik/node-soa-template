/** @typedef {import('../types').HttpRoute} HttpRoute */

/** @type HttpRoute */
const signUp = {
  method: 'POST',
  url: '/sign-up',
  schema: {
    source: 'body',
    input: {
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
    },
    output: {
      required: ['userId', 'token'],
      properties: {
        userId: { type: 'string' },
        token: { type: 'string' },
      },
    },
  },
  command: 'auth.signUp',
};

/** @type HttpRoute */
const signIn = {
  method: 'POST',
  url: '/sign-in',
  schema: {
    source: 'body',
    input: {
      required: ['email', 'password'],
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
      },
    },
    output: {
      required: ['userId', 'token'],
      properties: {
        userId: { type: 'string' },
        token: { type: 'string' },
      },
    },
  },
  command: 'auth.signIn',
};

/** @type HttpRoute */
const signOut = {
  method: 'POST',
  url: '/sign-out',
  schema: {
    source: 'body',
    input: {
      required: ['token'],
      properties: { token: { type: 'string' } },
    },
  },
  command: 'auth.signOut',
};

/** @type HttpRoute */
const refresh = {
  method: 'POST',
  url: '/refresh',
  schema: {
    source: 'body',
    input: {
      required: ['token'],
      properties: { token: { type: 'string' } },
    },
    output: {
      required: ['token'],
      properties: { token: { type: 'string' } },
    },
  },
  command: 'auth.refresh',
};

export const auth = [signUp, signIn, signOut, refresh];
