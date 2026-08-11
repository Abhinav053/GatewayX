const { Router } = require('express');
const { authenticateMerchant } = require('../middlewares/authenticate-merchant');
const { createPaymentController } = require('../controllers/payment.controller');

function createPaymentRouter({ merchantRepository, paymentService }) {
  const router = Router();
  const controller = createPaymentController(paymentService);
  router.use(authenticateMerchant({ merchantRepository }));
  router.post('/', controller.create);
  router.get('/:id', controller.getById);
  return router;
}

module.exports = { createPaymentRouter };
