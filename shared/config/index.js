function getConfig(serviceName) {
  const defaultPorts = {
    'payment-orchestrator': 3000,
    'metrics-service': 3001,
    'experiment-service': 3002
  };

  return Object.freeze({
    serviceName,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || defaultPorts[serviceName]),
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
  });
}

module.exports = { getConfig };
