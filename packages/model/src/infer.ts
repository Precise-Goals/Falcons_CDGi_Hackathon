import {
  Observation,
  Contract,
  BehaviouralFingerprint,
  ContractSchema,
} from '@intra/shared';

/**
 * Infers the primitive or structural data type of an arbitrary value, distinguishing
 * floats from integers and null values from generic objects.
 */
function inferType(val: unknown): string {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? 'integer' : 'float';
  }
  return typeof val;
}

/**
 * Infers an API Contract specification from a batch of observed network traffic.
 * Analyzes field types, optionality distributions, enum candidate sets, rate limit headers,
 * pagination topologies (cursor vs offset vs page), and HTTP error taxonomy shapes.
 *
 * @param observations - Stream of raw or buffered traffic observations
 * @returns Inferred contract compliant with ContractSchema
 * @throws Error if observations array is empty
 */
export function inferContract(observations: Observation[]): Contract {
  if (observations.length === 0) {
    throw new Error('Cannot infer contract from 0 observations');
  }

  const first = observations[0];
  const service = first.service;
  const endpoint = first.endpoint;

  const types: Record<string, string> = {};
  const enums: Record<string, string[]> = {};
  const formats: Record<string, string> = {};
  const fieldStats: Record<string, BehaviouralFingerprint> = {};
  const fieldOccurrences: Record<string, number> = {};
  const totalSamples = observations.length;

  let paginationStyle: Contract['paginationStyle'] = 'none';
  let rateLimitPolicy: Contract['rateLimitPolicy'] = undefined;
  const errorTaxonomy: Record<string, unknown> = {};

  for (const obs of observations) {
    // Check rate limit headers
    if (obs.rateLimitHeaders) {
      const limit = parseInt(
        obs.rateLimitHeaders['x-ratelimit-limit'] ||
          obs.rateLimitHeaders['ratelimit-limit'] ||
          '0',
        10
      );
      if (limit > 0) {
        rateLimitPolicy = { limit, window: '1s' };
      }
    }

    // Check error taxonomy
    if (obs.status >= 400 && obs.errorBody) {
      errorTaxonomy[`status_${obs.status}`] = obs.errorBody;
    }

    // Check pagination patterns
    if (obs.body && typeof obs.body === 'object') {
      const bodyObj = obs.body as Record<string, unknown>;
      if ('nextCursor' in bodyObj || 'cursor' in bodyObj) {
        paginationStyle = 'cursor';
      } else if ('offset' in bodyObj && 'limit' in bodyObj) {
        paginationStyle = 'offset';
      } else if ('page' in bodyObj) {
        paginationStyle = 'page';
      }
    }

    // Analyze fields
    const items = Array.isArray(obs.body)
      ? obs.body
      : obs.body && typeof obs.body === 'object'
      ? [obs.body]
      : [];

    for (const item of items) {
      if (typeof item !== 'object' || item === null) continue;
      const record = item as Record<string, unknown>;

      for (const [key, val] of Object.entries(record)) {
        fieldOccurrences[key] = (fieldOccurrences[key] || 0) + 1;
        const currentType = inferType(val);
        types[key] = currentType;

        if (!fieldStats[key]) {
          fieldStats[key] = {
            valueDistributions: {},
            cardinality: 'low',
            defaults: [],
          };
        }

        const stats = fieldStats[key];
        const valStr = String(val);
        stats.valueDistributions[valStr] = (stats.valueDistributions[valStr] || 0) + 1;

        if (typeof val === 'string' && val.length < 30) {
          if (!enums[key]) enums[key] = [];
          if (!enums[key].includes(val)) {
            enums[key].push(val);
          }
        }

        if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('price')) {
          stats.units = currentType === 'integer' ? 'cents' : 'dollars';
        }
      }
    }
  }

  // Determine optionality and cardinality
  const optionality: string[] = [];
  for (const [key, count] of Object.entries(fieldOccurrences)) {
    if (count < totalSamples) {
      optionality.push(key);
    }
  }

  for (const [, stats] of Object.entries(fieldStats)) {
    const uniqueValuesCount = Object.keys(stats.valueDistributions).length;
    if (uniqueValuesCount <= 5) {
      stats.cardinality = 'enum';
    } else if (uniqueValuesCount > 20) {
      stats.cardinality = 'high';
    } else {
      stats.cardinality = 'low';
    }
  }

  const contract: Contract = {
    service,
    endpoint,
    schema: {
      types,
      optionality,
      enums,
      formats,
    },
    fieldStats,
    errorTaxonomy,
    paginationStyle,
    rateLimitPolicy,
    updatedAt: new Date().toISOString(),
  };

  ContractSchema.parse(contract);
  return contract;
}
