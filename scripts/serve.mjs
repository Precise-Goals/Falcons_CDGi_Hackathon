#!/usr/bin/env bun
import { Switchboard, buildSimServicesApp } from '../packages/sim-services/dist/index.js';
import { PipelineEngine, buildEngineApp } from '../apps/engine/dist/index.js';
import { buildMcpServer } from '../mcpserver/dist/index.js';

console.log('='.repeat(70));
console.log('  STARTING INTRA APPLICATION ECOSYSTEM SERVICES (BUN RUNNER)');
console.log('='.repeat(70));

// 1. Simulated External Services (port 4000)
const switchboard = new Switchboard();
const simApp = buildSimServicesApp(switchboard);
await simApp.listen({ port: 4000, host: '0.0.0.0' });
console.log('  [1/3] Sim Services & Switchboard: http://localhost:4000');

// 2. Intra Engine Monolith (port 3001)
const pipeline = new PipelineEngine();

pipeline.recordObservation({
  service: 'users',
  endpoint: '/users',
  method: 'GET',
  status: 200,
  headers: {},
  body: [
    { id: 'usr_1', name: 'Alice Walker', status: 'active' },
    { id: 'usr_2', name: 'Bob Stone', status: 'active' },
    { id: 'usr_3', name: 'Charlie Brown', status: 'suspended' },
  ],
  latencyMs: 14,
});

pipeline.recordObservation({
  service: 'payments',
  endpoint: '/payments/charge',
  method: 'POST',
  status: 200,
  headers: {},
  body: { id: 'chg_init', amount: 25.0, currency: 'USD', status: 'succeeded' },
  latencyMs: 38,
});

pipeline.recordObservation({
  service: 'search',
  endpoint: '/search',
  method: 'GET',
  status: 200,
  headers: {},
  body: { items: [{ id: 'item_1', title: 'Product 1' }], total: 100, limit: 10, offset: 0 },
  latencyMs: 22,
});

pipeline.runPipeline();

const engineApp = buildEngineApp(pipeline);
await engineApp.listen({ port: 3001, host: '0.0.0.0' });
console.log('  [2/3] Intra Monolith Engine:      http://localhost:3001');

// 3. Customer MCP Server (port 3002)
const mcpApp = buildMcpServer({ engineUrl: 'http://localhost:3001' });
await mcpApp.listen({ port: 3002, host: '0.0.0.0' });
console.log('  [3/3] Customer MCP Server:       http://localhost:3002');

console.log('\n  All Intra backend application services are live and ready.');
console.log('='.repeat(70));
