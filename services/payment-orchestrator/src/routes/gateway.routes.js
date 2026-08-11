const { Router } = require('express');
const { requireAdmin } = require('../middlewares/require-admin');
const { createGatewayController } = require('../controllers/gateway.controller');

function createGatewayRouter({ gatewayService }) {
  const router = Router();
  const controller = createGatewayController(gatewayService);
  router.use(requireAdmin);
  router.get('/', controller.list);
  router.get('/:gateway', controller.get);
  router.patch('/:gateway', controller.update);
  return router;
}

module.exports = { createGatewayRouter };
