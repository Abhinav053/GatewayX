const { timingSafeEqual } = require('crypto');
const { AppError } = require('../utils/app-error');

function safeEquals(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function requireAdmin(request, _response, next) {
  const expectedApiKey = process.env.ADMIN_API_KEY;
  if (!expectedApiKey) return next(new AppError('Admin API key is not configured', 503, 'ADMIN_AUTH_NOT_CONFIGURED'));
  if (!safeEquals(request.get('x-admin-api-key'), expectedApiKey)) {
    return next(new AppError('Invalid admin API key', 403, 'ADMIN_AUTHORIZATION_FAILED'));
  }
  return next();
}

module.exports = { requireAdmin };
