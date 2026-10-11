import { describe, it, expect, vi } from 'vitest';
import { CanaryGuard } from './canary.js';

describe('@intra/validator Canary Circuit Breaker Guard', () => {
  it('triggers automated rollback and invokes callback upon Wald rejection', () => {
    const onRollback = vi.fn();
    const onPromote = vi.fn();

    const guard = new CanaryGuard({
      rollbackHandle: 'rollback_payments_charge_101',
      adapterId: 'adapter_payments_101',
      sprtOptions: { p0: 0.01, p1: 0.05, alpha: 0.05, beta: 0.05 },
      onRollback,
      onPromote,
    });

    expect(guard.isTripped()).toBe(false);

    // Two consecutive failures trip the upper threshold (~2.944)
    guard.recordTrial(true);
    expect(guard.isTripped()).toBe(false);

    const decision = guard.recordTrial(true);
    expect(decision).toBe('rollback');
    expect(guard.isTripped()).toBe(true);

    expect(onRollback).toHaveBeenCalledTimes(1);
    expect(onRollback).toHaveBeenCalledWith(
      'rollback_payments_charge_101',
      expect.stringContaining('Canary tripped Wald upper boundary')
    );
    expect(onPromote).not.toHaveBeenCalled();

    // Subsequent trials stay in tripped rollback state
    expect(guard.recordTrial(false)).toBe('rollback');
  });

  it('triggers promotion callback when canary passes Wald acceptance criteria', () => {
    const onRollback = vi.fn();
    const onPromote = vi.fn();

    const guard = new CanaryGuard({
      rollbackHandle: 'rollback_search_202',
      sprtOptions: { p0: 0.01, p1: 0.05, alpha: 0.05, beta: 0.05 },
      onRollback,
      onPromote,
    });

    // Feed successes until lower boundary reached
    for (let i = 0; i < 80; i++) {
      const decision = guard.recordTrial(false);
      if (decision === 'promote') break;
    }

    expect(guard.isPromoted()).toBe(true);
    expect(guard.isTripped()).toBe(false);
    expect(onPromote).toHaveBeenCalledTimes(1);
    expect(onPromote).toHaveBeenCalledWith(
      expect.stringContaining('Canary crossed Wald promotion boundary')
    );
    expect(onRollback).not.toHaveBeenCalled();
  });

  it('exposes detailed live status snapshot', () => {
    const guard = new CanaryGuard({
      rollbackHandle: 'rb_test',
    });

    guard.recordTrial(false);
    const status = guard.getStatus();

    expect(status.sampleCount).toBe(1);
    expect(status.errorCount).toBe(0);
    expect(status.isTripped).toBe(false);
    expect(status.isPromoted).toBe(false);
  });
});
