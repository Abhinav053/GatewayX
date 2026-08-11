const { PaymentExecutionService } = require('../src/services/payment-execution.service');

const merchant = { id: 'merchant_1', gatewayPreference: ['RAZORPAY'] };
const gateways = [
  { id: 'cashfree-id', code: 'CASHFREE', enabled: true, methods: ['UPI'], successRate: 0.99, failureRate: 0.01, timeoutRate: 0, latencyMs: 100 },
  { id: 'razorpay-id', code: 'RAZORPAY', enabled: true, methods: ['UPI'], successRate: 0.8, failureRate: 0.1, timeoutRate: 0.1, latencyMs: 100 }
];

test('fails over after a retryable failure and records every attempt', async () => {
  const attemptRepository = { create: jest.fn() };
  const routingDecisionRepository = { upsert: jest.fn() };
  const gatewayService = { executePayment: jest.fn()
    .mockResolvedValueOnce({ gateway: 'CASHFREE', status: 'FAILED', failureCategory: 'PROVIDER_ERROR', latencyMs: 100 })
    .mockResolvedValueOnce({ gateway: 'RAZORPAY', status: 'SUCCESS', providerReference: 'pay_1', latencyMs: 100 }) };
  const circuitBreaker = { getState: jest.fn().mockResolvedValue({ state: 'CLOSED' }), recordFailure: jest.fn(), recordSuccess: jest.fn() };
  const service = new PaymentExecutionService({
    gatewayRepository: { findAll: jest.fn().mockResolvedValue(gateways) },
    retryPolicyRepository: { findByMerchantId: jest.fn().mockResolvedValue({ maxAttempts: 2, retryableFailures: ['PROVIDER_ERROR'] }) },
    attemptRepository, routingDecisionRepository, gatewayService, circuitBreaker
  });

  const result = await service.execute({ payment: { id: 'payment_1', method: 'UPI' }, merchant });

  expect(result.status).toBe('SUCCESS');
  expect(attemptRepository.create).toHaveBeenCalledTimes(2);
  expect(gatewayService.executePayment.mock.calls.map(([call]) => call.gateway.code)).toEqual(['CASHFREE', 'RAZORPAY']);
  expect(routingDecisionRepository.upsert).toHaveBeenCalledWith('payment_1', expect.objectContaining({ selectedGateway: 'RAZORPAY' }));
});

test('never ranks a gateway whose breaker is open', async () => {
  const service = new PaymentExecutionService({
    gatewayRepository: { findAll: jest.fn().mockResolvedValue(gateways) },
    retryPolicyRepository: { findByMerchantId: jest.fn().mockResolvedValue({ maxAttempts: 1, retryableFailures: [] }) },
    attemptRepository: { create: jest.fn() }, routingDecisionRepository: { upsert: jest.fn() },
    gatewayService: { executePayment: jest.fn().mockResolvedValue({ gateway: 'RAZORPAY', status: 'SUCCESS', latencyMs: 100 }) },
    circuitBreaker: { getState: jest.fn(async (code) => ({ state: code === 'CASHFREE' ? 'OPEN' : 'CLOSED' })), recordFailure: jest.fn(), recordSuccess: jest.fn() }
  });
  const result = await service.execute({ payment: { id: 'payment_2', method: 'UPI' }, merchant });
  expect(result.gateway).toBe('RAZORPAY');
});
