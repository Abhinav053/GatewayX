const { prisma } = require('@payment-orchestrator/shared/prisma');
class RoutingDecisionRepository {
  upsert(paymentId, data) { return prisma.routingDecision.upsert({ where: { paymentId }, create: { paymentId, ...data }, update: data }); }
}
module.exports = { RoutingDecisionRepository };
