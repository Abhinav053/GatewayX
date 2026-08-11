const { randomUUID, createHash } = require('crypto');
const { getRedisClient } = require('@payment-orchestrator/shared/redis');
const { AppError } = require('../utils/app-error');

class IdempotencyService {
  constructor({ redis = getRedisClient(process.env.REDIS_URL || 'redis://localhost:6379'), ttlSeconds = 86_400, lockTtlMs = 30_000 } = {}) {
    Object.assign(this, { redis, ttlSeconds, lockTtlMs });
  }
  responseKey(merchantId, key) { return `idempotency:response:${merchantId}:${key}`; }
  lockKey(merchantId, key) { return `idempotency:lock:${merchantId}:${key}`; }
  fingerprint(payload) { return createHash('sha256').update(JSON.stringify(payload)).digest('hex'); }
  async execute({ merchantId, key, payload, operation }) {
    const fingerprint = this.fingerprint(payload);
    const responseKey = this.responseKey(merchantId, key);
    const cached = await this.read(responseKey, fingerprint);
    if (cached) return { response: cached, replayed: true };
    const token = randomUUID();
    const acquired = await this.redis.set(this.lockKey(merchantId, key), token, 'PX', this.lockTtlMs, 'NX');
    if (!acquired) {
      for (let index = 0; index < 20; index += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const completed = await this.read(responseKey, fingerprint);
        if (completed) return { response: completed, replayed: true };
      }
      throw new AppError('An identical payment request is still processing', 409, 'IDEMPOTENCY_IN_PROGRESS');
    }
    try {
      const response = await operation();
      await this.redis.set(responseKey, JSON.stringify({ fingerprint, response }), 'EX', this.ttlSeconds);
      return { response, replayed: false };
    } finally {
      if (await this.redis.get(this.lockKey(merchantId, key)) === token) await this.redis.del(this.lockKey(merchantId, key));
    }
  }
  async read(key, fingerprint) {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.fingerprint !== fingerprint) throw new AppError('Idempotency-Key was reused with a different request', 409, 'IDEMPOTENCY_KEY_CONFLICT');
    return cached.response;
  }
}
module.exports = { IdempotencyService };
