const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'api-key',
  'proxy-authorization',
]);

const SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'credit_card',
  'cvv',
  'ssn',
]);

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function redactPayload(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactPayload(item));
  }

  const obj = data as Record<string, unknown>;
  const copy: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      copy[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      copy[key] = redactPayload(val);
    } else {
      copy[key] = val;
    }
  }
  return copy;
}
