#!/usr/bin/env node
process.env.NODE_ENV = 'test'; // Prevents auto-listen on import

const { Switchboard, buildSimServicesApp } = await import('../packages/sim-services/dist/index.js');
const { PipelineEngine, buildEngineApp } = await import('../apps/engine/dist/index.js');
const { buildMcpServer } = await import('../mcpserver/dist/index.js');

async function bootstrap() {
  console.log('='.repeat(70));
  console.log('  STARTING INTRA APPLICATION ECOSYSTEM SERVICES');
  console.log('='.repeat(70));

  // 1. Simulated External Services (port 4000)
  const switchboard = new Switchboard();
  const simApp = buildSimServicesApp(switchboard);
  await simApp.listen({ port: 4000, host: '0.0.0.0' });
  console.log('  [1/3] Sim Services & Switchboard: http://localhost:4000');

  // 2. Intra Engine Monolith (port 3001)
  const pipeline = new PipelineEngine();

  // Populate baseline traffic observations
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

  // Run pipeline to establish baselines
  pipeline.runPipeline();

  const engineApp = buildEngineApp(pipeline);
  await engineApp.listen({ port: 3001, host: '0.0.0.0' });
  console.log('  [2/3] Intra Monolith Engine:      http://localhost:3001');

  // 3. MCP Server (port 3002)
  const mcpApp = buildMcpServer({ engineUrl: 'http://localhost:3001' });
  await mcpApp.listen({ port: 3002, host: '0.0.0.0' });
  console.log('  [3/3] Customer MCP Server:       http://localhost:3002');

  console.log('\n  All Intra backend application services are live and ready.');
  console.log('='.repeat(70));
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap Intra ecosystem:', err);
  process.exit(1);
});
