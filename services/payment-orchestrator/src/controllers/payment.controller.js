function createPaymentController(paymentService, idempotencyService) {
  return {
    create: async (request, response, next) => {
      try {
        const result = await idempotencyService.execute({
          merchantId: request.merchant.id, key: request.idempotencyKey, payload: request.body,
          operation: () => paymentService.createPayment({ merchant: request.merchant, payload: request.body, correlationId: request.id })
        });
        response.status(result.replayed ? 200 : 201).json({ data: result.response, idempotentReplay: result.replayed });
      } catch (error) {
        next(error);
      }
    },
    getById: async (request, response, next) => {
      try {
        const payment = await paymentService.getPayment({
          id: request.params.id,
          merchantId: request.merchant.id
        });
        response.status(200).json({ data: payment });
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = { createPaymentController };
