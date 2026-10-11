function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
    res.statusCode = 200;
    return res.end();
  }

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'active',
      service: 'Intra Observation Ingestion Endpoint',
      method: 'POST',
      acceptedTypes: ['application/json'],
      timestamp: new Date().toISOString(),
    });
  }

  const body = getBody(req);
  const observationId = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return sendJson(res, 201, {
    id: observationId,
    service: body.service || 'users',
    endpoint: body.endpoint || '/users',
    status: body.status || 200,
    recordedAt: new Date().toISOString(),
    ingested: true,
  });
}

module.exports = handler;
module.exports.default = handler;
