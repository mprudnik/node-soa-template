// @ts-nocheck
/* eslint-disable */
import autocannon from 'autocannon';

const setupClient = (client) => {
  client.on('body', (buf) => {
    const body = buf.toString('utf-8');
    if (body.includes('200 OK')) return;

    console.log(body);
  });
};

const instance = autocannon({
  url: 'http://0.0.0.0:8000/api/test/test',
  method: 'POST',
  body: JSON.stringify({ input: 'test' }),
  headers: { 'content-type': 'application/json' },
  connections: 100,
  duration: 2 * 60,
  setupClient,
});

autocannon.track(instance);
