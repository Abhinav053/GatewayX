function createPaymentController(paymentService) {
  return {
    create: async (request, response, next) => {
      try {
        const payment = await paymentService.createPayment({
          merchant: request.merchant,
          payload: request.body,
          correlationId: request.id
        });
        response.status(201).json({ data: payment });
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
