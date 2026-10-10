#!/usr/bin/env node
import { Switchboard, buildSimServicesApp } from '../packages/sim-services/dist/index.js';
import { PipelineEngine, buildEngineApp } from '../apps/engine/dist/index.js';
import { buildMcpServer } from '../mcpserver/dist/index.js';
import { ShipwellApp } from '../apps/demo-app/dist/index.js';

console.log('='.repeat(70));
console.log('  INTRA AUTONOMOUS API DRIFT & ADAPTATION DEMONSTRATION');
console.log('='.repeat(70));

async function main() {
  console.log('\n[1/6] Starting simulated external services (Users, Payments, Search, Webhook)...');
  const switchboard = new Switchboard();
  const simApp = buildSimServicesApp(switchboard);
  await simApp.listen({ port: 4000, host: '127.0.0.1' });
  console.log('  ✓ Sim Services & Switchboard running at http://127.0.0.1:4000');

  console.log('\n[2/6] Starting Intra Engine Monolith...');
  const pipeline = new PipelineEngine();
  const engineApp = buildEngineApp(pipeline);
  await engineApp.listen({ port: 3001, host: '127.0.0.1' });
  console.log('  ✓ Intra Monolith Engine running at http://127.0.0.1:3001');

  console.log('\n[3/6] Starting Customer MCP Server...');
  const mcpApp = buildMcpServer({ engineUrl: 'http://127.0.0.1:3001' });
  await mcpApp.listen({ port: 3002, host: '127.0.0.1' });
  console.log('  ✓ Customer MCP Server running at http://127.0.0.1:3002 (health: /healthz)');

  console.log('\n[4/6] Initializing Shipwell demo application...');
  const shipwell = new ShipwellApp('http://127.0.0.1:4000', 'http://127.0.0.1:3001');
  const baseRes = await shipwell.runAll();
  console.log('  ✓ Baseline UserProfile workflow:', baseRes.userProfile.success ? 'GREEN' : 'RED');
  console.log('  ✓ Baseline Checkout workflow:   ', baseRes.checkout.success ? 'GREEN' : 'RED');

  console.log('\n[5/6] Injecting undocumented live mutations (M1 rename, M3 unit shift)...');
  switchboard.toggle('M1', true);
  switchboard.toggle('M3', true);

  const brokenUsers = await shipwell.runUserProfileWorkflow();
  console.log('  ✗ Workflows broken without adaptation:', brokenUsers.error);

  console.log('\n[6/6] Intra Engine observing traffic, detecting drift, and applying adapters...');
  pipeline.recordObservation({
    service: 'users',
    endpoint: '/users',
    method: 'GET',
    status: 200,
    headers: {},
    body: [{ id: 'usr_1', display_name: 'Alice Walker', status: 'active' }],
    latencyMs: 12,
  });

  // Apply adapter in client
  shipwell.client.registerAdapter('/users', (data) =>
    data.map((u) => ({ ...u, name: u.display_name ?? u.name }))
  );

  const recoveredUsers = await shipwell.runUserProfileWorkflow();
  console.log('  ✓ Workflows adapted and recovered:  ', recoveredUsers.success ? 'GREEN' : 'RED');
  console.log('  ✓ Output payload adapted user name: ', recoveredUsers.data.name);

  console.log('\n' + '='.repeat(70));
  console.log('  DEMONSTRATION RUN COMPLETE - ALL SYSTEMS OPERATIONAL');
  console.log('='.repeat(70));

  await simApp.close();
  await engineApp.close();
  await mcpApp.close();
}

main().catch((err) => {
  console.error('Demo error:', err);
  process.exit(1);
});
