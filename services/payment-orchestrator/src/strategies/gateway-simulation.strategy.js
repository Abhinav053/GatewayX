const { AppError } = require('../utils/app-error');

class GatewaySimulationStrategy {
  constructor({ random = Math.random, sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)) } = {}) {
    this.random = random;
    this.sleep = sleep;
  }

  async execute(configuration) {
    const { successRate, failureRate, timeoutRate, latencyMs } = configuration;
    const rateTotal = Number(successRate) + Number(failureRate) + Number(timeoutRate);
    if (rateTotal > 1) {
      throw new AppError('Gateway outcome rates must total at most 1', 422, 'INVALID_GATEWAY_CONFIGURATION');
    }

    await this.sleep(latencyMs);
    const roll = this.random();
    if (roll < Number(successRate)) return { status: 'SUCCESS' };
    if (roll < Number(successRate) + Number(failureRate)) return { status: 'FAILED' };
    if (roll < rateTotal) return { status: 'TIMEOUT' };
    return { status: 'FAILED' };
  }
}

module.exports = { GatewaySimulationStrategy };
