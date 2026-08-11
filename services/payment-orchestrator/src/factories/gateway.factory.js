const { CashfreeAdapter } = require('../adapters/cashfree.adapter');
const { RazorpayAdapter } = require('../adapters/razorpay.adapter');
const { StripeAdapter } = require('../adapters/stripe.adapter');
const { AppError } = require('../utils/app-error');

class GatewayFactory {
  static create(gatewayCode, dependencies = {}) {
    const Adapter = {
      CASHFREE: CashfreeAdapter,
      RAZORPAY: RazorpayAdapter,
      STRIPE: StripeAdapter
    }[gatewayCode];
    if (!Adapter) throw new AppError(`Unsupported gateway: ${gatewayCode}`, 422, 'UNSUPPORTED_GATEWAY');
    return new Adapter(dependencies);
  }
}

module.exports = { GatewayFactory };
