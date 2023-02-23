import { start } from './app.js';

try {
  let stopping = false;
  const { teardown } = await start();
  process.on('SIGINT', async () => {
    if (stopping) return;
    stopping = true;
    await teardown();
    process.exit(0);
  });
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
}
