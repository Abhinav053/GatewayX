const Redis = require('ioredis');

let client;

function getRedisClient(redisUrl) {
  if (!client) {
    client = new Redis(redisUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: true });
  }
  return client;
}

async function closeRedisClient() {
  if (!client) return;
  const activeClient = client;
  client = undefined;
  await activeClient.quit().catch(() => activeClient.disconnect());
}

module.exports = { getRedisClient, closeRedisClient };
