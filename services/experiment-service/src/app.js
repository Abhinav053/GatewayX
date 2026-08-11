const express = require('express');
const { createLogger, createHttpLogger } = require('@payment-orchestrator/shared/logger');
const { getConfig } = require('@payment-orchestrator/shared/config');
const { createReadinessHandler } = require('@payment-orchestrator/shared/config/readiness');

function createApp() {
  const config = getConfig('experiment-service');
  const logger = createLogger(config.serviceName);
  const app = express();
  app.disable('x-powered-by');
  app.use(createHttpLogger(logger));
  app.use(express.json());
  app.get('/ops/liveness', (_request, response) => {
    response.status(200).json({ status: 'ok', service: 'experiment-service' });
  });
  app.get('/ops/readiness', createReadinessHandler({ logger, redisUrl: config.redisUrl }));
  return app;
}

module.exports = { createApp };
