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
}

module.exports = { PaymentRepository };
