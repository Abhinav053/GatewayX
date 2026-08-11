const { GatewaySimulationStrategy } = require('../src/strategies/gateway-simulation.strategy');
const { GatewayFactory } = require('../src/factories/gateway.factory');

const gateway = { successRate: 0.8, failureRate: 0.1, timeoutRate: 0.1, latencyMs: 25 };
const noDelay = async () => {};

describe('gateway simulators', () => {
  test.each([
    ['CASHFREE', 'cf_'],
    ['RAZORPAY', 'pay_'],
    ['STRIPE', 'pi_']
  ])('%s normalizes a successful provider response', async (code, referencePrefix) => {
    const adapter = GatewayFactory.create(code, { simulationStrategy: new GatewaySimulationStrategy({ random: () => 0.1, sleep: noDelay }) });
    const result = await adapter.charge({ payment: { id: 'payment_1' }, configuration: gateway });
    expect(result).toEqual(expect.objectContaining({ gateway: code, status: 'SUCCESS', latencyMs: 25 }));
    expect(result.providerReference).toMatch(new RegExp(`^${referencePrefix}`));
  });

  test('returns a normalized timeout for a timeout outcome', async () => {
    const adapter = GatewayFactory.create('CASHFREE', { simulationStrategy: new GatewaySimulationStrategy({ random: () => 0.95, sleep: noDelay }) });
    await expect(adapter.charge({ payment: { id: 'payment_1' }, configuration: gateway })).resolves.toEqual(expect.objectContaining({
      status: 'TIMEOUT', failureCategory: 'TIMEOUT', errorCode: 'GATEWAY_TIMEOUT'
    }));
  });

  test('rejects unsupported gateway codes', () => {
    expect(() => GatewayFactory.create('UNKNOWN')).toThrow('Unsupported gateway');
  });
});
