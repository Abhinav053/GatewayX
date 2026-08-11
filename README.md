# Payment Gateway Orchestrator

An interview-quality, JavaScript-based payment gateway orchestration platform.

The system contains three independent Express services:

- `payment-orchestrator` (`:3000`) owns the merchant-facing payment lifecycle.
- `metrics-service` (`:3001`) independently derives operational gateway metrics.
- `experiment-service` (`:3002`) manages gateway-routing experiments and outcomes.

The merchant communicates only with `payment-orchestrator`. Cashfree, Razorpay, and Stripe are simulated providers implemented as adapters within that service, not additional microservices.

## Architecture

Phase 1 architecture, data model, event contracts, and service communication are documented in [docs/architecture.md](docs/architecture.md).

## Delivery phases

1. Architecture, folder structure, and ERD
2. Project initialization and Docker infrastructure
3. Prisma schema and database
4. Redis, logging, and shared configuration
5. Basic payment flow
6. Gateway simulators and adapter architecture
7. Routing scores, retry, and circuit breaker
8. Idempotency and transactional outbox
9. Kafka and Metrics Service
10. Experiment Service
11. BullMQ verification and webhook delivery
12. Tests, Swagger, and production hardening

