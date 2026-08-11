const pino = require('pino');
const pinoHttp = require('pino-http');
const { randomUUID } = require('crypto');

function createLogger(serviceName) {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || 'info',
    base: { service: serviceName }
  });
}

function createHttpLogger(logger) {
  return pinoHttp({
    logger,
    genReqId(request, response) {
      const requestId = request.headers['x-request-id'] || randomUUID();
      response.setHeader('x-request-id', requestId);
      return requestId;
    },
    customProps(request) {
      return { correlationId: request.headers['x-correlation-id'] || request.id };
    }
  });
}

module.exports = { createLogger, createHttpLogger };
