const { randomUUID } = require('crypto');
const { GatewaySimulationStrategy } = require('../strategies/gateway-simulation.strategy');

class GatewayAdapter {
  constructor({ code, simulationStrategy = new GatewaySimulationStrategy() }) {
    this.code = code;
    this.simulationStrategy = simulationStrategy;
  }

  async charge({ payment, configuration }) {
    const outcome = await this.simulationStrategy.execute(configuration);
    const latencyMs = Number(configuration.latencyMs);

    if (outcome.status === 'SUCCESS') {
      return this.toNormalizedSuccess({ payment, latencyMs });
    }
    if (outcome.status === 'TIMEOUT') {
      return this.toNormalizedTimeout({ latencyMs });
    }
    return this.toNormalizedFailure({ latencyMs });
  }

  toNormalizedSuccess({ latencyMs }) {
    return {
      gateway: this.code,
      status: 'SUCCESS',
      latencyMs,
      providerReference: `${this.code.toLowerCase()}_${randomUUID().replaceAll('-', '')}`,
      failureCategory: null,
      errorCode: null,
      errorMessage: null
    };
  }

  toNormalizedTimeout({ latencyMs }) {
    return {
      gateway: this.code,
      status: 'TIMEOUT',
      latencyMs,
      providerReference: null,
      failureCategory: 'TIMEOUT',
      errorCode: 'GATEWAY_TIMEOUT',
      errorMessage: `${this.code} did not respond before the configured timeout`
    };
  }

  toNormalizedFailure({ latencyMs }) {
    return {
      gateway: this.code,
      status: 'FAILED',
      latencyMs,
      providerReference: null,
      failureCategory: 'PROVIDER_ERROR',
      errorCode: 'GATEWAY_DECLINED',
      errorMessage: `${this.code} simulator rejected the payment`
    };
  }
}

module.exports = { GatewayAdapter };
