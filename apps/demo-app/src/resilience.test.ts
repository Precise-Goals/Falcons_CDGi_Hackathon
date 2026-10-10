import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShipwellApp } from './shipwell.js';
import { Switchboard, buildSimServicesApp } from '@intra/sim-services';
import { FastifyInstance } from 'fastify';

describe('Demo App Resilience, Network Failure & Adaptation Recovery', () => {
  let switchboard: Switchboard;
  let simApp: FastifyInstance;
  let shipwell: ShipwellApp;
  let simUrl: string;

  beforeEach(async () => {
    switchboard = new Switchboard();
    simApp = buildSimServicesApp(switchboard);
    await simApp.listen({ port: 0, host: '127.0.0.1' });
    const port = (simApp.server.address() as any).port;
    simUrl = `http://127.0.0.1:${port}`;
    shipwell = new ShipwellApp(simUrl);
  });

  afterEach(async () => {
    await simApp.close();
  });

  // =========================================================================
  // 1. WORKFLOW ADAPTATION & RECOVERY
  // =========================================================================
  describe('1. Workflow Adaptation & Recovery', () => {
    it('M5 (Pagination): searchBrowse workflow fails when M5 is active and recovers upon rollback or parameter adaptation', async () => {
      // Baseline: offset pagination succeeds
      const baseline = await shipwell.runSearchWorkflow();
      expect(baseline.success).toBe(true);
      expect((baseline.data as any).items).toBeDefined();
      expect((baseline.data as any).offset).toBe(0);

      // 1. Toggle M5: offset -> cursor required
      switchboard.toggle('M5', true);

      // Workflow fails (red state) with deprecation error
      const broken = await shipwell.runSearchWorkflow();
      expect(broken.success).toBe(false);
      expect(broken.error).toContain('offset pagination deprecated; cursor required');

      // 2. Recovery via rollback: toggling M5 off restores standard offset pagination (green state)
      switchboard.toggle('M5', false);
      const recoveredRollback = await shipwell.runSearchWorkflow();
      expect(recoveredRollback.success).toBe(true);
      expect((recoveredRollback.data as any).items).toHaveLength(10);
      expect((recoveredRollback.data as any).offset).toBe(0);

      // 3. Re-enable M5 and test adaptation recovery behavior:
      // When request parameters are adapted (synthesizing cursor from offset), search endpoint recovers green
      switchboard.toggle('M5', true);
      const adaptRequestPagination = (params: { offset?: number; limit?: number }) => {
        if (params.offset !== undefined) {
          const cursor = Buffer.from(String(params.offset)).toString('base64');
          return { cursor, limit: params.limit ?? 20 };
        }
        return params;
      };

      const adaptedParams = adaptRequestPagination({ offset: 0, limit: 10 });
      const adaptedResponse = await fetch(
        `${simUrl}/search?cursor=${adaptedParams.cursor}&limit=${adaptedParams.limit}`
      );
      expect(adaptedResponse.ok).toBe(true);
      const adaptedData = (await adaptedResponse.json()) as any;
      expect(adaptedData.items).toBeDefined();
      expect(adaptedData.items.length).toBeGreaterThan(0);
      expect(adaptedData.nextCursor).toBeDefined();
    });

    it('M2 (Format Shift): userProfile workflow receives "Last, First" and adapter normalizes back to "First Last"', async () => {
      // Baseline: First Last
      const baseline = await shipwell.runUserProfileWorkflow();
      expect(baseline.success).toBe(true);
      expect((baseline.data as any).name).toBe('Alice Walker');

      // 1. Toggle M2: "Last, First" format
      switchboard.toggle('M2', true);

      // Without adapter: format is shifted
      const shifted = await shipwell.runUserProfileWorkflow();
      expect(shifted.success).toBe(true);
      expect((shifted.data as any).name).toBe('Walker, Alice');

      // 2. Intra applies adapter to normalize "Last, First" back to "First Last"
      shipwell.client.registerAdapter('/users', (data: any) => {
        const normalize = (user: any) => {
          if (typeof user?.name === 'string' && user.name.includes(',')) {
            const [last, first] = user.name.split(',').map((s: string) => s.trim());
            return {
              ...user,
              name: `${first} ${last}`,
              normalizedFrom: user.name,
            };
          }
          return user;
        };
        return Array.isArray(data) ? data.map(normalize) : normalize(data);
      });

      // With adapter: format restored to "First Last"
      const recovered = await shipwell.runUserProfileWorkflow();
      expect(recovered.success).toBe(true);
      expect((recovered.data as any).name).toBe('Alice Walker');
      expect((recovered.data as any).normalizedFrom).toBe('Walker, Alice');
    });

    it('M4 (Currency Flip): checkout workflow verifies currency handling when M4 defaults to EUR', async () => {
      // Baseline: default currency is USD
      const baseline = await shipwell.runCheckoutWorkflow(25.0);
      expect(baseline.success).toBe(true);
      expect((baseline.data as any).currency).toBe('USD');
      expect((baseline.data as any).amount).toBe(25.0);

      // 1. Toggle M4: default currency flips to EUR when omitted
      switchboard.toggle('M4', true);

      // Without adapter: receives EUR
      const eurCharge = await shipwell.runCheckoutWorkflow(25.0);
      expect(eurCharge.success).toBe(true);
      expect((eurCharge.data as any).currency).toBe('EUR');

      // 2. Intra adapter normalizes currency and applies exchange rate conversion
      const EUR_TO_USD = 1.08;
      shipwell.client.registerAdapter('/payments/charge', (data: any) => {
        if (data && typeof data === 'object' && data.currency === 'EUR') {
          return {
            ...data,
            currency: 'USD',
            amount: +(data.amount * EUR_TO_USD).toFixed(2),
            originalCurrency: 'EUR',
          };
        }
        return data;
      });

      // With adapter: returns USD normalized charge
      const adapted = await shipwell.runCheckoutWorkflow(25.0);
      expect(adapted.success).toBe(true);
      expect((adapted.data as any).currency).toBe('USD');
      expect((adapted.data as any).amount).toBe(27.0);
      expect((adapted.data as any).originalCurrency).toBe('EUR');
    });
  });

  // =========================================================================
  // 2. ERROR HANDLING & PARTIAL FAILURES
  // =========================================================================
  describe('2. Error Handling & Partial Failures', () => {
    it('handles offline / unreachable backend gracefully without crashing or throwing unhandled exceptions', async () => {
      // Use port 59999 where no service is listening
      const unreachableUrl = 'http://127.0.0.1:59999';
      const offlineApp = new ShipwellApp(unreachableUrl);

      // 1. userProfile workflow returns success: false
      const userRes = await offlineApp.runUserProfileWorkflow();
      expect(userRes.success).toBe(false);
      expect(userRes.name).toBe('userProfile');
      expect(userRes.error).toBeDefined();
      expect(userRes.error).toMatch(/fetch failed|ECONNREFUSED/i);

      // 2. checkout workflow returns success: false
      const checkoutRes = await offlineApp.runCheckoutWorkflow(25.0);
      expect(checkoutRes.success).toBe(false);
      expect(checkoutRes.name).toBe('checkout');
      expect(checkoutRes.error).toBeDefined();
      expect(checkoutRes.error).toMatch(/fetch failed|ECONNREFUSED/i);

      // 3. searchBrowse workflow returns success: false
      const searchRes = await offlineApp.runSearchWorkflow();
      expect(searchRes.success).toBe(false);
      expect(searchRes.name).toBe('searchBrowse');
      expect(searchRes.error).toBeDefined();
      expect(searchRes.error).toMatch(/fetch failed|ECONNREFUSED/i);

      // 4. runAll batch execution completes cleanly with all workflows marked false
      const allRes = await offlineApp.runAll();
      expect(allRes.userProfile.success).toBe(false);
      expect(allRes.checkout.success).toBe(false);
      expect(allRes.searchBrowse.success).toBe(false);
    });

    it('handles sim server shutdown mid-execution without unhandled rejection', async () => {
      // Start with working app
      const initial = await shipwell.runUserProfileWorkflow();
      expect(initial.success).toBe(true);

      // Shut down sim server
      await simApp.close();

      // Subsequent workflow fails gracefully
      const deadRes = await shipwell.runUserProfileWorkflow();
      expect(deadRes.success).toBe(false);
      expect(deadRes.error).toMatch(/fetch failed|ECONNREFUSED/i);
    });

    it('runAll() batch execution isolates partial failures (mixed results)', async () => {
      // 1. M1 active: userProfile red, checkout & searchBrowse remain green
      switchboard.toggle('M1', true);
      let results = await shipwell.runAll();
      expect(results.userProfile.success).toBe(false);
      expect(results.userProfile.error).toContain("field 'name' was missing");
      expect(results.checkout.success).toBe(true);
      expect(results.searchBrowse.success).toBe(true);

      // 2. M1 + M5 active: userProfile & searchBrowse red, checkout remains green
      switchboard.toggle('M5', true);
      results = await shipwell.runAll();
      expect(results.userProfile.success).toBe(false);
      expect(results.checkout.success).toBe(true);
      expect(results.searchBrowse.success).toBe(false);

      // 3. Adapt M1: userProfile recovers to green, checkout stays green, searchBrowse stays red
      shipwell.client.registerAdapter('/users', (data: any) =>
        data.map((u: any) => ({ ...u, name: u.display_name ?? u.name }))
      );
      results = await shipwell.runAll();
      expect(results.userProfile.success).toBe(true);
      expect(results.checkout.success).toBe(true);
      expect(results.searchBrowse.success).toBe(false);

      // 4. Reset M5: all green
      switchboard.toggle('M5', false);
      results = await shipwell.runAll();
      expect(results.userProfile.success).toBe(true);
      expect(results.checkout.success).toBe(true);
      expect(results.searchBrowse.success).toBe(true);
    });

    it('runAll() isolates checkout failure (M3 active) while userProfile and searchBrowse remain green', async () => {
      switchboard.toggle('M3', true); // amounts in cents -> > 100 dollars threshold check fails
      const results = await shipwell.runAll();

      expect(results.checkout.success).toBe(false);
      expect(results.checkout.error).toContain('expected amount in dollars, but received 2500');
      expect(results.userProfile.success).toBe(true);
      expect(results.searchBrowse.success).toBe(true);
    });
  });

  // =========================================================================
  // 3. CLIENT ADAPTER DYNAMIC SWAPPING
  // =========================================================================
  describe('3. Client Adapter Dynamic Swapping', () => {
    it('dynamic deregistration via client.removeAdapter() returns workflow to red state', async () => {
      // Toggle M1: name -> display_name
      switchboard.toggle('M1', true);

      // Fails initially
      expect((await shipwell.runUserProfileWorkflow()).success).toBe(false);

      // Register adapter: recovers to green
      shipwell.client.registerAdapter('/users', (data: any) =>
        data.map((u: any) => ({ ...u, name: u.display_name ?? u.name }))
      );
      const green = await shipwell.runUserProfileWorkflow();
      expect(green.success).toBe(true);
      expect((green.data as any).name).toBe('Alice Walker');

      // Deregister adapter: immediately returns to red state
      shipwell.client.removeAdapter('/users');
      const red = await shipwell.runUserProfileWorkflow();
      expect(red.success).toBe(false);
      expect(red.error).toContain("field 'name' was missing or null");
    });

    it('dynamic registration of updated adapter immediately recovers to green with updated behavior', async () => {
      // Toggle M1
      switchboard.toggle('M1', true);

      // Register v1 adapter
      shipwell.client.registerAdapter('/users', (data: any) =>
        data.map((u: any) => ({ ...u, name: u.display_name ?? u.name, version: 1 }))
      );
      const resV1 = await shipwell.runUserProfileWorkflow();
      expect(resV1.success).toBe(true);
      expect((resV1.data as any).version).toBe(1);

      // Remove adapter: drops back to red
      shipwell.client.removeAdapter('/users');
      expect((await shipwell.runUserProfileWorkflow()).success).toBe(false);

      // Register updated v2 adapter: recovers green with uppercase name and version 2
      shipwell.client.registerAdapter('/users', (data: any) =>
        data.map((u: any) => ({
          ...u,
          name: (u.display_name ?? u.name).toUpperCase(),
          version: 2,
        }))
      );
      const resV2 = await shipwell.runUserProfileWorkflow();
      expect(resV2.success).toBe(true);
      expect((resV2.data as any).name).toBe('ALICE WALKER');
      expect((resV2.data as any).version).toBe(2);
    });

    it('hot-swaps payment adapter dynamically for M3 unit shift without intermediate removal', async () => {
      switchboard.toggle('M3', true); // amount in cents

      // Without adapter: red
      expect((await shipwell.runCheckoutWorkflow(25.0)).success).toBe(false);

      // Apply v1 adapter: raw cents to dollars
      shipwell.client.registerAdapter('/payments/charge', (data: any) => ({
        ...data,
        amount: data.amount * 0.01,
        tier: 'standard',
      }));
      const chargeV1 = await shipwell.runCheckoutWorkflow(25.0);
      expect(chargeV1.success).toBe(true);
      expect((chargeV1.data as any).amount).toBe(25.0);
      expect((chargeV1.data as any).tier).toBe('standard');

      // Hot-swap to v2 adapter: converts and adds discount
      shipwell.client.registerAdapter('/payments/charge', (data: any) => ({
        ...data,
        amount: +(data.amount * 0.01 * 0.9).toFixed(2), // 10% discount
        tier: 'vip',
      }));
      const chargeV2 = await shipwell.runCheckoutWorkflow(25.0);
      expect(chargeV2.success).toBe(true);
      expect((chargeV2.data as any).amount).toBe(22.5);
      expect((chargeV2.data as any).tier).toBe('vip');

      // Remove adapter: returns to red
      shipwell.client.removeAdapter('/payments/charge');
      const red = await shipwell.runCheckoutWorkflow(25.0);
      expect(red.success).toBe(false);
      expect(red.error).toContain('expected amount in dollars, but received 2500');
    });

    it('handles endpoint case-insensitivity in registerAdapter and removeAdapter', async () => {
      switchboard.toggle('M1', true);

      // Register with uppercase path
      shipwell.client.registerAdapter('/USERS', (data: any) =>
        data.map((u: any) => ({ ...u, name: u.display_name ?? u.name }))
      );

      // Query runs on '/users' and matches
      const green = await shipwell.runUserProfileWorkflow();
      expect(green.success).toBe(true);

      // Remove with mixed-case path
      shipwell.client.removeAdapter('/Users');
      const red = await shipwell.runUserProfileWorkflow();
      expect(red.success).toBe(false);
    });
  });

  // =========================================================================
  // 4. BOUNDARY VALUES, CONCURRENCY & FALSE-POSITIVE RESISTANCE
  // =========================================================================
  describe('4. Boundary Values, Concurrency & False-Positive Resistance', () => {
    it('false-positive resistance: benign response enrichment does not break workflows', async () => {
      // Adapter adds non-required extra fields (e.g. metadata, telemetry tags)
      shipwell.client.registerAdapter('/users', (data: any) =>
        data.map((u: any) => ({
          ...u,
          metadata: { env: 'production', region: 'us-east-1' },
          auditId: 'audit_99182',
          serverTime: Date.now(),
        }))
      );

      const res = await shipwell.runUserProfileWorkflow();
      expect(res.success).toBe(true);
      expect((res.data as any).name).toBe('Alice Walker');
      expect((res.data as any).metadata.env).toBe('production');
      expect((res.data as any).auditId).toBe('audit_99182');
    });

    it('handles concurrent workflow executions (burst load) without cross-contamination', async () => {
      switchboard.toggle('M1', true);
      shipwell.client.registerAdapter('/users', (data: any) =>
        data.map((u: any) => ({ ...u, name: u.display_name ?? u.name }))
      );

      // Fire 15 concurrent runAll() calls
      const burst = await Promise.all(
        Array.from({ length: 15 }, () => shipwell.runAll())
      );

      for (const res of burst) {
        expect(res.userProfile.success).toBe(true);
        expect(res.checkout.success).toBe(true);
        expect(res.searchBrowse.success).toBe(true);
      }
    });

    it('handles M8 rate-limiting gracefully returning HTTP 429 error rather than unhandled crash', async () => {
      switchboard.toggle('M8', true); // Throttles after 5 requests/sec

      // Send burst of 10 payment charges
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(await shipwell.runCheckoutWorkflow(10.0));
      }

      // First 5 succeed
      const succeeded = results.filter((r) => r.success);
      expect(succeeded.length).toBeGreaterThanOrEqual(4);

      // Throttled requests fail gracefully with HTTP 429
      const throttled = results.filter((r) => !r.success);
      expect(throttled.length).toBeGreaterThan(0);
      for (const t of throttled) {
        expect(t.error).toContain('HTTP 429');
      }
    });

    it('handles boundary amounts: zero, fractional amounts, and precision in checkout', async () => {
      // Zero dollar charge
      const zeroRes = await shipwell.runCheckoutWorkflow(0.0);
      expect(zeroRes.success).toBe(true);
      expect((zeroRes.data as any).amount).toBe(0.0);

      // Fractional dollar charge ($0.99)
      const centRes = await shipwell.runCheckoutWorkflow(0.99);
      expect(centRes.success).toBe(true);
      expect((centRes.data as any).amount).toBe(0.99);

      // 99.99 dollars (just under threshold of 100)
      const nearLimitRes = await shipwell.runCheckoutWorkflow(99.99);
      expect(nearLimitRes.success).toBe(true);
      expect((nearLimitRes.data as any).amount).toBe(99.99);
    });

    it('handles adapter returning malformed data by failing safely', async () => {
      // Adapter corrupts user object by returning null
      shipwell.client.registerAdapter('/users', () => null);

      const corrupted = await shipwell.runUserProfileWorkflow();
      expect(corrupted.success).toBe(false);
      expect(corrupted.error).toContain("field 'name' was missing or null");

      // Adapter returns empty array
      shipwell.client.registerAdapter('/users', () => []);
      const emptyRes = await shipwell.runUserProfileWorkflow();
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toContain("field 'name' was missing or null");
    });
  });
});
