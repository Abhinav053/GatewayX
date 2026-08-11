const { prisma } = require('@payment-orchestrator/shared/prisma');

class MerchantRepository {
  async findByApiKeyHash(apiKeyHash) {
    return prisma.merchant.findUnique({ where: { apiKeyHash } });
  }
}

module.exports = { MerchantRepository };
