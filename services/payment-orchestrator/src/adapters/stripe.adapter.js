const { GatewayAdapter } = require('./gateway.adapter');

class StripeAdapter extends GatewayAdapter {
  constructor(dependencies) {
    super({ code: 'STRIPE', ...dependencies });
  }

  toNormalizedSuccess({ latencyMs }) {
    const result = super.toNormalizedSuccess({ latencyMs });
    return { ...result, providerReference: result.providerReference.replace('stripe_', 'pi_') };
  }
}

module.exports = { StripeAdapter };
