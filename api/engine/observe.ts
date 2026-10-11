export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }

  const observationId = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  res.status(201).json({
    id: observationId,
    service: body?.service || 'users',
    endpoint: body?.endpoint || '/users',
    status: body?.status || 200,
    recordedAt: new Date().toISOString(),
    ingested: true,
  });
}
