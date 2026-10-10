import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShipwellApp } from './shipwell.js';
import { Switchboard, buildSimServicesApp } from '@intra/sim-services';
import { FastifyInstance } from 'fastify';

describe('Shipwell Demo Application & Workflow Resilience', () => {
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

  it('runs all baseline workflows successfully (all green)', async () => {
    const results = await shipwell.runAll();
    expect(results.userProfile.success).toBe(true);
    expect(results.checkout.success).toBe(true);
    expect(results.searchBrowse.success).toBe(true);
  });

  it('fails userProfile when M1 is toggled, and recovers green when adapter is applied', async () => {
    // 1. Toggle M1 rename: name -> display_name
    switchboard.toggle('M1', true);

    // Without adapter: workflow breaks (red)
    const broken = await shipwell.runUserProfileWorkflow();
    expect(broken.success).toBe(false);
    expect(broken.error).toContain("field 'name' was missing");

    // 2. Intra applies adapter: map display_name back to name
    shipwell.client.registerAdapter('/users', (data: any) => {
      return data.map((item: any) => ({
        ...item,
        name: item.display_name ?? item.name,
      }));
    });

    // With adapter: workflow is restored to green!
    const recovered = await shipwell.runUserProfileWorkflow();
    expect(recovered.success).toBe(true);
    expect((recovered.data as any).name).toBe('Alice Walker');
  });

  it('fails checkout when M3 is toggled (cents vs dollars), and recovers green with adapter', async () => {
    // 1. Toggle M3 unit shift: dollars -> cents
    switchboard.toggle('M3', true);

    // Without adapter: charge is 2500, which exceeds threshold
    const broken = await shipwell.runCheckoutWorkflow(25.0);
    expect(broken.success).toBe(false);
    expect(broken.error).toContain('expected amount in dollars, but received 2500');

    // 2. Intra applies adapter: transform cents back to dollars
    shipwell.client.registerAdapter('/payments/charge', (data: any) => {
      return {
        ...data,
        amount: data.amount * 0.01,
      };
    });

    // With adapter: workflow is restored to green!
    const recovered = await shipwell.runCheckoutWorkflow(25.0);
    expect(recovered.success).toBe(true);
    expect((recovered.data as any).amount).toBe(25.0);
  });
});
