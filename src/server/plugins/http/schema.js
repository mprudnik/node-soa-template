'use strict';
/** @typedef {import('./types').generateSchema} generateSchema */

/** @type generateSchema */
export const generateSchema = ({ service, inputSource, input, output, auth }) => {
  /** @type any */
  const routeSchema = {
    tags: [service.toUpperCase()],
    response: {
      400: {
        description: 'Client Error',
        ...errorResponse,
      },
      401: {
        description: 'Invalid auth',
        ...errorResponse,
      },
      403: {
        description: 'Invalid role',
        ...errorResponse,
      },
    },
  };

  if (auth) routeSchema.security = [{ token: [] }];

  if (input) {
    routeSchema[inputSource] = {
      type: 'object',
      additionalProperties: false,
      required: input.required ?? [],
      properties: input.properties ?? {},
    };
  }

  if (output) {
    routeSchema.response[200] = {
      description: 'Successful',
      type: 'object',
      ...output,
    };
  } else {
    routeSchema.response[204] = {
      description: 'Successful (no content)',
      type: 'null',
    };
  }

  return routeSchema;
};

const errorResponse = {
  type: 'object',
  additionalProperties: false,
  required: ['message'],
  properties: {
    message: { type: 'string' },
  },
};
