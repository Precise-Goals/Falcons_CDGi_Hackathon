# @intra/sdk

Client SDK & Transparent HTTP Proxy Interceptor for Autonomous Drift Mitigation.

## Overview

`@intra/sdk` integrates into frontend and microservice client applications to intercept outbound HTTP traffic, transparently executing synthesized adapters and circuit breaker fallbacks without touching application business logic.

```
      Application fetch()
              │
              ▼
    ┌───────────────────┐
    │ Fetch Interceptor │ (globalThis.fetch monkey-patch)
    └─────────┬─────────┘
              ▼
    ┌───────────────────┐
    │ Upstream Service  │ (Remote HTTP / REST / GraphQL)
    └─────────┬─────────┘
              ▼
    ┌───────────────────┐
    │ Adapter Dispatch  │ (Transforms payload in-flight if drift active)
    └─────────┬─────────┘
              ▼
    ┌───────────────────┐
    │ Fallback Recovery │ (Gracefully intercepts 5xx or offline drops)
    └───────────────────┘
```

## Quick Start

```typescript
import { IntraClient, installFetchInterceptor, FallbackManager } from '@intra/sdk';

// 1. Initialize client connected to Intra Engine
const client = new IntraClient({
  engineUrl: 'https://intra-vert.vercel.app',
  appName: 'shipwell-client',
});

// 2. Setup circuit breaker fallback
const fallbackMgr = new FallbackManager();
fallbackMgr.register('/payments/charge', () => ({
  status: 'pending_queued',
  offlineRecovery: true,
}));

// 3. Transparently patch globalThis.fetch
const uninstall = installFetchInterceptor({
  client,
  fallbackHandler: (endpoint, err) => fallbackMgr.handle(endpoint, err),
});

// Regular fetch() now automatically adapts drifted responses!
const res = await fetch('/payments/charge', { method: 'POST' });
const data = await res.json();
```

## Features

- **Zero-Touch Integration**: Automatically inspects `application/json` responses and applies registered adapters.
- **In-Flight Header Stamp**: Injects `x-intra-adapted: true` header to indicate runtime transformation.
- **Circuit Breaker Resilience**: Prevents unhandled promise rejections by serving configured fallbacks with `x-intra-fallback: true`.
- **Clean Uninstallation**: Calling `uninstall()` fully restores original `globalThis.fetch`.
