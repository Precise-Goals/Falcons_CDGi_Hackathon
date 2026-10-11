export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    status: 'ok',
    version: '0.1.0',
    uptime: Math.floor(process.uptime() || 3600),
    rateLimitHeadroom: 98,
    observedServices: 5,
    activeAdapters: 2,
    timestamp: new Date().toISOString(),
  });
}
