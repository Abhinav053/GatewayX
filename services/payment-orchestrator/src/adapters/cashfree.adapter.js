const { GatewayAdapter } = require('./gateway.adapter');

class CashfreeAdapter extends GatewayAdapter {
  constructor(dependencies) {
    super({ code: 'CASHFREE', ...dependencies });
  }

  toNormalizedSuccess({ latencyMs }) {
    const result = super.toNormalizedSuccess({ latencyMs });
    return { ...result, providerReference: result.providerReference.replace('cashfree_', 'cf_') };
  }
}

module.exports = { CashfreeAdapter };
