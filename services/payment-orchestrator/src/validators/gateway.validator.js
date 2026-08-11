const { z } = require('zod');

const gatewayCodeSchema = z.enum(['CASHFREE', 'RAZORPAY', 'STRIPE']);
const updateGatewaySchema = z.object({
  enabled: z.boolean().optional(),
  successRate: z.coerce.number().min(0).max(1).optional(),
  failureRate: z.coerce.number().min(0).max(1).optional(),
  timeoutRate: z.coerce.number().min(0).max(1).optional(),
  latencyMs: z.coerce.number().int().min(0).max(60_000).optional(),
  methods: z.array(z.enum(['CARD', 'UPI', 'NET_BANKING', 'WALLET'])).min(1).optional()
}).strict();

function validateGatewayUpdate(payload, currentGateway) {
  const update = updateGatewaySchema.parse(payload);
  const rates = {
    successRate: update.successRate ?? Number(currentGateway.successRate),
    failureRate: update.failureRate ?? Number(currentGateway.failureRate),
    timeoutRate: update.timeoutRate ?? Number(currentGateway.timeoutRate)
  };
  if (rates.successRate + rates.failureRate + rates.timeoutRate > 1) {
    const error = new z.ZodError([{ code: 'custom', path: [], message: 'successRate, failureRate, and timeoutRate must total at most 1' }]);
    throw error;
  }
  return update;
}

module.exports = { gatewayCodeSchema, validateGatewayUpdate };
