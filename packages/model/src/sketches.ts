/**
 * Streaming Sketches for high-throughput, low-memory distributional telemetry.
 * Zero external dependencies.
 */

// ============================================================================
// 1. T-Digest: Streaming Quantile Estimation
// ============================================================================

export interface Centroid {
  mean: number;
  weight: number;
}

export interface TDigestOptions {
  /** Compression parameter controlling accuracy vs memory (default: 100) */
  delta?: number;
  /** Buffer limit before automatic merge compression (default: 500) */
  bufferLimit?: number;
}

/**
 * TDigest implements Ted Dunning's t-digest algorithm for accurate streaming
 * quantile estimation across extreme tails (p99, p99.9) using a non-linear scale function.
 */
export class TDigest {
  public delta: number;
  private bufferLimit: number;
  private _centroids: Centroid[] = [];
  private _buffer: Centroid[] = [];
  private _totalWeight: number = 0;
  private _min: number = Infinity;
  private _max: number = -Infinity;

  constructor(options?: number | TDigestOptions) {
    if (typeof options === 'number') {
      this.delta = options;
      this.bufferLimit = 500;
    } else {
      this.delta = options?.delta ?? 100;
      this.bufferLimit = options?.bufferLimit ?? 500;
    }

    if (this.delta <= 0) {
      throw new Error(`delta must be positive, got ${this.delta}`);
    }
  }

  /** Total weight of all recorded samples */
  public get totalWeight(): number {
    return this._totalWeight;
  }

  /** Count of samples (alias for totalWeight) */
  public get count(): number {
    return this._totalWeight;
  }

  /** Number of compressed centroids */
  public get size(): number {
    return this._centroids.length;
  }

  /** Centroids currently stored */
  public get centroids(): readonly Centroid[] {
    return this._centroids;
  }

  /** Minimum value observed */
  public get min(): number {
    return this._min;
  }

  /** Maximum value observed */
  public get max(): number {
    return this._max;
  }

  /**
   * Add a single value with an optional weight (default: 1).
   */
  public add(x: number, weight: number = 1): void {
    if (!Number.isFinite(x) || !Number.isFinite(weight) || weight <= 0) {
      return;
    }

    if (x < this._min) this._min = x;
    if (x > this._max) this._max = x;

    this._buffer.push({ mean: x, weight });
    this._totalWeight += weight;

    if (this._buffer.length >= this.bufferLimit) {
      this.compress();
    }
  }

  /**
   * Non-linear scale function k1(q) = (delta / (2 * pi)) * asin(2q - 1).
   * Ensures high resolution near 0 and 1, allowing larger centroids near 0.5.
   */
  private k1(q: number): number {
    const clamped = Math.max(0, Math.min(1, q));
    return (this.delta / (2 * Math.PI)) * Math.asin(2 * clamped - 1);
  }

  /**
   * Compresses all buffered samples and existing centroids into a minimal
   * set of bounded centroids respecting the non-linear scale function.
   */
  public compress(): void {
    if (this._totalWeight === 0) return;
    if (this._buffer.length === 0 && this._centroids.length <= 1) return;

    // Combine current centroids and buffer, sort ascending by mean
    const all = [...this._centroids, ...this._buffer];
    all.sort((a, b) => a.mean - b.mean);
    this._buffer = [];

    const newCentroids: Centroid[] = [];
    const N = this._totalWeight;

    let curr: Centroid = { mean: all[0].mean, weight: all[0].weight };
    let weightSoFar = 0;

    for (let i = 1; i < all.length; i++) {
      const next = all[i];
      const proposedWeight = curr.weight + next.weight;
      const q0 = weightSoFar / N;
      const q1 = (weightSoFar + proposedWeight) / N;

      // Check scale limit constraint: delta_k <= 1
      const deltaK = this.k1(q1) - this.k1(q0);
      if (deltaK <= 1.0) {
        // Merge into current centroid
        curr.mean = (curr.mean * curr.weight + next.mean * next.weight) / proposedWeight;
        curr.weight = proposedWeight;
      } else {
        newCentroids.push(curr);
        weightSoFar += curr.weight;
        curr = { mean: next.mean, weight: next.weight };
      }
    }

    newCentroids.push(curr);
    this._centroids = newCentroids;
  }

  /**
   * Estimates the value at quantile q in [0, 1].
   * Uses piecewise linear interpolation between adjacent centroid means.
   */
  public quantile(q: number): number {
    if (this._totalWeight === 0) {
      return NaN;
    }

    if (this._buffer.length > 0) {
      this.compress();
    }

    if (this._centroids.length === 1) {
      return this._centroids[0].mean;
    }

    if (q <= 0) return this._min;
    if (q >= 1) return this._max;

    const N = this._totalWeight;
    const targetWeight = q * N;

    // Centroid midpoints along the cumulative weight distribution
    let weightSoFar = 0;
    const firstHalf = this._centroids[0].weight / 2;

    // Below the first centroid's midpoint: interpolate from min to c0.mean
    if (targetWeight < firstHalf) {
      if (firstHalf === 0) return this._min;
      const fraction = targetWeight / firstHalf;
      return this._min + (this._centroids[0].mean - this._min) * fraction;
    }

    for (let i = 0; i < this._centroids.length - 1; i++) {
      const c1 = this._centroids[i];
      const c2 = this._centroids[i + 1];

      const mid1 = weightSoFar + c1.weight / 2;
      const mid2 = weightSoFar + c1.weight + c2.weight / 2;

      if (targetWeight >= mid1 && targetWeight <= mid2) {
        const span = mid2 - mid1;
        if (span === 0) return c1.mean;
        const fraction = (targetWeight - mid1) / span;
        return c1.mean + (c2.mean - c1.mean) * fraction;
      }

      weightSoFar += c1.weight;
    }

    // Above last centroid's midpoint: interpolate from c_last.mean to max
    const last = this._centroids[this._centroids.length - 1];
    const lastMid = weightSoFar + last.weight / 2;
    const tailSpan = N - lastMid;
    if (tailSpan <= 0) return this._max;
    const fraction = Math.min(1, Math.max(0, (targetWeight - lastMid) / tailSpan));
    return last.mean + (this._max - last.mean) * fraction;
  }

  /**
   * Estimates the Cumulative Distribution Function (CDF) at value x.
   * Returns a value in [0, 1].
   */
  public cdf(x: number): number {
    if (this._totalWeight === 0) return NaN;
    if (this._buffer.length > 0) this.compress();
    if (x < this._min) return 0;
    if (x >= this._max) return 1;
    if (this._centroids.length === 1) return x >= this._centroids[0].mean ? 1 : 0;

    let weightSoFar = 0;
    const N = this._totalWeight;
    const c0 = this._centroids[0];
    const mid0 = c0.weight / 2;

    if (x < c0.mean) {
      if (c0.mean === this._min) return 0;
      const fraction = (x - this._min) / (c0.mean - this._min);
      return Math.max(0, (mid0 * fraction) / N);
    }

    for (let i = 0; i < this._centroids.length - 1; i++) {
      const c1 = this._centroids[i];
      const c2 = this._centroids[i + 1];
      const mid1 = weightSoFar + c1.weight / 2;
      const mid2 = weightSoFar + c1.weight + c2.weight / 2;

      if (x >= c1.mean && x <= c2.mean) {
        const span = c2.mean - c1.mean;
        if (span === 0) return mid1 / N;
        const fraction = (x - c1.mean) / span;
        return (mid1 + (mid2 - mid1) * fraction) / N;
      }
      weightSoFar += c1.weight;
    }

    const last = this._centroids[this._centroids.length - 1];
    const midLast = weightSoFar + last.weight / 2;
    if (this._max === last.mean) return 1;
    const fraction = (x - last.mean) / (this._max - last.mean);
    return Math.min(1, (midLast + (N - midLast) * fraction) / N);
  }

  /**
   * Merges another TDigest into this instance.
   */
  public merge(other: TDigest): this {
    if (other._totalWeight === 0) return this;
    if (other._buffer.length > 0) other.compress();

    for (const c of other._centroids) {
      this._buffer.push({ mean: c.mean, weight: c.weight });
      this._totalWeight += c.weight;
    }
    if (other._min < this._min) this._min = other._min;
    if (other._max > this._max) this._max = other._max;

    this.compress();
    return this;
  }

  /** Resets the digest state */
  public reset(): void {
    this._centroids = [];
    this._buffer = [];
    this._totalWeight = 0;
    this._min = Infinity;
    this._max = -Infinity;
  }
}

// ============================================================================
// 2. HyperLogLog: 64-Bit FNV-1a Cardinality Counter
// ============================================================================

/**
 * 64-bit FNV-1a hash implementation in pure TypeScript using BigInt.
 */
export function fnv1a64(str: string): bigint {
  const FNV_OFFSET_BASIS = 0xcbf29ce484222325n;
  const FNV_PRIME = 0x100000001b3n;
  const MASK64 = 0xffffffffffffffffn;

  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      hash = ((hash ^ BigInt(code)) * FNV_PRIME) & MASK64;
    } else if (code < 0x800) {
      hash = ((hash ^ BigInt(0xc0 | (code >> 6))) * FNV_PRIME) & MASK64;
      hash = ((hash ^ BigInt(0x80 | (code & 0x3f))) * FNV_PRIME) & MASK64;
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        const cp = (code - 0xd800) * 0x400 + (next - 0xdc00) + 0x10000;
        i++;
        hash = ((hash ^ BigInt(0xf0 | (cp >> 18))) * FNV_PRIME) & MASK64;
        hash = ((hash ^ BigInt(0x80 | ((cp >> 12) & 0x3f))) * FNV_PRIME) & MASK64;
        hash = ((hash ^ BigInt(0x80 | ((cp >> 6) & 0x3f))) * FNV_PRIME) & MASK64;
        hash = ((hash ^ BigInt(0x80 | (cp & 0x3f))) * FNV_PRIME) & MASK64;
        continue;
      }
      hash = ((hash ^ BigInt(code & 0xff)) * FNV_PRIME) & MASK64;
    } else {
      hash = ((hash ^ BigInt(0xe0 | (code >> 12))) * FNV_PRIME) & MASK64;
      hash = ((hash ^ BigInt(0x80 | ((code >> 6) & 0x3f))) * FNV_PRIME) & MASK64;
      hash = ((hash ^ BigInt(0x80 | (code & 0x3f))) * FNV_PRIME) & MASK64;
    }
  }

  // 64-bit avalanche mixing ensures uniform bit dispersal
  hash ^= hash >> 33n;
  hash = (hash * 0xff51afd7ed558ccdn) & MASK64;
  hash ^= hash >> 33n;
  hash = (hash * 0xc4ceb9fe1a85ec53n) & MASK64;
  hash ^= hash >> 33n;

  return hash;
}

/**
 * HyperLogLog cardinality estimator using 64-bit FNV-1a hashing,
 * m = 2^b registers, harmonic mean, and small-cardinality bias correction (Linear Counting).
 */
export class HyperLogLog {
  public readonly b: number;
  public readonly m: number;
  private readonly registers: Uint8Array;
  private readonly alpha: number;

  constructor(b: number = 12) {
    if (b < 4 || b > 16 || !Number.isInteger(b)) {
      throw new Error(`b must be an integer between 4 and 16, got ${b}`);
    }
    this.b = b;
    this.m = 1 << b;
    this.registers = new Uint8Array(this.m);

    // Flajolet alpha_m coefficient
    if (this.m === 16) {
      this.alpha = 0.673;
    } else if (this.m === 32) {
      this.alpha = 0.697;
    } else if (this.m === 64) {
      this.alpha = 0.709;
    } else {
      this.alpha = 0.7213 / (1 + 1.079 / this.m);
    }
  }

  /**
   * Adds an item to the sketch.
   */
  public add(item: unknown): void {
    let serialized: string;
    if (typeof item === 'string') {
      serialized = item;
    } else if (typeof item === 'number' || typeof item === 'boolean' || typeof item === 'bigint') {
      serialized = String(item);
    } else if (item === null) {
      serialized = 'null';
    } else if (item === undefined) {
      serialized = 'undefined';
    } else {
      try {
        serialized = JSON.stringify(item);
      } catch {
        serialized = String(item);
      }
    }

    const h = fnv1a64(serialized);

    // Register index from the first b bits
    const shift = 64 - this.b;
    const j = Number(h >> BigInt(shift));

    // Remaining (64 - b) bits used for leading zero run count
    const remainingBits = shift;
    const mask = (1n << BigInt(remainingBits)) - 1n;
    const w = h & mask;

    let rho: number;
    if (w === 0n) {
      rho = remainingBits + 1;
    } else {
      const bitLength = w.toString(2).length;
      rho = remainingBits - bitLength + 1;
    }

    if (rho > this.registers[j]) {
      this.registers[j] = rho;
    }
  }

  /**
   * Estimates the distinct cardinality with harmonic mean and bias correction.
   */
  public estimateCardinality(): number {
    let sum = 0;
    let zeroRegisters = 0;

    for (let j = 0; j < this.m; j++) {
      const val = this.registers[j];
      sum += Math.pow(2, -val);
      if (val === 0) {
        zeroRegisters++;
      }
    }

    const rawEstimate = (this.alpha * this.m * this.m) / sum;

    // Small-range bias correction (Linear Counting)
    if (rawEstimate <= 2.5 * this.m) {
      if (zeroRegisters > 0) {
        return Math.round(this.m * Math.log(this.m / zeroRegisters));
      }
      return Math.round(rawEstimate);
    }

    // Large-range correction (for 64-bit space, 2^64 / 30 ~ 6.14e17)
    const TWO_64 = 18446744073709551616;
    if (rawEstimate > TWO_64 / 30) {
      return Math.round(-TWO_64 * Math.log(1 - rawEstimate / TWO_64));
    }

    return Math.round(rawEstimate);
  }

  /**
   * Merges another compatible HyperLogLog instance.
   */
  public merge(other: HyperLogLog): this {
    if (this.b !== other.b) {
      throw new Error(`Cannot merge HLL with different precision b (${this.b} !== ${other.b})`);
    }
    for (let j = 0; j < this.m; j++) {
      if (other.registers[j] > this.registers[j]) {
        this.registers[j] = other.registers[j];
      }
    }
    return this;
  }

  /**
   * Resets all registers to 0.
   */
  public reset(): void {
    this.registers.fill(0);
  }
}
