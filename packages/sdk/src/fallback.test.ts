import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntraClient } from './client.js';
import { FallbackManager } from './fallback.js';
import { installFetchInterceptor } from './interceptor.js';

describe('@intra/sdk Circuit Breaker Fallback Handler', () => {
  let client: IntraClient;
  let fallbackMgr: FallbackManager;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    client = new IntraClient({ engineUrl: 'http://localhost:4000' });
    fallbackMgr = new FallbackManager();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('invokes registered endpoint fallback when upstream responds with 503', async () => {
    // Upstream service returns 503 Service Unavailable
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('Service Unavailable', { status: 503 })
    );

    fallbackMgr.register('/payments/charge', () => ({
      status: 'pending_queued',
      offlineRecovery: true,
    }));

    const uninstall = installFetchInterceptor({
      client,
      fallbackHandler: (endpoint, err) => fallbackMgr.handle(endpoint, err),
    });

    const response = await fetch('http://api.internal/payments/charge');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-intra-fallback')).toBe('true');

    const json = await response.json();
    expect(json).toEqual({
      status: 'pending_queued',
      offlineRecovery: true,
    });

    uninstall();
  });

  it('gracefully recovers when network error rejects fetch promise', async () => {
    // Upstream host unreachable (network drop / DNS failure)
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED: host unreachable'));

    fallbackMgr.register('/search', () => ({
      items: [],
      total: 0,
      cached: true,
    }));

    const uninstall = installFetchInterceptor({
      client,
      fallbackHandler: (endpoint, err) => fallbackMgr.handle(endpoint, err),
    });

    const response = await fetch('http://api.internal/search');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-intra-fallback')).toBe('true');
    expect(response.headers.get('x-intra-error')).toContain('ECONNREFUSED');

    const json = await response.json();
    expect(json).toEqual({ items: [], total: 0, cached: true });

    uninstall();
  });
});
