/**
 * Wald's Sequential Probability Ratio Test (SPRT) for Canary Testing.
 * Dynamically tests null hypothesis H0 (canary is safe, p <= p0) against
 * alternative hypothesis H1 (canary is degraded, p >= p1) using sequential
 * log-likelihood ratio accumulation.
 * Returns 'promote' | 'rollback' | 'continue'.
 * Zero external dependencies.
 */

export type SPRTDecision = 'promote' | 'rollback' | 'continue';

export interface WaldSPRTOptions {
  /** Type I error rate: probability of false alarm / rolling back safe canary (default: 0.05) */
  alpha?: number;
  /** Type II error rate: probability of missed detection / promoting bad canary (default: 0.05) */
  beta?: number;
  /** Acceptable baseline error rate under H0 (default: 0.01) */
  p0?: number;
  /** Unacceptable error rate under H1 (default: 0.05) */
  p1?: number;
  /** Optional truncation horizon after which a forced decision is rendered */
  maxSamples?: number;
}

export class WaldSPRT {
  public readonly alpha: number;
  public readonly beta: number;
  public readonly p0: number;
  public readonly p1: number;
  public readonly maxSamples?: number;

  /** Upper decision boundary ln((1 - beta) / alpha) > 0 (accept H1 -> rollback) */
  public readonly upperThreshold: number;

  /** Lower decision boundary ln(beta / (1 - alpha)) < 0 (accept H0 -> promote) */
  public readonly lowerThreshold: number;

  private readonly logRatioFailure: number;
  private readonly logRatioSuccess: number;

  private _llr: number = 0;
  private _sampleCount: number = 0;
  private _errorCount: number = 0;
  private _decision: SPRTDecision = 'continue';

  constructor(options?: WaldSPRTOptions) {
    this.alpha = options?.alpha ?? 0.05;
    this.beta = options?.beta ?? 0.05;
    this.p0 = options?.p0 ?? 0.01;
    this.p1 = options?.p1 ?? 0.05;
    this.maxSamples = options?.maxSamples;

    if (this.alpha <= 0 || this.alpha >= 1) {
      throw new Error(`alpha must be in (0, 1), got ${this.alpha}`);
    }
    if (this.beta <= 0 || this.beta >= 1) {
      throw new Error(`beta must be in (0, 1), got ${this.beta}`);
    }
    if (this.p0 <= 0 || this.p0 >= 1) {
      throw new Error(`p0 must be in (0, 1), got ${this.p0}`);
    }
    if (this.p1 <= 0 || this.p1 >= 1) {
      throw new Error(`p1 must be in (0, 1), got ${this.p1}`);
    }
    if (this.p0 >= this.p1) {
      throw new Error(`p0 must be strictly less than p1 (${this.p0} >= ${this.p1})`);
    }

    // Wald's boundaries
    this.upperThreshold = Math.log((1 - this.beta) / this.alpha);
    this.lowerThreshold = Math.log(this.beta / (1 - this.alpha));

    // Precompute LLR steps for Bernoulli trials
    this.logRatioFailure = Math.log(this.p1 / this.p0);
    this.logRatioSuccess = Math.log((1 - this.p1) / (1 - this.p0));
  }

  /** Cumulative log-likelihood ratio */
  public get logLikelihoodRatio(): number {
    return this._llr;
  }

  /** Total observations processed */
  public get sampleCount(): number {
    return this._sampleCount;
  }

  /** Total errors observed */
  public get errorCount(): number {
    return this._errorCount;
  }

  /** Current decision */
  public get decision(): SPRTDecision {
    return this._decision;
  }

  /**
   * Accumulates a single canary observation (true/1 for failure/error, false/0 for success).
   * Returns 'promote' | 'rollback' | 'continue'.
   */
  public step(isError: boolean | number): SPRTDecision {
    const error = typeof isError === 'boolean' ? isError : isError > 0;
    this._sampleCount++;

    if (error) {
      this._errorCount++;
      this._llr += this.logRatioFailure;
    } else {
      this._llr += this.logRatioSuccess;
    }

    return this.evaluateDecision();
  }

  /**
   * Batch update adding multiple errors and successes.
   */
  public stepBatch(errors: number, successes: number): SPRTDecision {
    if (errors < 0 || successes < 0) {
      throw new Error('errors and successes must be non-negative');
    }

    this._sampleCount += errors + successes;
    this._errorCount += errors;
    this._llr += errors * this.logRatioFailure + successes * this.logRatioSuccess;

    return this.evaluateDecision();
  }

  /**
   * Directly accumulates a known log-likelihood ratio delta.
   */
  public addLLR(deltaLLR: number): SPRTDecision {
    this._sampleCount++;
    this._llr += deltaLLR;
    return this.evaluateDecision();
  }

  /**
   * Returns the current decision.
   */
  public getDecision(): SPRTDecision {
    return this._decision;
  }

  private evaluateDecision(): SPRTDecision {
    if (this._llr >= this.upperThreshold) {
      this._decision = 'rollback';
    } else if (this._llr <= this.lowerThreshold) {
      this._decision = 'promote';
    } else if (this.maxSamples !== undefined && this._sampleCount >= this.maxSamples) {
      // Truncated SPRT at horizon
      this._decision = this._llr > 0 ? 'rollback' : 'promote';
    } else {
      this._decision = 'continue';
    }
    return this._decision;
  }

  /**
   * Resets the test state.
   */
  public reset(): void {
    this._llr = 0;
    this._sampleCount = 0;
    this._errorCount = 0;
    this._decision = 'continue';
  }
}

/**
 * Computes exact Wald stopping boundaries given false-positive (alpha) and false-negative (beta) error tolerances.
 */
export function computeWaldBoundaries(
  alpha: number,
  beta: number
): { upperThreshold: number; lowerThreshold: number; A: number; B: number } {
  const A = (1 - beta) / alpha;
  const B = beta / (1 - alpha);
  return {
    upperThreshold: Math.log(A),
    lowerThreshold: Math.log(B),
    A,
    B,
  };
}

/**
 * Calculates the exact accumulated Bernoulli log-likelihood ratio for observed error counts.
 */
export function computeLLR(
  errors: number,
  successes: number,
  p0: number,
  p1: number
): number {
  const logRatioFailure = Math.log(p1 / p0);
  const logRatioSuccess = Math.log((1 - p1) / (1 - p0));
  return errors * logRatioFailure + successes * logRatioSuccess;
}

/**
 * Calculates the Average Sample Number (ASN) required under hypothesis p.
 */
export function calculateExpectedSampleSize(
  p: number,
  p0: number,
  p1: number,
  alpha: number,
  beta: number
): number {
  const { upperThreshold, lowerThreshold } = computeWaldBoundaries(alpha, beta);
  const logRatioFailure = Math.log(p1 / p0);
  const logRatioSuccess = Math.log((1 - p1) / (1 - p0));
  const expectedStep = p * logRatioFailure + (1 - p) * logRatioSuccess;

  if (Math.abs(expectedStep) < 1e-7) {
    return Math.round(upperThreshold * Math.abs(lowerThreshold));
  }

  // Under H0 (p = p0), prob of hitting upper threshold is alpha
  // Under H1 (p = p1), prob of hitting upper threshold is 1 - beta
  const probUpper = p === p0 ? alpha : p === p1 ? 1 - beta : 0.5;
  const expectedTerminalLLR = probUpper * upperThreshold + (1 - probUpper) * lowerThreshold;

  return Math.max(1, Math.round(Math.abs(expectedTerminalLLR / expectedStep)));
}
