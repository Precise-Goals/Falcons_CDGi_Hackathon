function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-subscription-key');
    res.statusCode = 200;
    return res.end();
  }

  return sendJson(res, 200, {
    status: 'ok',
    version: '0.1.0',
    uptime: Math.floor(process.uptime() || 3600),
    rateLimitHeadroom: 98,
    observedServices: 5,
    activeAdapters: 2,
    timestamp: new Date().toISOString(),
  });
}

module.exports = handler;
module.exports.default = handler;
