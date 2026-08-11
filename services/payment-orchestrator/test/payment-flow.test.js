const request = require('supertest');
const { createApp } = require('../src/app');
const { hashApiKey } = require('../src/utils/api-key');
const { PaymentService } = require('../src/services/payment.service');

const merchant = { id: '11111111-1111-1111-1111-111111111111', name: 'Demo Merchant' };
const apiKey = 'demo-secret-key';

function buildApp({ payment = null, paymentService: suppliedPaymentService } = {}) {
  const merchantRepository = {
    findByApiKeyHash: jest.fn(async (hash) => hash === hashApiKey(apiKey) ? merchant : null)
  };
  const paymentService = suppliedPaymentService || {
    createPayment: jest.fn(async ({ payload, merchant: currentMerchant, correlationId }) => ({
      id: '22222222-2222-2222-2222-222222222222', merchantId: currentMerchant.id,
      customerId: payload.customerId, amount: String(payload.amount), currency: payload.currency,
      method: payload.method, status: 'CREATED', correlationId
    })),
    getPayment: jest.fn(async () => payment || (() => { const error = new Error('Payment not found'); error.statusCode = 404; error.code = 'PAYMENT_NOT_FOUND'; throw error; })())
  };
  const idempotencyService = { execute: jest.fn(async ({ operation }) => ({ response: await operation(), replayed: false })) };
  return { app: createApp({ merchantRepository, paymentService, idempotencyService }), paymentService };
}

describe('basic payment flow', () => {
  test('creates a validated merchant-scoped payment', async () => {
    const { app, paymentService } = buildApp();
    const response = await request(app).post('/payments').set('x-api-key', apiKey).set('Idempotency-Key', 'create-1').send({
      customerId: 'customer_1', amount: 99.5, currency: 'inr', method: 'UPI'
    });
    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('CREATED');
    expect(paymentService.createPayment).toHaveBeenCalledWith(expect.objectContaining({ merchant }));
  });

  test('rejects missing merchant credentials', async () => {
    const { app } = buildApp();
    const response = await request(app).post('/payments').set('Idempotency-Key', 'auth-1').send({ customerId: 'customer_1', amount: 20, currency: 'INR', method: 'UPI' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  test('rejects invalid payment input', async () => {
    const { app } = buildApp({ paymentService: new PaymentService() });
    const response = await request(app).post('/payments').set('x-api-key', apiKey).set('Idempotency-Key', 'invalid-1').send({ customerId: '', amount: -1, currency: 'INR', method: 'UPI' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns a payment only to its authenticated merchant', async () => {
    const payment = { id: 'p_1', merchantId: merchant.id, customerId: 'customer_1', amount: '99.50', currency: 'INR', method: 'UPI', status: 'CREATED' };
    const { app } = buildApp({ payment });
    const response = await request(app).get('/payments/p_1').set('x-api-key', apiKey);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(payment);
  });
});
