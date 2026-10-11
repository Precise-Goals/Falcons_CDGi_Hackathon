/**
 * Schema Reshape Adapter for Flat <-> Nested Envelope Restructuring
 */

/**
 * Retrieves a deeply nested property from an object using dot notation.
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return undefined;
  }

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Sets a deeply nested property on a target object using dot notation, creating intermediate objects if needed.
 */
export function setNestedValue(
  target: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = target;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

/**
 * Reshapes a source object into a target schema according to path mappings.
 * Mappings: { [targetPath]: [sourcePath] }
 */
export function reshapeObject(
  source: Record<string, unknown>,
  mappings: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [targetPath, sourcePath] of Object.entries(mappings)) {
    const val = getNestedValue(source, sourcePath);
    if (val !== undefined) {
      setNestedValue(result, targetPath, val);
    }
  }

  return result;
}

/**
 * Inverts path mappings to allow reverse schema transformation.
 */
export function invertMappings(mappings: Record<string, string>): Record<string, string> {
  const inverted: Record<string, string> = {};
  for (const [target, source] of Object.entries(mappings)) {
    inverted[source] = target;
  }
  return inverted;
}

/**
 * Wraps flat payload inside an envelope structure (e.g. { data: payload, success: true }).
 */
export function wrapEnvelope(
  payload: unknown,
  envelopeKey = 'data',
  extraMeta?: Record<string, unknown>
): Record<string, unknown> {
  return {
    [envelopeKey]: payload,
    ...extraMeta,
  };
}

/**
 * Unwraps payload from an envelope structure if envelopeKey is present.
 */
export function unwrapEnvelope(
  payload: unknown,
  envelopeKey = 'data'
): unknown {
  if (payload !== null && typeof payload === 'object' && envelopeKey in (payload as Record<string, unknown>)) {
    return (payload as Record<string, unknown>)[envelopeKey];
  }
  return payload;
}
