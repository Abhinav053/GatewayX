const { prisma } = require('@payment-orchestrator/shared/prisma');
class OutboxEventRepository {
  findPending(limit = 100) { return prisma.outboxEvent.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' }, take: limit }); }
  claim(id) { return prisma.outboxEvent.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'FAILED' } }); }
  markPublished(id) { return prisma.outboxEvent.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date(), attempts: { increment: 1 } } }); }
  markRetryable(id, error) { return prisma.outboxEvent.update({ where: { id }, data: { status: 'PENDING', attempts: { increment: 1 }, lastError: error.message } }); }
}
module.exports = { OutboxEventRepository };
