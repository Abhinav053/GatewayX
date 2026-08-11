const { prisma } = require('@payment-orchestrator/shared/prisma');

class PaymentRepository {
  async create(data) {
    return prisma.payment.create({ data });
  }

  async findByIdForMerchant(id, merchantId) {
    return prisma.payment.findFirst({
      where: { id, merchantId },
      select: {
        id: true,
        merchantId: true,
        customerId: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        providerReference: true,
        finalGateway: true,
        correlationId: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  async updateAfterExecution(id, result) {
    const topicByStatus = { SUCCESS: 'payment_completed', FAILED: 'payment_failed', TIMEOUT: 'payment_timeout' };
    return prisma.$transaction(async (transaction) => {
      const payment = await transaction.payment.update({ where: { id }, data: { status: result.status, finalGateway: result.gateway || null, providerReference: result.providerReference || null, responsePayload: result } });
      await transaction.outboxEvent.create({ data: { paymentId: id, topic: topicByStatus[result.status] || 'payment_failed', aggregateType: 'Payment', aggregateId: id, payload: { eventType: `payment.${result.status.toLowerCase()}`, paymentId: id, merchantId: payment.merchantId, gateway: result.gateway || null, status: result.status, occurredAt: new Date().toISOString() } } });
      return payment;
    });
  }
}

module.exports = { PaymentRepository };
