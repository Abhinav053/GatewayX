const express = require('express');
const { createLogger, createHttpLogger } = require('@payment-orchestrator/shared/logger');
const { getConfig } = require('@payment-orchestrator/shared/config');
const { createReadinessHandler } = require('@payment-orchestrator/shared/config/readiness');
const { MerchantRepository } = require('./repositories/merchant.repository');
const { PaymentService } = require('./services/payment.service');
const { createPaymentRouter } = require('./routes/payment.routes');
const { errorHandler } = require('./middlewares/error-handler');
const { GatewayService } = require('./services/gateway.service');
const { createGatewayRouter } = require('./routes/gateway.routes');
const { PaymentExecutionService } = require('./services/payment-execution.service');
const { IdempotencyService } = require('./services/idempotency.service');

function createApp({ merchantRepository = new MerchantRepository(), gatewayService = new GatewayService(), executionService = new PaymentExecutionService({ gatewayService }), paymentService = new PaymentService({ executionService }), idempotencyService = new IdempotencyService(), } = {}) {
  const config = getConfig('payment-orchestrator');
  const logger = createLogger(config.serviceName);
  const app = express();
  app.disable('x-powered-by');
  app.use(createHttpLogger(logger));
  app.use(express.json());

  app.get('/ops/liveness', (_request, response) => {
    response.status(200).json({ status: 'ok', service: 'payment-orchestrator' });
  });

  app.get('/ops/readiness', createReadinessHandler({ logger, redisUrl: config.redisUrl }));
  app.use('/payments', createPaymentRouter({ merchantRepository, paymentService, idempotencyService }));
  app.use('/gateways', createGatewayRouter({ gatewayService }));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
