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
  console.error(error);
  process.exit(1);
}
