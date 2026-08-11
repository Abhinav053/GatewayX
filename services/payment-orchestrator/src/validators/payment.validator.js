const { z } = require('zod');

const createPaymentSchema = z.object({
  customerId: z.string().trim().min(1).max(128),
  amount: z.coerce.number().positive().finite().multipleOf(0.01),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  method: z.enum(['CARD', 'UPI', 'NET_BANKING', 'WALLET']),
  metadata: z.record(z.string(), z.unknown()).optional()
}).strict();

function validateCreatePayment(payload) {
  return createPaymentSchema.parse(payload);
}

module.exports = { validateCreatePayment };
