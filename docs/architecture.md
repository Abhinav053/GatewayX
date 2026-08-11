# Phase 1: Architecture

## Service boundaries

```mermaid
flowchart LR
  Merchant -->|HTTPS| PO[Payment Orchestrator :3000]
  PO --> PG[(PostgreSQL)]
  PO --> R[(Redis)]
  PO --> G[Gateway adapters\nCashfree / Razorpay / Stripe]
  PO -->|transactional outbox| K[Kafka]
  K -->|metrics consumer group| MS[Metrics Service :3001]
  K -->|experiments consumer group| ES[Experiment Service :3002]
  MS --> R
  MS --> PG
  ES --> PG
  PO -->|BullMQ| R
```

`payment-orchestrator` is the sole merchant-facing service and owns synchronous payment processing. `metrics-service` and `experiment-service` are asynchronous consumers; neither can delay or process a payment.

## Component responsibilities

| Component | Responsibility |
| --- | --- |
| Payment Orchestrator | Merchant authentication, validation, payment state, routing, attempts, retry/failover, circuit breakers, idempotency, outbox, verification, and webhooks |
| Gateway adapters | Provide a single normalized simulator interface for Cashfree, Razorpay, and Stripe |
| Metrics Service | Consume payment events; maintain Redis hot metrics and PostgreSQL minute aggregates |
| Experiment Service | Deterministic assignment, gateway-order overrides, lifecycle management, outcome statistics, and Thompson sampling |
| PostgreSQL | Durable business source of truth |
| Redis | Idempotency coordination, circuit state, hot metrics, and BullMQ state |
| Kafka | Independent asynchronous propagation of payment domain events |

## Data model

```mermaid
erDiagram
  Merchant ||--o{ Payment : creates
  Merchant ||--o{ RetryPolicy : owns
  Payment ||--o{ PaymentAttempt : records
  Gateway ||--o{ PaymentAttempt : handles
  Payment ||--|| RoutingDecision : has
  Payment ||--o{ OutboxEvent : emits
  Payment ||--o{ WebhookDelivery : notifies
  Experiment ||--o{ ExperimentAssignment : assigns
  Experiment ||--o{ Payment : influences
  Merchant ||--o{ ExperimentAssignment : scopes
  Gateway ||--o{ GatewayMetric : aggregates

  Merchant {
    string id PK
    string apiKeyHash UK
    string name
  }
  Payment {
    string id PK
    string merchantId FK
    string experimentId FK
    string customerId
    string status
    string idempotencyKey
  }
  PaymentAttempt {
    string id PK
    string paymentId FK
    string gatewayId FK
    int attemptNumber
    string status
    int latencyMs
  }
  Gateway {
    string id PK
    string name UK
    boolean enabled
  }
  RetryPolicy {
    string id PK
    string merchantId FK
    int maxAttempts
  }
  RoutingDecision {
    string id PK
    string paymentId FK
    string selectedGateway
  }
  OutboxEvent {
    string id PK
    string paymentId FK
    string topic
    string status
  }
  WebhookDelivery {
    string id PK
    string paymentId FK
    string status
  }
  Experiment {
    string id PK
    string status
  }
  ExperimentAssignment {
    string id PK
    string experimentId FK
    string merchantId FK
    string customerId
    string variant
  }
  GatewayMetric {
    string id PK
    string gatewayId FK
    datetime bucketStart
  }
```

The later Prisma schema will enforce unique `(merchantId, idempotencyKey)` payment identity, unique merchant retry policies, and unique experiment assignment per experiment/customer. Indexes cover payment merchant/customer/status, payment attempts by payment/gateway/time, and outbox status/time.

## Event contracts

| Kafka topic | Producer | Consumers | Meaning |
| --- | --- | --- | --- |
| `payment.attempted` | Payment Orchestrator | Metrics Service | A gateway call was recorded |
| `payment.completed` | Payment Orchestrator | Metrics Service, Experiment Service | A payment reached success |
| `payment.failed` | Payment Orchestrator | Metrics Service, Experiment Service | A payment permanently failed |
| `payment.timeout` | Payment Orchestrator | Metrics Service, Experiment Service | A payment ended in timeout |

Each event carries an event id, occurred-at timestamp, correlation id, payment id, merchant id, gateway, method, status, attempt number where applicable, and latency where applicable. Consumers are idempotent by event id.

## Payment sequence

```mermaid
sequenceDiagram
  participant M as Merchant
  participant O as Payment Orchestrator
  participant R as Redis
  participant E as Experiment Service
  participant G as Gateway Adapter
  participant D as PostgreSQL
  participant K as Kafka
  participant X as Metrics / Experiment consumers

  M->>O: POST /payments + API key + Idempotency-Key
  O->>O: Authenticate and validate
  O->>R: Acquire idempotency lock / check cached response
  O->>D: Create Payment(PROCESSING)
  O->>E: Get deterministic assignment and order override
  E-->>O: Variant and gateway order
  loop healthy, policy-permitted gateways
    O->>R: Read circuit states and metric inputs
    O->>O: Score and select gateway
    O->>G: Execute normalized charge
    G-->>O: Result, provider reference, latency
    O->>D: Persist PaymentAttempt
    O->>R: Update circuit state
  end
  O->>D: Transaction: final Payment + RoutingDecision + OutboxEvent
  O->>R: Cache idempotent response
  O-->>M: Payment response
  O->>K: Outbox worker publishes event
  K->>X: Consumer groups independently receive event
```

## Source layout

```text
services/
  payment-orchestrator/src/{adapters,config,constants,controllers,events,middlewares,queues,repositories,routes,services,strategies,utils,validators,workers}
  metrics-service/src/{config,consumers,controllers,repositories,services,workers}
  experiment-service/src/{config,consumers,controllers,repositories,services,workers}
shared/{config,constants,kafka,logger,redis}
prisma/
tests/{unit,integration}
docs/
```
