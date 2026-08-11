class GatewayScoringService {
  async rank({ gateways, merchant, method, circuitBreaker }) {
    const eligible = [];
    for (const gateway of gateways) {
      if (!gateway.enabled || !gateway.methods.includes(method)) continue;
      const circuit = await circuitBreaker.getState(gateway.code);
      if (circuit.state === 'OPEN') continue;
      const preferenceIndex = merchant.gatewayPreference.indexOf(gateway.code);
      const preferenceBonus = preferenceIndex < 0 ? 0 : (merchant.gatewayPreference.length - preferenceIndex) * 3;
      const score = Number(gateway.successRate) * 100 - Number(gateway.failureRate) * 30 - Number(gateway.timeoutRate) * 40 - Number(gateway.latencyMs) / 100 + preferenceBonus;
      eligible.push({ gateway, score, breakdown: { successRate: Number(gateway.successRate), failureRate: Number(gateway.failureRate), timeoutRate: Number(gateway.timeoutRate), latencyMs: gateway.latencyMs, preferenceBonus, circuitState: circuit.state } });
    }
    return eligible.sort((left, right) => right.score - left.score);
  }
}
module.exports = { GatewayScoringService };
