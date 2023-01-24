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

  fastify.route({
    method: 'GET',
    url: '/ws',
    websocket: true,
    onRequest: fastify.customAuth({}),
    handler: async () => 'WS only',
    wsHandler: (conn, req) => {
      const { accountId } = req.session;
      const wsId = randomUUID();

      /** @type {(payload: { meta?: any, data: any}) => void} */
      const messageHandler = ({ meta, data }) => {
        const { wsId } = meta;
        const socket = wsConnections.get(wsId);
        socket.send(JSON.stringify(data));
      };

      conn.socket.on('open', () => {
        wsConnections.set(wsId, conn.socket);
        bus.subscribe(`ws.message.${serverId}`, messageHandler);
        bus.publish(`ws.connection.open`, {
          meta: { serverId, wsId },
          data: { accountId },
        });
      });

      conn.socket.on('close', () => {
        wsConnections.delete(wsId);
        bus.unsubscribe(`ws.message.${serverId}`, messageHandler);
        bus.publish(`ws.connection.close`, {
          meta: { serverId, wsId },
          data: { accountId },
        });
      });
    },
  });
};

export default fp(websocket, options);
