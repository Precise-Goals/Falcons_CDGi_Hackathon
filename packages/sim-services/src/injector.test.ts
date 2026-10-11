import { describe, it, expect } from 'vitest';
import { SimulationFaultInjector } from './injector.js';

describe('@intra/sim-services Fault Injection & Rate Limit Spike Simulator', () => {
  it('triggers configured error status and message when rule is active', () => {
    const injector = new SimulationFaultInjector();
    injector.setFailureRule('/payments/webhook', {
      errorRate: 1.0, // 100% failure
      statusCode: 502,
      errorMessage: 'Bad Gateway: Upstream PSP timed out',
    });

    const res = injector.evaluateFailure('/payments/webhook');
    expect(res.fail).toBe(true);
    expect(res.status).toBe(502);
    expect(res.message).toContain('Bad Gateway');

    // Clear rule restores healthy operation
    injector.clearRule('/payments/webhook');
    expect(injector.evaluateFailure('/payments/webhook').fail).toBe(false);
  });

  it('triggers simulated 429 Too Many Requests when RPS limit is breached', () => {
    const injector = new SimulationFaultInjector();
    const endpoint = '/payments/charge';

    // Send 5 requests within limit
    for (let i = 0; i < 5; i++) {
      expect(injector.evaluateRateLimit(endpoint, 5)).toBeNull();
    }

    // 6th request trips the 429 throttle
    const throttled = injector.evaluateRateLimit(endpoint, 5);
    expect(throttled).not.toBeNull();
    expect(throttled?.status).toBe(429);
    expect(throttled?.retryAfter).toBe(2);
  });
});
