const { createApp } = require('./app');
const { closeRedisClient } = require('@payment-orchestrator/shared/redis');

const port = Number(process.env.PORT || process.env.PAYMENT_ORCHESTRATOR_PORT || 3000);
const server = createApp().listen(port, () => {
  console.log(`payment-orchestrator listening on ${port}`);
});

async function shutdown() {
  await new Promise((resolve) => server.close(resolve));
  await closeRedisClient();
  process.exit(0);
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
