function createGatewayController(gatewayService) {
  return {
    list: async (_request, response, next) => {
      try { response.json({ data: await gatewayService.listGateways() }); } catch (error) { next(error); }
    },
    get: async (request, response, next) => {
      try { response.json({ data: await gatewayService.getGateway(request.params.gateway) }); } catch (error) { next(error); }
    },
    update: async (request, response, next) => {
      try { response.json({ data: await gatewayService.updateGateway(request.params.gateway, request.body) }); } catch (error) { next(error); }
    }
  };
}

module.exports = { createGatewayController };
