class OutboxWorker {
  constructor({ outboxEventRepository, eventPublisher, logger, intervalMs = 1_000 }) { Object.assign(this, { outboxEventRepository, eventPublisher, logger, intervalMs }); }
  start() { this.timer = setInterval(() => this.publishPending().catch((error) => this.logger.error({ err: error }, 'outbox poll failed')), this.intervalMs); }
  stop() { clearInterval(this.timer); }
  async publishPending() {
    for (const event of await this.outboxEventRepository.findPending()) {
      const claim = await this.outboxEventRepository.claim(event.id);
      if (!claim.count) continue;
      try { await this.eventPublisher.publish({ topic: event.topic, key: event.aggregateId, value: event.payload }); await this.outboxEventRepository.markPublished(event.id); }
      catch (error) { await this.outboxEventRepository.markRetryable(event.id, error); }
    }
  }
}
module.exports = { OutboxWorker };
