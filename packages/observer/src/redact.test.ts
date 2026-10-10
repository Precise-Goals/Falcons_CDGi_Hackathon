import { describe, it, expect } from 'vitest';
import { redactHeaders, redactPayload } from './redact.js';
import { ObservationCollector } from './collector.js';
import { ObservationSchema } from '@intra/shared';

describe('Deep Nested PII Scrubbing (redactPayload)', () => {
  it('scrubs sensitive keys inside objects within arrays', () => {
    const data = [
      { id: 1, name: 'Alice', password: 'plainPassword123' },
      { id: 2, name: 'Bob', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
      { id: 3, name: 'Charlie', safeField: 'safeValue' },
    ];

    const result = redactPayload(data) as typeof data;

    expect(result).toEqual([
      { id: 1, name: 'Alice', password: '[REDACTED]' },
      { id: 2, name: 'Bob', token: '[REDACTED]' },
      { id: 3, name: 'Charlie', safeField: 'safeValue' },
    ]);
  });

  it('scrubs sensitive keys inside arrays within objects', () => {
    const data = {
      sessionId: 'sess_123',
      credentialsList: [
        { secret: 'session_secret_abc', access_token: 'bearer_token_xyz' },
        { refresh_token: 'refresh_tok_999', api_key: 'key_12345' },
      ],
      tags: ['auth', 'internal'],
    };

    const result = redactPayload(data) as typeof data;

    expect(result.credentialsList[0].secret).toBe('[REDACTED]');
    expect(result.credentialsList[0].access_token).toBe('[REDACTED]');
    expect(result.credentialsList[1].refresh_token).toBe('[REDACTED]');
    expect(result.credentialsList[1].api_key).toBe('[REDACTED]');
    expect(result.sessionId).toBe('sess_123');
    expect(result.tags).toEqual(['auth', 'internal']);
  });

  it('scrubs deeply nested passwords, tokens, and secrets across multiple levels', () => {
    const deeplyNested = {
      system: {
        security: {
          authProvider: {
            users: [
              {
                profile: {
                  displayName: 'Admin User',
                  auth: {
                    password: 'complex_password_$$$',
                    token: 'Bearer eyJhbGciOi...',
                    access_token: 'acc_token_jwt_signature',
                    refresh_token: 'ref_token_long_string',
                    secret: 'client_secret_hash',
                    api_key: 'prod_api_key_456',
                    apikey: 'secondary_apikey',
                    credit_card: '4532-0000-1111-2222',
                    cvv: '999',
                    ssn: '000-12-3456',
                  },
                },
              },
            ],
          },
        },
      },
    };

    const result = redactPayload(deeplyNested) as typeof deeplyNested;
    const auth = result.system.security.authProvider.users[0].profile.auth;

    expect(auth.password).toBe('[REDACTED]');
    expect(auth.token).toBe('[REDACTED]');
    expect(auth.access_token).toBe('[REDACTED]');
    expect(auth.refresh_token).toBe('[REDACTED]');
    expect(auth.secret).toBe('[REDACTED]');
    expect(auth.api_key).toBe('[REDACTED]');
    expect(auth.apikey).toBe('[REDACTED]');
    expect(auth.credit_card).toBe('[REDACTED]');
    expect(auth.cvv).toBe('[REDACTED]');
    expect(auth.ssn).toBe('[REDACTED]');

    // Verify non-sensitive fields are preserved
    expect(result.system.security.authProvider.users[0].profile.displayName).toBe('Admin User');
  });

  it('handles nested arrays of arrays containing sensitive objects', () => {
    const matrix = [
      [
        { token: 'tok_in_matrix', safe: 1 },
        { secret: 'sec_in_matrix', safe: 2 },
      ],
      [
        { password: 'pwd_in_matrix', safe: 3 },
      ],
    ];

    const result = redactPayload(matrix) as typeof matrix;

    expect(result[0][0].token).toBe('[REDACTED]');
    expect(result[0][0].safe).toBe(1);
    expect(result[0][1].secret).toBe('[REDACTED]');
    expect(result[0][1].safe).toBe(2);
    expect(result[1][0].password).toBe('[REDACTED]');
    expect(result[1][0].safe).toBe(3);
  });

  it('scrubs keys with mixed casing in payload', () => {
    const mixedCasePayload = {
      PASSWORD: 'password1',
      Password: 'password2',
      Token: 'token_val',
      ACCESS_TOKEN: 'jwt_access',
      Refresh_Token: 'jwt_refresh',
      Api_Key: 'api_key_val',
      APIKEY: 'apikey_val',
      Credit_Card: '1234-5678-9012-3456',
      CVV: '123',
      SSN: '123-45-6789',
      Secret: 'secret_value',
    };

    const result = redactPayload(mixedCasePayload) as Record<string, unknown>;

    for (const key of Object.keys(mixedCasePayload)) {
      expect(result[key]).toBe('[REDACTED]');
    }
  });

  it('preserves boundary and primitive values without modification', () => {
    expect(redactPayload(null)).toBeNull();
    expect(redactPayload(undefined)).toBeUndefined();
    expect(redactPayload('')).toBe('');
    expect(redactPayload('plain string')).toBe('plain string');
    expect(redactPayload(0)).toBe(0);
    expect(redactPayload(42.5)).toBe(42.5);
    expect(redactPayload(true)).toBe(true);
    expect(redactPayload(false)).toBe(false);
    expect(redactPayload([])).toEqual([]);
    expect(redactPayload({})).toEqual({});
    expect(redactPayload([1, 'two', null, undefined, true])).toEqual([1, 'two', null, undefined, true]);
  });

  it('provides false-positive resistance by preserving benign keys with partial name overlap', () => {
    const benignPayload = {
      token_type: 'Bearer',
      tokenizer: 'bpe',
      pass_count: 5,
      secret_name: 'config_key',
      public_api_key_id: 'pk_123',
      credit_card_last4: '4321',
      ssn_masked: '***-**-1234',
      user_password_set_at: '2026-01-01T00:00:00Z',
    };

    const result = redactPayload(benignPayload) as Record<string, unknown>;

    expect(result).toEqual(benignPayload);
  });

  it('does not mutate the original input payload object', () => {
    const original = {
      user: {
        password: 'mySecretPassword',
      },
    };

    const copy = JSON.parse(JSON.stringify(original));
    redactPayload(original);

    expect(original).toEqual(copy);
  });
});

describe('Case-Insensitive Header Redaction (redactHeaders)', () => {
  it('redacts sensitive headers regardless of letter casing', () => {
    const headers = {
      Authorization: 'Bearer secret_jwt_token',
      AUTHORIZATION: 'Bearer uppercase_token',
      'x-Api-Key': 'key-header-mixed',
      'X-API-KEY': 'key-header-upper',
      'api-key': 'api-key-lower',
      'Api-Key': 'api-key-mixed',
      cookie: 'session_id=abcdef123456',
      COOKIE: 'SESSION_ID=UPPERCASE',
      'Set-Cookie': 'session=xyz; Secure; HttpOnly',
      'SET-COOKIE': 'auth=token123; HttpOnly',
      'Proxy-Authorization': 'Basic dXNlcjpwYXNz',
      'PROXY-AUTHORIZATION': 'Basic dXNlcjpwYXNzMg==',
    };

    const redacted = redactHeaders(headers);

    for (const key of Object.keys(headers)) {
      expect(redacted[key]).toBe('[REDACTED]');
    }
  });

  it('preserves benign headers with original casing and values', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/html,application/xhtml+xml',
      'X-Request-Id': 'req-987-xyz',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Cache-Control': 'no-cache, no-store',
      'Host': 'api.example.com',
    };

    const redacted = redactHeaders(headers);

    expect(redacted).toEqual(headers);
  });

  it('handles empty and single-item header records', () => {
    expect(redactHeaders({})).toEqual({});
    expect(redactHeaders({ 'x-custom': 'val' })).toEqual({ 'x-custom': 'val' });
    expect(redactHeaders({ Authorization: 'Bearer token' })).toEqual({ Authorization: '[REDACTED]' });
  });
});

describe('ObservationCollector Buffer Eviction (FIFO)', () => {
  it('evicts the oldest observations when maxBufferSize is exceeded', () => {
    const bufferSize = 3;
    const collector = new ObservationCollector(bufferSize);

    for (let i = 1; i <= 5; i++) {
      collector.record({
        service: 'payments',
        endpoint: `/charge/${i}`,
        method: 'POST',
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        latencyMs: 15 * i,
      });
    }

    const all = collector.getAll();
    expect(all).toHaveLength(bufferSize);

    // Oldest entries (/charge/1 and /charge/2) must be evicted
    expect(all[0].endpoint).toBe('/charge/3');
    expect(all[1].endpoint).toBe('/charge/4');
    expect(all[2].endpoint).toBe('/charge/5');
  });

  it('behaves correctly when maxBufferSize is 1', () => {
    const collector = new ObservationCollector(1);

    collector.record({
      service: 'users',
      endpoint: '/first',
      method: 'GET',
      status: 200,
      headers: {},
      latencyMs: 10,
    });

    collector.record({
      service: 'users',
      endpoint: '/second',
      method: 'GET',
      status: 200,
      headers: {},
      latencyMs: 12,
    });

    const all = collector.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].endpoint).toBe('/second');
  });

  it('clears all recorded observations when clear() is called', () => {
    const collector = new ObservationCollector(10);
    collector.record({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: {},
      latencyMs: 5,
    });

    expect(collector.getAll()).toHaveLength(1);
    collector.clear();
    expect(collector.getAll()).toHaveLength(0);
  });

  it('returns a shallow copy from getAll() without exposing internal array reference', () => {
    const collector = new ObservationCollector(5);
    collector.record({
      service: 'orders',
      endpoint: '/orders',
      method: 'GET',
      status: 200,
      headers: {},
      latencyMs: 8,
    });

    const retrieved = collector.getAll();
    expect(retrieved).toHaveLength(1);

    retrieved.pop();
    expect(retrieved).toHaveLength(0);
    expect(collector.getAll()).toHaveLength(1);
  });
});

describe('Latency and High-Volume Burst Stress Test', () => {
  it('records 100 observations sequentially without memory leakage or state corruption', () => {
    const collector = new ObservationCollector(150);
    const count = 100;

    for (let i = 0; i < count; i++) {
      const obs = collector.record({
        service: i % 2 === 0 ? 'billing' : 'shipping',
        endpoint: `/resource/${i}`,
        method: i % 3 === 0 ? 'POST' : 'GET',
        status: 200 + (i % 5),
        headers: {
          Authorization: `Bearer token_val_${i}`,
          'X-Request-Id': `req_${i}`,
          Cookie: `session=${i}; secret_part=yes`,
        },
        body: {
          iteration: i,
          token: `jwt_val_${i}`,
          nested: {
            access_token: `bearer_${i}`,
            data: `payload_sample_${i}`,
            metrics: [i, i * 2, i * 3],
          },
        },
        latencyMs: 5 + (i % 50),
      });

      // Verify immediate redaction and schema compliance on each recorded observation
      expect(obs.headers.Authorization).toBe('[REDACTED]');
      expect(obs.headers.Cookie).toBe('[REDACTED]');
      expect(obs.headers['X-Request-Id']).toBe(`req_${i}`);
      expect((obs.body as Record<string, unknown>).token).toBe('[REDACTED]');
      expect(ObservationSchema.safeParse(obs).success).toBe(true);
    }

    const all = collector.getAll();
    expect(all).toHaveLength(count);

    // Verify all IDs are unique strings
    const uniqueIds = new Set(all.map((o) => o.id));
    expect(uniqueIds.size).toBe(count);

    // Verify timestamps are valid ISO dates and sorted chronologically
    for (let i = 0; i < all.length; i++) {
      const parsedTime = Date.parse(all[i].timestamp);
      expect(Number.isNaN(parsedTime)).toBe(false);

      if (i > 0) {
        const prevTime = Date.parse(all[i - 1].timestamp);
        expect(parsedTime).toBeGreaterThanOrEqual(prevTime);
      }
    }

    // Verify state integrity across samples
    const sample = all[42];
    expect(sample.endpoint).toBe('/resource/42');
    expect(sample.service).toBe('billing');
    expect(sample.status).toBe(202);
    expect((sample.body as any).iteration).toBe(42);
    expect((sample.body as any).nested.data).toBe('payload_sample_42');
    expect((sample.body as any).nested.access_token).toBe('[REDACTED]');
  });
});

describe('Filter Tests (getByService and getByEndpoint)', () => {
  it('filters by service with case-insensitivity and limit constraints', () => {
    const collector = new ObservationCollector(50);

    // Add observations with varying casings
    collector.record({ service: 'Auth-Service', endpoint: '/login', method: 'POST', status: 200, headers: {}, latencyMs: 10 });
    collector.record({ service: 'AUTH-SERVICE', endpoint: '/verify', method: 'POST', status: 200, headers: {}, latencyMs: 15 });
    collector.record({ service: 'auth-service', endpoint: '/refresh', method: 'POST', status: 200, headers: {}, latencyMs: 12 });
    collector.record({ service: 'auth-service', endpoint: '/logout', method: 'POST', status: 200, headers: {}, latencyMs: 8 });
    collector.record({ service: 'Payment-Service', endpoint: '/pay', method: 'POST', status: 200, headers: {}, latencyMs: 50 });

    // Case-insensitivity checks
    expect(collector.getByService('auth-service')).toHaveLength(4);
    expect(collector.getByService('AUTH-SERVICE')).toHaveLength(4);
    expect(collector.getByService('Auth-Service')).toHaveLength(4);
    expect(collector.getByService('aUtH-sErViCe')).toHaveLength(4);

    // Limit constraint: should return the latest N observations
    const limited = collector.getByService('auth-service', 2);
    expect(limited).toHaveLength(2);
    expect(limited[0].endpoint).toBe('/refresh');
    expect(limited[1].endpoint).toBe('/logout');

    // Unknown service returns empty array
    expect(collector.getByService('non-existent')).toEqual([]);
  });

  it('filters by endpoint with case-insensitivity and limit constraints', () => {
    const collector = new ObservationCollector(50);

    collector.record({ service: 'Users', endpoint: '/Api/V1/Users', method: 'GET', status: 200, headers: {}, latencyMs: 20 });
    collector.record({ service: 'users', endpoint: '/api/v1/users', method: 'GET', status: 200, headers: {}, latencyMs: 22 });
    collector.record({ service: 'USERS', endpoint: '/API/V1/USERS', method: 'GET', status: 200, headers: {}, latencyMs: 18 });
    collector.record({ service: 'users', endpoint: '/api/v1/users/profile', method: 'GET', status: 200, headers: {}, latencyMs: 15 });
    collector.record({ service: 'Inventory', endpoint: '/api/v1/users', method: 'GET', status: 200, headers: {}, latencyMs: 10 });

    // Case-insensitivity check across both service and endpoint
    const matches = collector.getByEndpoint('users', '/api/v1/users');
    expect(matches).toHaveLength(3);

    const matchesUpper = collector.getByEndpoint('USERS', '/API/V1/USERS');
    expect(matchesUpper).toHaveLength(3);

    // Limit constraint returns latest matching observations
    const latestOne = collector.getByEndpoint('users', '/api/v1/users', 1);
    expect(latestOne).toHaveLength(1);
    expect(latestOne[0].latencyMs).toBe(18);

    // Mismatched service and endpoint
    expect(collector.getByEndpoint('inventory', '/api/v1/users/profile')).toEqual([]);
    expect(collector.getByEndpoint('users', '/unknown-endpoint')).toEqual([]);
    expect(collector.getByEndpoint('unknown-service', '/api/v1/users')).toEqual([]);
  });
});

describe('ObservationCollector Error Body and Metadata Scrubbing', () => {
  it('redacts sensitive information in errorBody', () => {
    const collector = new ObservationCollector(10);

    const obs = collector.record({
      service: 'auth',
      endpoint: '/login',
      method: 'POST',
      status: 401,
      headers: {
        AUTHORIZATION: 'Bearer invalid_token',
      },
      body: {
        username: 'user@example.com',
        password: 'submitted_wrong_password',
      },
      errorBody: {
        error: 'Unauthorized',
        details: {
          secret: 'internal_session_secret',
          failedToken: {
            token: 'expired_jwt_val',
            safeReason: 'token_expired',
          },
        },
      },
      latencyMs: 33,
    });

    expect(obs.headers.AUTHORIZATION).toBe('[REDACTED]');
    expect((obs.body as any).password).toBe('[REDACTED]');

    const err = obs.errorBody as any;
    expect(err.error).toBe('Unauthorized');
    expect(err.details.secret).toBe('[REDACTED]');
    expect(err.details.failedToken.token).toBe('[REDACTED]');
    expect(err.details.failedToken.safeReason).toBe('token_expired');
  });

  it('normalizes HTTP method to uppercase in observation', () => {
    const collector = new ObservationCollector(5);

    const obs1 = collector.record({
      service: 'svc',
      endpoint: '/path',
      method: 'get',
      status: 200,
      headers: {},
      latencyMs: 5,
    });

    const obs2 = collector.record({
      service: 'svc',
      endpoint: '/path',
      method: 'pOsT',
      status: 201,
      headers: {},
      latencyMs: 10,
    });

    expect(obs1.method).toBe('GET');
    expect(obs2.method).toBe('POST');
  });
});
