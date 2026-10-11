/**
 * Client-Side Circuit Breaker Fallback Manager for Unreachable or 5xx Services
 */

export type FallbackProvider = (endpoint: string, error: unknown) => unknown;

export class FallbackManager {
  private fallbackRegistry: Map<string, FallbackProvider> = new Map();
  private defaultProvider?: FallbackProvider;

  constructor(defaultFallback?: FallbackProvider) {
    this.defaultProvider = defaultFallback;
  }

  /**
   * Registers a dedicated fallback response or generator for a specific endpoint.
   */
  public register(
    endpoint: string,
    fallback: unknown | FallbackProvider
  ): void {
    if (typeof fallback === 'function') {
      this.fallbackRegistry.set(endpoint.toLowerCase(), fallback as FallbackProvider);
    } else {
      this.fallbackRegistry.set(endpoint.toLowerCase(), () => fallback);
    }
  }

  /**
   * Clears registered fallback for an endpoint.
   */
  public unregister(endpoint: string): void {
    this.fallbackRegistry.delete(endpoint.toLowerCase());
  }

  /**
   * Creates a synthesized HTTP Response containing fallback payload and diagnostics header.
   */
  public handle(endpoint: string, error: unknown): Response {
    const norm = endpoint.toLowerCase();
    const provider = this.fallbackRegistry.get(norm) ?? this.defaultProvider;

    const payload = provider
      ? provider(endpoint, error)
      : {
          fallback: true,
          endpoint,
          message: 'Circuit breaker triggered fallback. Service temporarily degraded.',
        };

    const headers = new Headers({
      'content-type': 'application/json',
      'x-intra-fallback': 'true',
      'x-intra-error': error instanceof Error ? error.message : String(error),
    });

    return new Response(JSON.stringify(payload), {
      status: 200,
      statusText: 'OK (Intra Fallback)',
      headers,
    });
  }
}
