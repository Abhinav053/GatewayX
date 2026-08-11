const { createHash } = require('crypto');

function hashApiKey(apiKey) {
  return createHash('sha256').update(apiKey).digest('hex');
}

module.exports = { hashApiKey };
