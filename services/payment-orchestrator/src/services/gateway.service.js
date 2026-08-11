const { GatewayRepository } = require('../repositories/gateway.repository');
const { GatewayFactory } = require('../factories/gateway.factory');
const { gatewayCodeSchema, validateGatewayUpdate } = require('../validators/gateway.validator');
const { AppError } = require('../utils/app-error');

class GatewayService {
  constructor({ gatewayRepository = new GatewayRepository(), factory = GatewayFactory } = {}) {
    this.gatewayRepository = gatewayRepository;
    this.factory = factory;
  }

  async listGateways() {
    return this.gatewayRepository.findAll();
  }

  async getGateway(code) {
    gatewayCodeSchema.parse(code);
    const gateway = await this.gatewayRepository.findByCode(code);
    if (!gateway) throw new AppError('Gateway not found', 404, 'GATEWAY_NOT_FOUND');
    return gateway;
  }

  async updateGateway(code, payload) {
    const gateway = await this.getGateway(code);
    return this.gatewayRepository.updateByCode(code, validateGatewayUpdate(payload, gateway));
  }

  async executePayment({ gateway, payment, simulationStrategy }) {
    const adapter = this.factory.create(gateway.code, { simulationStrategy });
    return adapter.charge({ payment, configuration: gateway });
  }
}

module.exports = { GatewayService };
