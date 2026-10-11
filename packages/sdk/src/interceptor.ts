/**
 * Transparent HTTP Proxy Fetch Interceptor for Intra Client SDK
 */

import { IntraClient } from './client.js';

export type FallbackHandler = (
  endpoint: string,
  error: unknown
) => Promise<Response> | Response;

export interface FetchInterceptorOptions {
  client: IntraClient;
  fallbackHandler?: FallbackHandler;
}

/**
 * Patches globalThis.fetch to automatically intercept upstream responses
 * and execute active safe-handling adapters in-flight.
 * Returns an uninstaller function that restores original globalThis.fetch.
 */
export function installFetchInterceptor(options: FetchInterceptorOptions): () => void {
  const originalFetch = globalThis.fetch;
  const { client, fallbackHandler } = options;

  globalThis.fetch = async function intraInterceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    let pathname = '';
    try {
      pathname = new URL(urlString, 'http://localhost').pathname;
    } catch {
      pathname = urlString;
    }

    let response: Response;
    try {
      response = await originalFetch(input, init);
    } catch (networkError) {
      if (fallbackHandler) {
        return await fallbackHandler(pathname, networkError);
      }
      throw networkError;
    }

    // Handle 5xx server failures via fallback handler if configured
    if (response.status >= 500 && fallbackHandler) {
      try {
        return await fallbackHandler(pathname, new Error(`Upstream returned ${response.status}`));
      } catch {
        return response;
      }
    }

    // Inspect content type to adapt JSON payloads
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const cloned = response.clone();
        const json = await cloned.json();
        const adaptedJson = client.adaptResponse(pathname, json);

        // Reconstruct modified response maintaining status & headers
        const headers = new Headers(response.headers);
        headers.set('x-intra-adapted', 'true');

        return new Response(JSON.stringify(adaptedJson), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch {
        return response;
      }
    }

    return response;
  };

  return function uninstall(): void {
    globalThis.fetch = originalFetch;
  };
}
