const { GatewayRepository } = require('../repositories/gateway.repository');
const { PaymentAttemptRepository } = require('../repositories/payment-attempt.repository');
const { RoutingDecisionRepository } = require('../repositories/routing-decision.repository');
const { RetryPolicyRepository } = require('../repositories/retry-policy.repository');
const { GatewayService } = require('./gateway.service');
const { GatewayScoringService } = require('./gateway-scoring.service');
const { CircuitBreakerService } = require('./circuit-breaker.service');

class PaymentExecutionService {
  constructor({ gatewayRepository = new GatewayRepository(), attemptRepository = new PaymentAttemptRepository(), routingDecisionRepository = new RoutingDecisionRepository(), retryPolicyRepository = new RetryPolicyRepository(), gatewayService = new GatewayService(), scoringService = new GatewayScoringService(), circuitBreaker = new CircuitBreakerService() } = {}) {
    Object.assign(this, { gatewayRepository, attemptRepository, routingDecisionRepository, retryPolicyRepository, gatewayService, scoringService, circuitBreaker });
  }
  async execute({ payment, merchant }) {
    const policy = await this.retryPolicyRepository.findByMerchantId(merchant.id) || { maxAttempts: 3, retryableFailures: ['NETWORK_ERROR', 'PROVIDER_ERROR', 'TIMEOUT'] };
    const ranked = await this.scoringService.rank({ gateways: await this.gatewayRepository.findAll(), merchant, method: payment.method, circuitBreaker: this.circuitBreaker });
    const attempted = [];
    let finalResult;
    for (const candidate of ranked.slice(0, policy.maxAttempts)) {
      const result = await this.gatewayService.executePayment({ gateway: candidate.gateway, payment });
      attempted.push(candidate);
      await this.attemptRepository.create({ paymentId: payment.id, gatewayId: candidate.gateway.id, attemptNumber: attempted.length, status: result.status, failureCategory: result.failureCategory, providerReference: result.providerReference, errorCode: result.errorCode, errorMessage: result.errorMessage, latencyMs: result.latencyMs });
      if (result.status === 'SUCCESS') { await this.circuitBreaker.recordSuccess(candidate.gateway.code); finalResult = result; break; }
      await this.circuitBreaker.recordFailure(candidate.gateway.code);
      finalResult = result;
      if (!policy.retryableFailures.includes(result.failureCategory)) break;
    }
    await this.routingDecisionRepository.upsert(payment.id, { selectedGateway: finalResult?.gateway || null, rankedGateways: ranked.map(({ gateway, score }) => ({ gateway: gateway.code, score })), scoreBreakdown: ranked.map(({ gateway, breakdown }) => ({ gateway: gateway.code, ...breakdown })) });
    return finalResult || { status: 'FAILED', failureCategory: 'PROVIDER_ERROR', errorCode: 'NO_ELIGIBLE_GATEWAY', errorMessage: 'No healthy gateway supports this payment method' };
  }
}
module.exports = { PaymentExecutionService };
