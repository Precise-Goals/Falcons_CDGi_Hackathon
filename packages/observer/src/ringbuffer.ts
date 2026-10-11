/**
 * O(1) Bounded Ring Buffer In-Memory Observation Spooler
 */

export class ObservationRingBuffer<T> {
  private buffer: Array<T | undefined>;
  public readonly capacity: number;
  private head = 0; // index of next write
  private count = 0;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error(`Ring buffer capacity must be positive, got ${capacity}`);
    }
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Pushes an item into the ring buffer in O(1) time, overwriting the oldest element if full.
   */
  public push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /**
   * Pushes multiple items in batch.
   */
  public pushBatch(items: T[]): void {
    for (const item of items) {
      this.push(item);
    }
  }

  /**
   * Returns current count of items in the buffer.
   */
  public size(): number {
    return this.count;
  }

  public isFull(): boolean {
    return this.count === this.capacity;
  }

  public isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Returns all items in chronological order (oldest to newest).
   */
  public toArray(): T[] {
    if (this.count === 0) return [];

    const result: T[] = [];
    if (this.count < this.capacity) {
      for (let i = 0; i < this.count; i++) {
        result.push(this.buffer[i] as T);
      }
    } else {
      // Buffer is full; oldest element is at this.head
      for (let i = 0; i < this.capacity; i++) {
        const idx = (this.head + i) % this.capacity;
        result.push(this.buffer[idx] as T);
      }
    }
    return result;
  }

  /**
   * Peeks the newest item.
   */
  public peekTail(): T | undefined {
    if (this.count === 0) return undefined;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[idx];
  }

  /**
   * Peeks the oldest item.
   */
  public peekHead(): T | undefined {
    if (this.count === 0) return undefined;
    if (this.count < this.capacity) {
      return this.buffer[0];
    }
    return this.buffer[this.head];
  }

  /**
   * Clears all items from the ring buffer.
   */
  public clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.count = 0;
  }
}
