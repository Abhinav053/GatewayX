const { PAYMENT_STATUSES } = require('../constants/payment');
const { PaymentRepository } = require('../repositories/payment.repository');
const { validateCreatePayment } = require('../validators/payment.validator');
const { AppError } = require('../utils/app-error');

function serializePayment(payment) {
  return {
    ...payment,
    amount: payment.amount.toString()
  };
}

class PaymentService {
  constructor({ paymentRepository = new PaymentRepository() } = {}) {
    this.paymentRepository = paymentRepository;
  }

  async createPayment({ merchant, payload, correlationId }) {
    const input = validateCreatePayment(payload);
    const payment = await this.paymentRepository.create({
      merchantId: merchant.id,
      customerId: input.customerId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      status: PAYMENT_STATUSES.CREATED,
      requestPayload: { metadata: input.metadata || {} },
      correlationId
    });

    return serializePayment(payment);
  }

  async getPayment({ id, merchantId }) {
    const payment = await this.paymentRepository.findByIdForMerchant(id, merchantId);
    if (!payment) throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    return serializePayment(payment);
  }
}

module.exports = { PaymentService, serializePayment };
