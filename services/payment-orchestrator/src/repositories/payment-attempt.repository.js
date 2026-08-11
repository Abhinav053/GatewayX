const { prisma } = require('@payment-orchestrator/shared/prisma');
class PaymentAttemptRepository {
  create(data) { return prisma.paymentAttempt.create({ data }); }
}
module.exports = { PaymentAttemptRepository };
