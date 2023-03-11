/** @typedef {import('./types').AuthPlugin} Plugin */
/** @typedef {import('./types').CustomAuth} CustomAuth */
import fp from 'fastify-plugin';

class AuthError extends Error {
  constructor(/** @type number */ statusCode, /** @type string */ message) {
    super(message);

    this.message = message;
    this.statusCode = statusCode;
  }

  toObject() {
    return { statusCode: this.statusCode, message: this.message };
  }
}

const options = {
  fastify: '4.x',
  name: 'custom-auth',
  dependencies: ['@fastify/auth'],
};

/** @type Plugin */
const auth = async (fastify, options) => {
  const { verifyToken } = options;

  fastify.decorateRequest('session', null);

  /** @type CustomAuth */
  const customAuth = (definition) =>
    fastify.auth([
      async (req) => {
        const { authorization } = req.headers;

        if (!authorization) throw new AuthError(401, 'Missing authorization header');

        const [strategy, token] = authorization.split(' ');

        if (strategy !== 'Bearer' || !token) throw new AuthError(401, 'Invalid header');

        const result = await verifyToken(token, definition);
        if (!('session' in result)) {
          const { valid, access, message } = result;
          if (!valid) throw new AuthError(401, message);
          if (!access) throw new AuthError(403, message);
          return;
        }

        req.session = result.session;
      },
    ]);

  fastify.decorate('customAuth', customAuth);
};

export default fp(auth, options);
