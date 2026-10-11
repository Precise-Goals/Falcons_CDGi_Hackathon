/**
 * Simulated Fault & Drift Injector for Payment Webhooks and Catalog Search
 */

export interface FailureConfig {
  errorRate: number; // 0.0 to 1.0
  statusCode: number;
  errorMessage: string;
}

export class SimulationFaultInjector {
  private failureRules: Map<string, FailureConfig> = new Map();
  private requestCounters: Map<string, { count: number; windowStart: number }> = new Map();

  public setFailureRule(endpoint: string, config: FailureConfig): void {
    this.failureRules.set(endpoint.toLowerCase(), config);
  }

  public clearRule(endpoint: string): void {
    this.failureRules.delete(endpoint.toLowerCase());
  }

  public evaluateFailure(endpoint: string): { fail: boolean; status?: number; message?: string } {
    const rule = this.failureRules.get(endpoint.toLowerCase());
    if (!rule) return { fail: false };

    if (Math.random() < rule.errorRate) {
      return {
        fail: true,
        status: rule.statusCode,
        message: rule.errorMessage,
      };
    }
    return { fail: false };
  }

  /**
   * Simulates 429 Rate Limit burst condition.
   */
  public evaluateRateLimit(
    endpoint: string,
    limitRps = 5
  ): { limited: boolean; status: number; retryAfter: number } | null {
    const now = Date.now();
    const key = endpoint.toLowerCase();
    const counter = this.requestCounters.get(key) ?? { count: 0, windowStart: now };

    if (now - counter.windowStart > 1000) {
      counter.count = 1;
      counter.windowStart = now;
    } else {
      counter.count++;
    }
    this.requestCounters.set(key, counter);

    if (counter.count > limitRps) {
      return {
        limited: true,
        status: 429,
        retryAfter: 2,
      };
    }

    return null;
  }
}
