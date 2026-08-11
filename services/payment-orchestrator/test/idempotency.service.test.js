const { IdempotencyService } = require('../src/services/idempotency.service');

function createRedis() {
  const store = new Map();
  return {
    get: jest.fn(async (key) => store.get(key) || null),
    set: jest.fn(async (key, value, ...argumentsAfterValue) => {
      if (argumentsAfterValue.includes('NX') && store.has(key)) return null;
      store.set(key, value); return 'OK';
    }),
    del: jest.fn(async (key) => store.delete(key))
  };
}

test('replays a completed request without invoking the operation twice', async () => {
  const service = new IdempotencyService({ redis: createRedis() });
  const operation = jest.fn(async () => ({ id: 'payment_1' }));
  const first = await service.execute({ merchantId: 'merchant_1', key: 'key_1', payload: { amount: 10 }, operation });
  const second = await service.execute({ merchantId: 'merchant_1', key: 'key_1', payload: { amount: 10 }, operation });
  expect(first.replayed).toBe(false);
  expect(second).toEqual({ response: { id: 'payment_1' }, replayed: true });
  expect(operation).toHaveBeenCalledTimes(1);
});
