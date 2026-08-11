const { prisma } = require('@payment-orchestrator/shared/prisma');
class RetryPolicyRepository {
  findByMerchantId(merchantId) { return prisma.retryPolicy.findUnique({ where: { merchantId } }); }
}
module.exports = { RetryPolicyRepository };
