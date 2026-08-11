function createReadinessHandler({ logger, redisUrl }) {
  return async (_request, response) => {
    try {
      const { getRedisClient } = require('../redis');
      const redis = getRedisClient(redisUrl);
      if (redis.status === 'wait') await redis.connect();
      await redis.ping();
      response.status(200).json({ status: 'ready', dependencies: { redis: 'ready' } });
    } catch (error) {
      logger.warn({ err: error }, 'readiness dependency check failed');
      response.status(503).json({ status: 'not_ready', dependencies: { redis: 'unavailable' } });
    }
  };
}

module.exports = { createReadinessHandler };
