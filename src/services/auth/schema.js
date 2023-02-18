/** @typedef {import('json-schema-to-ts')} jsonToTs */
import entities from '../../../prisma/json-schema.js';
import * as schema from '../../lib/schema.js';

const { user, session } = entities;

const authResult = /** @type {const} */ ({
  ...schema.strictObjectProperties,
  required: ['userId', 'token'],
  properties: {
    userId: user.properties.id,
    token: session.properties.token,
  },
});

export const signUpInput = /** @type {const} */ ({
  ...schema.strictObjectProperties,
  required: ['email', 'password', 'firstName', 'lastName'],
  properties: {
    email: user.properties.email,
    password: { type: 'string' },
    firstName: user.properties.firstName,
    lastName: user.properties.lastName,
  },
});
export const signUpOutput = authResult;

export const signInInput = /** @type {const} */ ({
  ...schema.strictObjectProperties,
  required: ['email', 'password'],
  properties: {
    email: user.properties.email,
    password: { type: 'string' },
  },
});
export const signInOutput = authResult;

const tokenSchema = /** @type {const} */ ({
  ...schema.strictObjectProperties,
  required: ['token'],
  properties: { token: { type: 'string' } },
});

export const signOutInput = tokenSchema;

export const refreshInput = tokenSchema;
export const refreshOutput = tokenSchema;

export const verifyInput = tokenSchema;
export const verifyOutput = /** @type {const} */ ({
  ...schema.strictObjectProperties,
  required: ['userId'],
  properties: { userId: user.properties.id },
});
