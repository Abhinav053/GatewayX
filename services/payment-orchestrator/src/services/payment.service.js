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
  constructor({ paymentRepository = new PaymentRepository(), executionService } = {}) {
    this.paymentRepository = paymentRepository;
    this.executionService = executionService;
  }

  async createPayment({ merchant, payload, correlationId }) {
    const input = validateCreatePayment(payload);
    const payment = await this.paymentRepository.create({
      merchantId: merchant.id,
      customerId: input.customerId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      status: this.executionService ? PAYMENT_STATUSES.PROCESSING : PAYMENT_STATUSES.CREATED,
      requestPayload: { metadata: input.metadata || {} },
      correlationId
    });

    if (!this.executionService) return serializePayment(payment);
    const result = await this.executionService.execute({ payment, merchant });
    return serializePayment(await this.paymentRepository.updateAfterExecution(payment.id, result));
  }

  async getPayment({ id, merchantId }) {
    const payment = await this.paymentRepository.findByIdForMerchant(id, merchantId);
    if (!payment) throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    return serializePayment(payment);
  }
}

module.exports = { PaymentService, serializePayment };
