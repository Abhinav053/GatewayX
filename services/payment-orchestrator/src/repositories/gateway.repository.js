const { prisma } = require('@payment-orchestrator/shared/prisma');

class GatewayRepository {
  async findAll() {
    return prisma.gateway.findMany({ orderBy: { code: 'asc' } });
  }

  async findByCode(code) {
    return prisma.gateway.findUnique({ where: { code } });
  }

  async updateByCode(code, data) {
    return prisma.gateway.update({ where: { code }, data });
  }
}

module.exports = { GatewayRepository };
