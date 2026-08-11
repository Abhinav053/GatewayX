const { GatewayAdapter } = require('./gateway.adapter');

class RazorpayAdapter extends GatewayAdapter {
  constructor(dependencies) {
    super({ code: 'RAZORPAY', ...dependencies });
  }

  toNormalizedSuccess({ latencyMs }) {
    const result = super.toNormalizedSuccess({ latencyMs });
    return { ...result, providerReference: result.providerReference.replace('razorpay_', 'pay_') };
  }
}

module.exports = { RazorpayAdapter };
