const { ZodError } = require('zod');
const { AppError } = require('../utils/app-error');

function errorHandler(error, request, response, _next) {
  const statusCode = error instanceof ZodError ? 400 : error instanceof AppError ? error.statusCode : 500;
  const code = error instanceof ZodError ? 'VALIDATION_ERROR' : error.code || 'INTERNAL_ERROR';
  request.log.error({ err: error, code }, 'request failed');
  response.status(statusCode).json({ error: { code, message: error.message } });
}

module.exports = { errorHandler };
