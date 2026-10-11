/**
 * Token Bucket Telemetry Ingestion Filter & Rate Limiter
 */

export interface TokenBucketOptions {
  capacity: number;
  refillRatePerSec: number;
  initialTokens?: number;
}

export class TokenBucketFilter {
  public readonly capacity: number;
  public readonly refillRatePerSec: number;
  private tokens: number;
  private lastRefillTimestamp: number;

  constructor(options: TokenBucketOptions) {
    if (options.capacity <= 0) {
      throw new Error(`Token bucket capacity must be positive, got ${options.capacity}`);
    }
    if (options.refillRatePerSec <= 0) {
      throw new Error(`Refill rate must be positive, got ${options.refillRatePerSec}`);
    }

    this.capacity = options.capacity;
    this.refillRatePerSec = options.refillRatePerSec;
    this.tokens = options.initialTokens ?? options.capacity;
    this.lastRefillTimestamp = Date.now();
  }

  /**
   * Refills tokens based on elapsed wall-clock or explicit timestamp.
   */
  private refill(now: number = Date.now()): void {
    const elapsedSeconds = Math.max(0, (now - this.lastRefillTimestamp) / 1000);
    if (elapsedSeconds > 0) {
      const addedTokens = elapsedSeconds * this.refillRatePerSec;
      this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Attempts to consume specified number of tokens. Returns true if permitted, false if throttled.
   */
  public consume(cost = 1, now: number = Date.now()): boolean {
    this.refill(now);
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  /**
   * Inspects available tokens after continuous refill calculation.
   */
  public getAvailableTokens(now: number = Date.now()): number {
    this.refill(now);
    return Math.floor(this.tokens * 100) / 100;
  }

  /**
   * Resets the bucket to full capacity.
   */
  public reset(now: number = Date.now()): void {
    this.tokens = this.capacity;
    this.lastRefillTimestamp = now;
  }
}
