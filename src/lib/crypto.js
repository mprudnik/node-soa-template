/** @typedef {import('./crypto')} Crypto */
import crypto from 'node:crypto';

const SALT_LEN = 32;
const KEY_LEN = 64;
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const { N, r, p, maxmem } = SCRYPT_PARAMS;
const SCRYPT_PREFIX = `$scrypt$N=${N},r=${r},p=${p},maxmem=${maxmem}$`;

/** @type {(hash: Buffer, salt: Buffer) => string} */
const serializeHash = (hash, salt) => {
  const saltString = salt.toString('base64').split('=')[0];
  const hashString = hash.toString('base64').split('=')[0];
  return `${SCRYPT_PREFIX}${saltString}$${hashString}`;
};

/** @type {(options: string) => typeof SCRYPT_PARAMS} */
const parseOptions = (options) => {
  const values = [];
  const items = options.split(',');
  for (const item of items) {
    const [key, val] = item.split('=');
    values.push([key, Number(val)]);
  }
  return Object.fromEntries(values);
};

/** @type {(serHash: string) => { params: typeof SCRYPT_PARAMS; salt: Buffer; hash: Buffer }} */
const deserializeHash = (serHash) => {
  const [, name, options, salt64, hash64] = serHash.split('$');
  if (name !== 'scrypt') {
    throw new Error('Node.js crypto module only supports scrypt');
  }
  const params = parseOptions(options);
  const salt = Buffer.from(salt64, 'base64');
  const hash = Buffer.from(hash64, 'base64');
  return { params, salt, hash };
};

/** @type Crypto['hash'] */
export const hash = (password) =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(SALT_LEN, (err, salt) => {
      if (err) {
        reject(err);
        return;
      }
      crypto.scrypt(password, salt, KEY_LEN, SCRYPT_PARAMS, (err, hash) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(serializeHash(hash, salt));
      });
    });
  });

/** @type Crypto['compare'] */
export const compare = (password, serHash) => {
  const { params, salt, hash } = deserializeHash(serHash);
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, hash.length, params, (err, hashedPassword) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(crypto.timingSafeEqual(hashedPassword, hash));
    });
  });
};

/** @type Crypto['randomUUID'] */
export const randomUUID = () => crypto.randomUUID();
