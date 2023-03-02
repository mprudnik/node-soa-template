/** @typedef {import('./types').WebsocketPlugin} Plugin */
import { randomUUID } from 'crypto';
import fp from 'fastify-plugin';
import ws from '@fastify/websocket';

const options = {
  name: 'custom-websocket',
  fastify: '4.x',
  dependencies: ['custom-auth'],
};

/** @type Plugin */
const websocket = async (fastify, options) => {
  await fastify.register(ws);
  const { serverId, bus } = options;

  const wsConnections = new Map();

  /** @type {(payload: { meta?: any, data: any}) => Promise<any>} */
  const messageHandler = async ({ meta, data }) => {
    const { wsId } = meta;
    const socket = wsConnections.get(wsId);
    if (!socket) return;
    socket.send(JSON.stringify(data));
  };

  bus.subscribe(`ws:message:${serverId}`, messageHandler);

  fastify.route({
    method: 'GET',
    url: '/ws',
    onRequest: fastify.customAuth({}),
    handler: async () => 'WS only',
    wsHandler: (conn, req) => {
      const { userId } = req.session;
      const wsId = randomUUID();

      conn.socket.on('close', () => {
        wsConnections.delete(wsId);
        bus.publish(`ws:connection:close`, {
          meta: { serverId, wsId },
          data: { userId },
        });
      });

      wsConnections.set(wsId, conn.socket);
      bus.publish(`ws:connection:open`, {
        meta: { serverId, wsId },
        data: { userId },
      });
    },
  });
};

export default fp(websocket, options);
