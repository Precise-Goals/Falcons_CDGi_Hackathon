import { describe, it, expect } from 'vitest';
import { ObservationRingBuffer } from './ringbuffer.js';

describe('@intra/observer Ring Buffer Spooler', () => {
  it('enforces positive capacity validation', () => {
    expect(() => new ObservationRingBuffer(0)).toThrow('must be positive');
    expect(() => new ObservationRingBuffer(-5)).toThrow('must be positive');
  });

  it('stores and retrieves elements below capacity without eviction', () => {
    const ring = new ObservationRingBuffer<string>(5);
    expect(ring.isEmpty()).toBe(true);
    expect(ring.size()).toBe(0);

    ring.push('obs_1');
    ring.push('obs_2');
    ring.push('obs_3');

    expect(ring.size()).toBe(3);
    expect(ring.isFull()).toBe(false);
    expect(ring.toArray()).toEqual(['obs_1', 'obs_2', 'obs_3']);
    expect(ring.peekHead()).toBe('obs_1');
    expect(ring.peekTail()).toBe('obs_3');
  });

  it('evicts oldest elements in FIFO order when capacity is exceeded', () => {
    const ring = new ObservationRingBuffer<number>(3);
    ring.push(1);
    ring.push(2);
    ring.push(3);
    expect(ring.isFull()).toBe(true);
    expect(ring.toArray()).toEqual([1, 2, 3]);

    // Push 4th element -> evicts 1
    ring.push(4);
    expect(ring.size()).toBe(3);
    expect(ring.toArray()).toEqual([2, 3, 4]);
    expect(ring.peekHead()).toBe(2);
    expect(ring.peekTail()).toBe(4);

    // Push 5th element -> evicts 2
    ring.push(5);
    expect(ring.toArray()).toEqual([3, 4, 5]);
    expect(ring.peekHead()).toBe(3);
    expect(ring.peekTail()).toBe(5);
  });

  it('supports batch push and clear operations', () => {
    const ring = new ObservationRingBuffer<string>(4);
    ring.pushBatch(['a', 'b', 'c', 'd', 'e', 'f']);

    expect(ring.size()).toBe(4);
    expect(ring.toArray()).toEqual(['c', 'd', 'e', 'f']);

    ring.clear();
    expect(ring.size()).toBe(0);
    expect(ring.isEmpty()).toBe(true);
    expect(ring.toArray()).toEqual([]);
  });
});
