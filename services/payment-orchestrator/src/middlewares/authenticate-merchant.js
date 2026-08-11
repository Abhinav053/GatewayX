const { MerchantRepository } = require('../repositories/merchant.repository');
const { hashApiKey } = require('../utils/api-key');
const { AppError } = require('../utils/app-error');

function authenticateMerchant({ merchantRepository = new MerchantRepository() } = {}) {
  return async (request, _response, next) => {
    try {
      const apiKey = request.get('x-api-key');
      if (!apiKey) throw new AppError('x-api-key header is required', 401, 'AUTHENTICATION_REQUIRED');

      const merchant = await merchantRepository.findByApiKeyHash(hashApiKey(apiKey));
      if (!merchant) throw new AppError('Invalid API key', 401, 'AUTHENTICATION_FAILED');

      request.merchant = merchant;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { authenticateMerchant };
