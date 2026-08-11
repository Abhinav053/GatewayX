const { createApp } = require('./app');
const { closeRedisClient } = require('@payment-orchestrator/shared/redis');

const port = Number(process.env.PORT || process.env.EXPERIMENT_SERVICE_PORT || 3002);
const server = createApp().listen(port, () => {
  console.log(`experiment-service listening on ${port}`);
});

async function shutdown() {
  await new Promise((resolve) => server.close(resolve));
  await closeRedisClient();
  process.exit(0);
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
