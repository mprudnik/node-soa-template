import * as app from './src/app.js';

let stopping = false;
try {
  const teardown = await app.init();
  process.on('SIGINT', () => {
    if (!stopping) {
      stopping = true;
      teardown().then(() => process.exit(0));
    }
  });
} catch (error) {
  console.error(error);
  process.exit(-1);
}
