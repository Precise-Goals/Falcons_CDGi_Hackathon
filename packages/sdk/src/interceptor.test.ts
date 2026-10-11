import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntraClient } from './client.js';
import { installFetchInterceptor } from './interceptor.js';

describe('@intra/sdk Transparent HTTP Proxy Fetch Interceptor', () => {
  let client: IntraClient;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    client = new IntraClient({ engineUrl: 'http://localhost:4000' });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('automatically adapts response payload via patched globalThis.fetch', async () => {
    // Mock base fetch returning drifted payload
    const mockResponse = new Response(
      JSON.stringify({ id: 'usr_1', display_name: 'Dr. Turing' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
    const mockedFetch = vi.fn().mockResolvedValue(mockResponse);
    globalThis.fetch = mockedFetch;

    // Register adapter on /users/profile
    client.registerAdapter('/users/profile', (data) => {
      const item = data as { id: string; display_name: string };
      return { id: item.id, name: item.display_name };
    });

    const uninstall = installFetchInterceptor({ client });

    const response = await fetch('http://api.internal/users/profile');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-intra-adapted')).toBe('true');

    const json = await response.json();
    expect(json).toEqual({ id: 'usr_1', name: 'Dr. Turing' });

    uninstall();
    expect(globalThis.fetch).toBe(mockedFetch);
  });
});
