const { Router } = require('express');
const { authenticateMerchant } = require('../middlewares/authenticate-merchant');
const { createPaymentController } = require('../controllers/payment.controller');
const { requireIdempotencyKey } = require('../middlewares/require-idempotency-key');

function createPaymentRouter({ merchantRepository, paymentService, idempotencyService }) {
  const router = Router();
  const controller = createPaymentController(paymentService, idempotencyService);
  router.use(authenticateMerchant({ merchantRepository }));
  router.post('/', requireIdempotencyKey, controller.create);
  router.get('/:id', controller.getById);
  return router;
}

module.exports = { createPaymentRouter };
