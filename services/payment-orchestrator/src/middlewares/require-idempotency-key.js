const { AppError } = require('../utils/app-error');
function requireIdempotencyKey(request, _response, next) {
  const key = request.get('idempotency-key');
  if (!key || key.length > 255) return next(new AppError('Idempotency-Key header is required', 400, 'IDEMPOTENCY_KEY_REQUIRED'));
  request.idempotencyKey = key;
  return next();
}
module.exports = { requireIdempotencyKey };
