const { getRedisClient } = require('@payment-orchestrator/shared/redis');

class CircuitBreakerService {
  constructor({ redis = getRedisClient(process.env.REDIS_URL || 'redis://localhost:6379'), failureThreshold = 3, cooldownMs = 30_000 } = {}) {
    this.redis = redis;
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
  }
  key(code) { return `circuit-breaker:${code}`; }
  async getState(code) {
    const raw = await this.redis.get(this.key(code));
    const value = raw ? JSON.parse(raw) : { state: 'CLOSED', failures: 0, openedAt: null };
    if (value.state === 'OPEN' && Date.now() - value.openedAt >= this.cooldownMs) return { ...value, state: 'HALF_OPEN' };
    return value;
  }
  async canExecute(code) { return (await this.getState(code)).state !== 'OPEN'; }
  async recordSuccess(code) { await this.redis.set(this.key(code), JSON.stringify({ state: 'CLOSED', failures: 0, openedAt: null })); }
  async recordFailure(code) {
    const current = await this.getState(code);
    const failures = current.failures + 1;
    const state = current.state === 'HALF_OPEN' || failures >= this.failureThreshold ? 'OPEN' : 'CLOSED';
    await this.redis.set(this.key(code), JSON.stringify({ state, failures, openedAt: state === 'OPEN' ? Date.now() : null }));
  }
}
module.exports = { CircuitBreakerService };
