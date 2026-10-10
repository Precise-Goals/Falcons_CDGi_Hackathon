import { describe, it, expect } from 'vitest';
import { IntraClient, type IntraSdkConfig } from './client.js';

describe('@intra/sdk Comprehensive Routing, Lifecycle & Transformation Suite', () => {
  // ===========================================================================
  // 1. Client Initialization & Configuration
  // ===========================================================================
  describe('1. Client Initialization & Configuration', () => {
    it('initializes with minimal configuration (engineUrl only)', () => {
      const config: IntraSdkConfig = {
        engineUrl: 'http://localhost:3001',
      };
      const client = new IntraClient(config);

      const retrievedConfig = client.getConfig();
      expect(retrievedConfig).toEqual(config);
      expect(retrievedConfig.engineUrl).toBe('http://localhost:3001');
      expect(retrievedConfig.apiKey).toBeUndefined();
      expect(retrievedConfig.appName).toBeUndefined();
    });

    it('initializes with full configuration (engineUrl, apiKey, appName)', () => {
      const config: IntraSdkConfig = {
        engineUrl: 'https://engine.intra.internal:8443',
        apiKey: 'intra_sec_key_9876543210_xyz',
        appName: 'payment-gateway-service',
      };
      const client = new IntraClient(config);

      const retrievedConfig = client.getConfig();
      expect(retrievedConfig).toEqual({
        engineUrl: 'https://engine.intra.internal:8443',
        apiKey: 'intra_sec_key_9876543210_xyz',
        appName: 'payment-gateway-service',
      });
      expect(retrievedConfig.apiKey).toBe('intra_sec_key_9876543210_xyz');
      expect(retrievedConfig.appName).toBe('payment-gateway-service');
    });

    it('preserves configuration with only engineUrl and apiKey', () => {
      const config: IntraSdkConfig = {
        engineUrl: 'http://127.0.0.1:4000',
        apiKey: 'bearer_token_abc123',
      };
      const client = new IntraClient(config);

      expect(client.getConfig().engineUrl).toBe('http://127.0.0.1:4000');
      expect(client.getConfig().apiKey).toBe('bearer_token_abc123');
      expect(client.getConfig().appName).toBeUndefined();
    });

    it('preserves configuration with only engineUrl and appName', () => {
      const config: IntraSdkConfig = {
        engineUrl: 'https://api.intra.io/v1',
        appName: 'web-dashboard-frontend',
      };
      const client = new IntraClient(config);

      expect(client.getConfig().engineUrl).toBe('https://api.intra.io/v1');
      expect(client.getConfig().appName).toBe('web-dashboard-frontend');
      expect(client.getConfig().apiKey).toBeUndefined();
    });

    it('handles various URL boundary formats (trailing slashes, ports, IP addresses)', () => {
      const testUrls = [
        'http://localhost',
        'http://localhost:8080/',
        'https://192.168.1.100:9000/engine/subpath',
        'http://intra-engine.internal.cluster.local:3000',
      ];

      for (const url of testUrls) {
        const client = new IntraClient({ engineUrl: url });
        expect(client.getConfig().engineUrl).toBe(url);
      }
    });

    it('handles unicode and special characters in appName and apiKey', () => {
      const unicodeConfig: IntraSdkConfig = {
        engineUrl: 'http://localhost:3001',
        apiKey: 'key_with_symbols!@#$%^&*()_+{}[]:;"<>,.?/',
        appName: '服務-Сервис-Enterprise 🚀 (Prod:US-East)',
      };
      const client = new IntraClient(unicodeConfig);

      expect(client.getConfig().appName).toBe('服務-Сервис-Enterprise 🚀 (Prod:US-East)');
      expect(client.getConfig().apiKey).toBe('key_with_symbols!@#$%^&*()_+{}[]:;"<>,.?/');
    });
  });

  // ===========================================================================
  // 2. Case-Insensitive Adapter Dispatch
  // ===========================================================================
  describe('2. Case-Insensitive Adapter Dispatch', () => {
    it('matches uppercase registered endpoints with lowercase query', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      client.registerAdapter('/USERS', (data: any) => ({
        ...data,
        adapted: true,
      }));

      const response = client.adaptResponse('/users', { id: 'u1' });
      expect(response).toEqual({ id: 'u1', adapted: true });
    });

    it('matches uppercase registered endpoints with mixed-case query', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      client.registerAdapter('/USERS', (data: any) => ({
        ...data,
        handledByUpper: true,
      }));

      expect(client.adaptResponse('/Users', { id: 1 })).toEqual({ id: 1, handledByUpper: true });
      expect(client.adaptResponse('/uSeRs', { id: 2 })).toEqual({ id: 2, handledByUpper: true });
      expect(client.adaptResponse('/USERS', { id: 3 })).toEqual({ id: 3, handledByUpper: true });
    });

    it('matches mixed-case registered endpoints with any query casing', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      // Registered with Mixed-Case endpoint
      client.registerAdapter('/Payments/Charge', (data: any) => ({
        ...data,
        status: 'adapted_charge',
      }));

      // Query in all lower case
      expect(client.adaptResponse('/payments/charge', { id: 'ch_1' })).toEqual({
        id: 'ch_1',
        status: 'adapted_charge',
      });

      // Query in all upper case
      expect(client.adaptResponse('/PAYMENTS/CHARGE', { id: 'ch_2' })).toEqual({
        id: 'ch_2',
        status: 'adapted_charge',
      });

      // Query in matching mixed case
      expect(client.adaptResponse('/Payments/Charge', { id: 'ch_3' })).toEqual({
        id: 'ch_3',
        status: 'adapted_charge',
      });

      // Query in alternate mixed case
      expect(client.adaptResponse('/payments/CHARGE', { id: 'ch_4' })).toEqual({
        id: 'ch_4',
        status: 'adapted_charge',
      });
    });

    it('matches lowercase registered endpoints with uppercase and mixed query', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      client.registerAdapter('/api/v1/search/items', (data: any) => ({
        items: data.items.map((i: string) => i.toUpperCase()),
      }));

      const resUpper = client.adaptResponse('/API/V1/SEARCH/ITEMS', { items: ['apple', 'banana'] });
      expect(resUpper).toEqual({ items: ['APPLE', 'BANANA'] });

      const resMixed = client.adaptResponse('/Api/V1/Search/Items', { items: ['cherry'] });
      expect(resMixed).toEqual({ items: ['CHERRY'] });
    });

    it('dispatches multi-segment endpoints with IDs and punctuation case-insensitively', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      client.registerAdapter('/API/V2/TENANTS/T-100/WEBHOOKS_CONFIG', (data: any) => ({
        ...data,
        verified: true,
      }));

      const result = client.adaptResponse('/api/v2/tenants/t-100/webhooks_config', { enabled: true });
      expect(result).toEqual({ enabled: true, verified: true });
    });

    it('removes adapter cleanly when removeAdapter is called with different casing', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      // Registered with uppercase
      client.registerAdapter('/USERS', (data: any) => ({ ...data, modified: true }));

      // Verify adapter is active
      expect(client.adaptResponse('/users', { id: 1 })).toEqual({ id: 1, modified: true });

      // Remove with lowercase endpoint
      client.removeAdapter('/users');

      // Subsequent query returns original unmodified data
      const untouched = { id: 1 };
      const output = client.adaptResponse('/users', untouched);
      expect(output).toBe(untouched);
      expect(output).toEqual({ id: 1 });
    });

    it('removes adapter registered with lowercase when removeAdapter is called with uppercase', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      client.registerAdapter('/payments/refund', (data: any) => ({ ...data, refunded: true }));

      // Remove with uppercase
      client.removeAdapter('/PAYMENTS/REFUND');

      const original = { amount: 50 };
      expect(client.adaptResponse('/payments/refund', original)).toBe(original);
    });
  });

  // ===========================================================================
  // 3. Lifecycle & Dynamism
  // ===========================================================================
  describe('3. Lifecycle & Dynamism', () => {
    it('immediately swaps logic when an existing adapter is overwritten', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      // Version 1 of adapter: adds prefix 'V1: '
      client.registerAdapter('/users', (data: any) => ({
        ...data,
        name: `V1: ${data.name}`,
      }));

      expect(client.adaptResponse('/users', { name: 'Alice' })).toEqual({
        name: 'V1: Alice',
      });

      // Hot-swap: Version 2 of adapter: adds prefix 'V2: '
      client.registerAdapter('/users', (data: any) => ({
        ...data,
        name: `V2: ${data.name}`,
      }));

      // Immediate dispatch uses V2 logic without recreating client
      expect(client.adaptResponse('/users', { name: 'Alice' })).toEqual({
        name: 'V2: Alice',
      });
    });

    it('overwrites existing adapter when registered with different casing', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      // Registered with lowercase
      client.registerAdapter('/catalog/items', () => 'original-transformer');

      expect(client.adaptResponse('/catalog/items', {})).toBe('original-transformer');

      // Overwrite with uppercase
      client.registerAdapter('/CATALOG/ITEMS', () => 'updated-transformer');

      expect(client.adaptResponse('/catalog/items', {})).toBe('updated-transformer');
      expect(client.adaptResponse('/CATALOG/ITEMS', {})).toBe('updated-transformer');
    });

    it('handles successive rapid adapter overwrites (v1 -> v2 -> v3)', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      client.registerAdapter('/counter', (data: any) => ({ count: data.count + 1 }));
      expect(client.adaptResponse('/counter', { count: 10 })).toEqual({ count: 11 });

      client.registerAdapter('/counter', (data: any) => ({ count: data.count + 10 }));
      expect(client.adaptResponse('/counter', { count: 10 })).toEqual({ count: 20 });

      client.registerAdapter('/counter', (data: any) => ({ count: data.count * 100 }));
      expect(client.adaptResponse('/counter', { count: 10 })).toEqual({ count: 1000 });
    });

    it('removes adapter cleanly and returns payload verbatim with exact reference equality', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      client.registerAdapter('/payments', (data: any) => ({
        ...data,
        intercepted: true,
      }));

      // Adapted while registered
      expect(client.adaptResponse('/payments', { amount: 100 })).toEqual({
        amount: 100,
        intercepted: true,
      });

      // Remove adapter
      client.removeAdapter('/payments');

      // Returns exact reference
      const originalPayload = { amount: 100 };
      const result = client.adaptResponse('/payments', originalPayload);
      expect(result).toBe(originalPayload);
      expect(result).toEqual({ amount: 100 });
    });

    it('gracefully handles removeAdapter on non-existent endpoints (idempotent no-op)', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      // Removing endpoint that was never registered should not throw
      expect(() => client.removeAdapter('/non/existent')).not.toThrow();

      // Double removal should also not throw
      client.registerAdapter('/endpoint', (d) => d);
      client.removeAdapter('/endpoint');
      expect(() => client.removeAdapter('/endpoint')).not.toThrow();
    });

    it('supports full lifecycle: register -> transform -> remove -> pass-through -> re-register -> transform', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });
      const raw = { value: 1 };

      // 1. Initial register
      client.registerAdapter('/lifecycle', (d: any) => ({ value: d.value + 10 }));
      expect(client.adaptResponse('/lifecycle', raw)).toEqual({ value: 11 });

      // 2. Remove
      client.removeAdapter('/lifecycle');
      expect(client.adaptResponse('/lifecycle', raw)).toBe(raw);

      // 3. Re-register with new logic
      client.registerAdapter('/lifecycle', (d: any) => ({ value: d.value + 100 }));
      expect(client.adaptResponse('/lifecycle', raw)).toEqual({ value: 101 });
    });

    it('maintains multiple distinct endpoints active concurrently without crosstalk', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      // Register 4 distinct endpoints
      client.registerAdapter('/users', (data: any) => ({
        ...data,
        service: 'users-transformed',
      }));

      client.registerAdapter('/payments', (data: any) => ({
        ...data,
        service: 'payments-transformed',
      }));

      client.registerAdapter('/search', (data: any) => ({
        ...data,
        service: 'search-transformed',
      }));

      client.registerAdapter('/notifications', (data: any) => ({
        ...data,
        service: 'notifications-transformed',
      }));

      // Execute queries across each endpoint
      const userRes = client.adaptResponse('/users', { id: 'u1' });
      const paymentRes = client.adaptResponse('/payments', { id: 'p1' });
      const searchRes = client.adaptResponse('/search', { query: 'test' });
      const notificationRes = client.adaptResponse('/notifications', { msg: 'hi' });
      const unadaptedRes = client.adaptResponse('/unregistered', { raw: true });

      // Verify no crosstalk
      expect(userRes).toEqual({ id: 'u1', service: 'users-transformed' });
      expect(paymentRes).toEqual({ id: 'p1', service: 'payments-transformed' });
      expect(searchRes).toEqual({ query: 'test', service: 'search-transformed' });
      expect(notificationRes).toEqual({ msg: 'hi', service: 'notifications-transformed' });
      expect(unadaptedRes).toEqual({ raw: true });

      // Remove only /payments and verify siblings remain unaffected
      client.removeAdapter('/payments');

      const paymentAfterRemove = { id: 'p2' };
      expect(client.adaptResponse('/payments', paymentAfterRemove)).toBe(paymentAfterRemove);
      expect(client.adaptResponse('/users', { id: 'u2' })).toEqual({
        id: 'u2',
        service: 'users-transformed',
      });
      expect(client.adaptResponse('/search', { query: 'intra' })).toEqual({
        query: 'intra',
        service: 'search-transformed',
      });
    });

    it('handles simulated concurrent asynchronous calls across multiple endpoints', async () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      client.registerAdapter('/users', (d: any) => ({ ...d, tag: 'user' }));
      client.registerAdapter('/payments', (d: any) => ({ ...d, tag: 'payment' }));
      client.registerAdapter('/search', (d: any) => ({ ...d, tag: 'search' }));

      // Run 50 parallel requests
      const promises = Array.from({ length: 50 }, async (_, index) => {
        const mod = index % 3;
        if (mod === 0) {
          const res = client.adaptResponse('/users', { index });
          expect(res).toEqual({ index, tag: 'user' });
        } else if (mod === 1) {
          const res = client.adaptResponse('/payments', { index });
          expect(res).toEqual({ index, tag: 'payment' });
        } else {
          const res = client.adaptResponse('/search', { index });
          expect(res).toEqual({ index, tag: 'search' });
        }
      });

      await Promise.all(promises);
    });
  });

  // ===========================================================================
  // 4. Data Types & Edge Cases
  // ===========================================================================
  describe('4. Data Types & Edge Cases', () => {
    describe('Primitive Types Handling', () => {
      it('handles primitive numbers without adapter and with adapter', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        const numbers = [0, -0, 42, -999.99, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Infinity, -Infinity];

        // Without adapter: returns exact values
        for (const num of numbers) {
          expect(client.adaptResponse('/raw-numbers', num)).toBe(num);
        }

        // NaN handling
        const nanRes = client.adaptResponse('/raw-numbers', NaN);
        expect(Number.isNaN(nanRes)).toBe(true);

        // With adapter
        client.registerAdapter('/transform-number', (n: any) => n * 2);
        expect(client.adaptResponse('/transform-number', 21)).toBe(42);
        expect(client.adaptResponse('/transform-number', -10)).toBe(-20);
      });

      it('handles primitive strings including empty, whitespace, multiline, unicode, and emoji', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        const strings = [
          '',
          '   ',
          'hello world',
          'Line 1\nLine 2\r\nLine 3\tTab',
          '日本語のテキスト (Japanese)',
          'Emoji 🚀⚡🔥🎉',
          '{"jsonKey": "jsonVal"}',
        ];

        for (const str of strings) {
          expect(client.adaptResponse('/raw-strings', str)).toBe(str);
        }

        client.registerAdapter('/transform-string', (s: any) => `[${s}]`);
        expect(client.adaptResponse('/transform-string', '')).toBe('[]');
        expect(client.adaptResponse('/transform-string', 'テスト')).toBe('[テスト]');
      });

      it('handles booleans and BigInt', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        expect(client.adaptResponse('/bool', true)).toBe(true);
        expect(client.adaptResponse('/bool', false)).toBe(false);

        const bigIntVal = BigInt(9007199254740995n);
        expect(client.adaptResponse('/bigint', bigIntVal)).toBe(bigIntVal);

        client.registerAdapter('/invert-bool', (b: any) => !b);
        expect(client.adaptResponse('/invert-bool', true)).toBe(false);
        expect(client.adaptResponse('/invert-bool', false)).toBe(true);
      });
    });

    describe('Null, Undefined & Boundary Values', () => {
      it('safely handles null and undefined payloads', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        // Unadapted null and undefined
        expect(client.adaptResponse('/endpoint', null)).toBeNull();
        expect(client.adaptResponse('/endpoint', undefined)).toBeUndefined();

        // Null-safe adapter
        client.registerAdapter('/null-safe', (data: any) => {
          if (data === null || data === undefined) {
            return { fallback: true };
          }
          return data;
        });

        expect(client.adaptResponse('/null-safe', null)).toEqual({ fallback: true });
        expect(client.adaptResponse('/null-safe', undefined)).toEqual({ fallback: true });
        expect(client.adaptResponse('/null-safe', { valid: true })).toEqual({ valid: true });
      });

      it('handles empty arrays, nested arrays, and arrays with mixed primitive/object types', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        const emptyArr: any[] = [];
        expect(client.adaptResponse('/array', emptyArr)).toBe(emptyArr);

        const mixedArray = [1, 'two', null, undefined, true, { key: 'val' }, [3, 4]];
        expect(client.adaptResponse('/array', mixedArray)).toBe(mixedArray);

        // Adapter filtering / transforming arrays
        client.registerAdapter('/array-adapter', (data: any) => {
          if (!Array.isArray(data)) return [];
          return data.filter((item) => item !== null && item !== undefined);
        });

        expect(client.adaptResponse('/array-adapter', [1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
        expect(client.adaptResponse('/array-adapter', [])).toEqual([]);
      });

      it('handles deeply nested objects without recursion limits or data truncation', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        const deepPayload = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: {
                      level7: {
                        level8: {
                          level9: {
                            level10: 'deep_value',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };

        // Pass-through
        expect(client.adaptResponse('/deep', deepPayload)).toBe(deepPayload);

        // Adapter reaching into deep structure
        client.registerAdapter('/deep', (data: any) => ({
          ...data,
          level1: {
            ...data.level1,
            extracted: data.level1.level2.level3.level4.level5.level6.level7.level8.level9.level10,
          },
        }));

        const adapted = client.adaptResponse('/deep', deepPayload);
        expect(adapted.level1.extracted).toBe('deep_value');
      });

      it('handles adversarial keys: empty string, dot notation, prototype properties', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        const adversarialPayload = {
          '': 'empty_key_value',
          'user.address.street': '123 Main St',
          '__proto__': 'safe_string',
          'constructor': 'safe_constructor',
        };

        const res = client.adaptResponse('/adversarial', adversarialPayload);
        expect(res).toBe(adversarialPayload);
        expect(res['']).toBe('empty_key_value');
        expect(res['user.address.street']).toBe('123 Main St');
      });

      it('handles massive payload array (10,000 items) efficiently without memory exhaustion', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        const largeArray = Array.from({ length: 10000 }, (_, i) => ({
          id: `id_${i}`,
          val: i,
        }));

        client.registerAdapter('/large-batch', (data: any) => {
          return data.map((item: any) => ({
            ...item,
            val: item.val * 2,
          }));
        });

        const start = performance.now();
        const result = client.adaptResponse('/large-batch', largeArray);
        const duration = performance.now() - start;

        expect(result.length).toBe(10000);
        expect(result[0]).toEqual({ id: 'id_0', val: 0 });
        expect(result[9999]).toEqual({ id: 'id_9999', val: 19998 });
        // Processing 10,000 items should complete well within 500ms
        expect(duration).toBeLessThan(500);
      });
    });

    describe('Adapter Exception Handling', () => {
      it('propagates exceptions thrown by faulty transformers to caller', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        client.registerAdapter('/faulty', () => {
          throw new Error('Adapter transformation syntax error');
        });

        expect(() => client.adaptResponse('/faulty', { any: 'data' })).toThrow(
          'Adapter transformation syntax error'
        );
      });
    });
  });

  // ===========================================================================
  // 5. Real-World Mutation Simulations (M1, M3, M5)
  // ===========================================================================
  describe('5. Real-World Mutation Simulations (M1, M3, M5)', () => {
    // -------------------------------------------------------------------------
    // M1: Field Rename (Users Service: name -> display_name)
    // -------------------------------------------------------------------------
    describe('M1: Field Rename (name -> display_name)', () => {
      it('adapts mutated users collection where name was renamed to display_name', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        // M1 Backward-compatibility adapter: maps display_name back to name
        client.registerAdapter('/users', (data: any) => {
          if (!Array.isArray(data)) {
            return {
              ...data,
              name: data.display_name ?? data.name,
            };
          }
          return data.map((item: any) => ({
            ...item,
            name: item.display_name ?? item.name,
          }));
        });

        // Upstream response has M1 applied (display_name present, name missing)
        const mutatedUsersResponse = [
          { id: 'usr_01', display_name: 'Alice Wonderland', email: 'alice@example.com', role: 'admin' },
          { id: 'usr_02', display_name: 'Bob Builder', email: 'bob@example.com', role: 'member' },
        ];

        const adapted = client.adaptResponse('/users', mutatedUsersResponse);

        // Verify downstream client can safely access user.name
        expect(adapted[0].name).toBe('Alice Wonderland');
        expect(adapted[0].display_name).toBe('Alice Wonderland');
        expect(adapted[0].email).toBe('alice@example.com');

        expect(adapted[1].name).toBe('Bob Builder');
        expect(adapted[1].display_name).toBe('Bob Builder');
      });

      it('M1 adapter handles legacy payloads where name is already populated', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        client.registerAdapter('/users', (data: any) => {
          return data.map((item: any) => ({
            ...item,
            name: item.display_name ?? item.name,
          }));
        });

        // Response without M1 (unmutated legacy shape)
        const legacyResponse = [
          { id: 'usr_03', name: 'Charlie Chaplin', email: 'charlie@example.com' },
        ];

        const adapted = client.adaptResponse('/users', legacyResponse);
        expect(adapted[0].name).toBe('Charlie Chaplin');
      });

      it('M1 adapter handles single user object endpoint /users/:id', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        client.registerAdapter('/users/me', (data: any) => ({
          ...data,
          name: data.display_name ?? data.name ?? 'Anonymous',
        }));

        const singleUserMutated = { id: 'usr_me', display_name: 'Dave Admin' };
        const adapted = client.adaptResponse('/users/me', singleUserMutated);

        expect(adapted.name).toBe('Dave Admin');
        expect(adapted.display_name).toBe('Dave Admin');

        // Edge case: empty display_name and missing name
        const anonUser = { id: 'usr_anon' };
        expect(client.adaptResponse('/users/me', anonUser).name).toBe('Anonymous');
      });
    });

    // -------------------------------------------------------------------------
    // M3: Unit Conversion (Payments Service: dollars float -> cents int)
    // -------------------------------------------------------------------------
    describe('M3: Amount Unit Shift (dollars <-> cents)', () => {
      it('adapts payments payload where amount shifted from dollars ($10.50) to integer cents (1050)', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        // M3 Adapter: normalizes integer cents to legacy float dollars (amount / 100)
        client.registerAdapter('/payments/charge', (data: any) => {
          if (!data || typeof data !== 'object') return data;
          return {
            ...data,
            amount: typeof data.amount === 'number' ? Math.round(data.amount) / 100 : data.amount,
            amount_cents: data.amount,
          };
        });

        // Upstream mutated response in cents
        const mutatedCharge = {
          chargeId: 'ch_9901',
          amount: 4999, // 4999 cents = $49.99
          currency: 'usd',
          status: 'succeeded',
        };

        const adapted = client.adaptResponse('/payments/charge', mutatedCharge);

        expect(adapted.amount).toBe(49.99);
        expect(adapted.amount_cents).toBe(4999);
        expect(adapted.currency).toBe('usd');
      });

      it('M3 adapter handles edge cases: zero, negative refunds, and subcent precision', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        client.registerAdapter('/payments/charge', (data: any) => ({
          ...data,
          amount: Math.round(data.amount) / 100,
        }));

        // Zero cents
        expect(client.adaptResponse('/payments/charge', { amount: 0 })).toEqual({ amount: 0 });

        // Negative amount (refund)
        expect(client.adaptResponse('/payments/charge', { amount: -1550 })).toEqual({ amount: -15.5 });

        // Single cent ($0.01)
        expect(client.adaptResponse('/payments/charge', { amount: 1 })).toEqual({ amount: 0.01 });

        // Large transaction: $1,250,000.50 -> 125000050 cents
        expect(client.adaptResponse('/payments/charge', { amount: 125000050 })).toEqual({
          amount: 1250000.5,
        });
      });

      it('M3 adapter handles nested breakdown structures (subtotal, tax, total in cents)', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        client.registerAdapter('/payments/invoice', (data: any) => ({
          ...data,
          summary: {
            subtotal: data.breakdown.subtotal / 100,
            tax: data.breakdown.tax / 100,
            total: data.breakdown.total / 100,
          },
        }));

        const invoiceMutated = {
          invoiceId: 'inv_400',
          breakdown: {
            subtotal: 10000, // $100.00
            tax: 850,        // $8.50
            total: 10850,    // $108.50
          },
        };

        const adapted = client.adaptResponse('/payments/invoice', invoiceMutated);
        expect(adapted.summary.subtotal).toBe(100.0);
        expect(adapted.summary.tax).toBe(8.5);
        expect(adapted.summary.total).toBe(108.5);
      });
    });

    // -------------------------------------------------------------------------
    // M5: Pagination Offset to Cursor (Search Service)
    // -------------------------------------------------------------------------
    describe('M5: Pagination Offset to Cursor (Search Service)', () => {
      it('adapts opaque cursor pagination back into backward-compatible offset/limit shape', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        // Helper to encode/decode synthetic cursor
        const createCursor = (offset: number) =>
          Buffer.from(JSON.stringify({ offset })).toString('base64');

        // M5 Adapter: extracts legacy offset from cursor or synthesizes offset/limit
        client.registerAdapter('/search', (data: any) => {
          let calculatedOffset = 0;
          if (data.nextCursor) {
            try {
              const decoded = JSON.parse(Buffer.from(data.nextCursor, 'base64').toString('utf8'));
              // nextCursor points to next page, so previous offset was nextOffset - limit
              calculatedOffset = decoded.offset - (data.items?.length ?? 10);
            } catch {
              calculatedOffset = 0;
            }
          }

          return {
            ...data,
            // Legacy pagination compatibility fields
            offset: Math.max(0, calculatedOffset),
            limit: data.items?.length ?? 0,
            has_more: data.hasMore ?? false,
          };
        });

        // Upstream response using M5 cursor-based pagination
        const nextCursorVal = createCursor(20);
        const mutatedSearchResponse = {
          items: [
            { id: 'item_11', title: 'Keyboard' },
            { id: 'item_12', title: 'Mouse' },
          ],
          nextCursor: nextCursorVal,
          hasMore: true,
        };

        const adapted = client.adaptResponse('/search', mutatedSearchResponse);

        expect(adapted.items.length).toBe(2);
        expect(adapted.offset).toBe(18); // 20 - 2
        expect(adapted.limit).toBe(2);
        expect(adapted.has_more).toBe(true);
        expect(adapted.nextCursor).toBe(nextCursorVal);
      });

      it('M5 adapter handles terminal page (no nextCursor, hasMore: false)', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        client.registerAdapter('/search', (data: any) => ({
          ...data,
          offset: 50,
          limit: data.items?.length ?? 0,
          has_more: data.hasMore ?? false,
        }));

        const finalPageMutated = {
          items: [{ id: 'item_51', title: 'Monitor' }],
          nextCursor: null,
          hasMore: false,
        };

        const adapted = client.adaptResponse('/search', finalPageMutated);
        expect(adapted.has_more).toBe(false);
        expect(adapted.nextCursor).toBeNull();
        expect(adapted.items.length).toBe(1);
      });

      it('M5 adapter gracefully handles malformed cursor string without throwing', () => {
        const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

        client.registerAdapter('/search', (data: any) => {
          let offset = 0;
          if (data.cursor) {
            try {
              const decoded = JSON.parse(Buffer.from(data.cursor, 'base64').toString('utf8'));
              offset = decoded.offset ?? 0;
            } catch {
              // Corrupt or non-base64 cursor fallback
              offset = -1;
            }
          }
          return {
            ...data,
            offset,
          };
        });

        const malformedResponse = {
          items: [],
          cursor: 'NOT_A_VALID_BASE64_OR_JSON',
          hasMore: false,
        };

        const adapted = client.adaptResponse('/search', malformedResponse);
        expect(adapted.offset).toBe(-1);
        expect(adapted.items).toEqual([]);
      });
    });
  });

  // ===========================================================================
  // 6. High-Throughput & Invert-Logic Mutation Sanity
  // ===========================================================================
  describe('6. High-Throughput & Invert-Logic Mutation Sanity', () => {
    it('invert-logic sanity: unregistered endpoints NEVER accidentally mutate data', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      // Register adapter only for /users
      client.registerAdapter('/users', (data: any) => ({ ...data, transformed: true }));

      const paymentData = Object.freeze({ chargeId: 'ch_immutable', amount: 100 });
      const searchData = Object.freeze({ query: 'intra-differ', count: 5 });

      // Calling unregistered endpoints must return the exact frozen objects unmodified
      expect(client.adaptResponse('/payments', paymentData)).toBe(paymentData);
      expect(client.adaptResponse('/search', searchData)).toBe(searchData);
    });

    it('high-throughput rapid dispatch: 1,000 operations across 4 endpoints maintain deterministic integrity', () => {
      const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

      client.registerAdapter('/service-a', (d: any) => ({ ...d, tag: 'A' }));
      client.registerAdapter('/service-b', (d: any) => ({ ...d, tag: 'B' }));
      client.registerAdapter('/service-c', (d: any) => ({ ...d, tag: 'C' }));

      for (let i = 0; i < 1000; i++) {
        const mod = i % 4;
        if (mod === 0) {
          const res = client.adaptResponse('/service-a', { id: i });
          expect(res.tag).toBe('A');
          expect(res.id).toBe(i);
        } else if (mod === 1) {
          const res = client.adaptResponse('/SERVICE-B', { id: i });
          expect(res.tag).toBe('B');
          expect(res.id).toBe(i);
        } else if (mod === 2) {
          const res = client.adaptResponse('/Service-C', { id: i });
          expect(res.tag).toBe('C');
          expect(res.id).toBe(i);
        } else {
          // Unregistered endpoint /service-d
          const raw = { id: i, unadapted: true };
          const res = client.adaptResponse('/service-d', raw);
          expect(res).toBe(raw);
        }
      }
    });
  });
});
