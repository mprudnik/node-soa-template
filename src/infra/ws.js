/** @typedef {import('./types').Infra['ws']} WS */

/** @type function(): WS */
export const init = () => {
  const users = new Map();

  return {
    has: (id) => users.has(id),
    add: (id, socket) => {
      users.set(id, socket);
    },
    remove: (id) => {
      users.delete(id);
    },
    send: (id, message) => {
      const data = JSON.stringify(message);
      users.get(id).send(data);
    },
  };
};
