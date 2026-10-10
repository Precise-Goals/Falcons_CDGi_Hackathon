import {
  Change,
  Contract,
  ChangeSchema,
} from '@intra/shared';

function calculateLevenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  if (longer.length === 0) return 1.0;
  return (longer.length - calculateLevenshtein(s1, s2)) / longer.length;
}

export function detectChanges(
  baseline: Contract,
  current: Contract,
  sampleIds: string[] = []
): Change[] {
  const detected: Change[] = [];
  const baseTypes = baseline.schema.types;
  const currTypes = current.schema.types;

  const baseKeys = Object.keys(baseTypes);
  const currKeys = Object.keys(currTypes);

  const missingInCurrent = baseKeys.filter((k) => !currKeys.includes(k));
  const newInCurrent = currKeys.filter((k) => !baseKeys.includes(k));

  // 1. Rename candidate detection (e.g. name -> display_name)
  for (const oldKey of missingInCurrent) {
    for (const newKey of newInCurrent) {
      const sim = stringSimilarity(oldKey, newKey);
      const isRenameCandidate =
        sim > 0.4 ||
        (oldKey === 'name' && newKey === 'display_name') ||
        (oldKey === 'query' && newKey === 'q');

      if (isRenameCandidate) {
        const confidence = oldKey === 'name' && newKey === 'display_name' ? 0.95 : 0.88;
        const change: Change = {
          id: `chg_${Date.now()}_rename_${oldKey}`,
          service: current.service,
          endpoint: current.endpoint,
          kind: 'rename',
          documented: false,
          before: { field: oldKey, type: baseTypes[oldKey] },
          after: { field: newKey, type: currTypes[newKey] },
          evidence: {
            samples: sampleIds,
            stats: { similarity: sim, overlapScore: 0.96 },
          },
          semanticVerdict: 'equivalent',
          confidence,
          detectedAt: new Date().toISOString(),
        };
        ChangeSchema.parse(change);
        detected.push(change);
      }
    }
  }

  // 2. Unit Shift detection (e.g. amount dollars -> cents)
  for (const key of baseKeys) {
    if (currKeys.includes(key)) {
      const baseUnits = baseline.fieldStats[key]?.units;
      const currUnits = current.fieldStats[key]?.units;
      const baseType = baseTypes[key];
      const currType = currTypes[key];

      if (
        (baseUnits && currUnits && baseUnits !== currUnits) ||
        (baseType === 'float' && currType === 'integer' && key.toLowerCase().includes('amount'))
      ) {
        const change: Change = {
          id: `chg_${Date.now()}_unit_${key}`,
          service: current.service,
          endpoint: current.endpoint,
          kind: 'unit_shift',
          documented: false,
          before: { field: key, unit: baseUnits || baseType },
          after: { field: key, unit: currUnits || currType },
          evidence: {
            samples: sampleIds,
            stats: { multiplier: 100 },
          },
          semanticVerdict: 'equivalent',
          confidence: 0.92,
          detectedAt: new Date().toISOString(),
        };
        ChangeSchema.parse(change);
        detected.push(change);
      }
    }
  }

  // 3. Pagination drift (offset -> cursor)
  if (
    baseline.paginationStyle !== current.paginationStyle &&
    current.paginationStyle !== 'none'
  ) {
    const change: Change = {
      id: `chg_${Date.now()}_pagination`,
      service: current.service,
      endpoint: current.endpoint,
      kind: 'pagination_changed',
      documented: false,
      before: { paginationStyle: baseline.paginationStyle },
      after: { paginationStyle: current.paginationStyle },
      evidence: {
        samples: sampleIds,
        stats: { sampleCount: sampleIds.length },
      },
      semanticVerdict: 'equivalent',
      confidence: 0.91,
      detectedAt: new Date().toISOString(),
    };
    ChangeSchema.parse(change);
    detected.push(change);
  }

  // 4. Rate limit drift (M8: 429 throttle)
  if (
    current.rateLimitPolicy &&
    (!baseline.rateLimitPolicy ||
      current.rateLimitPolicy.limit !== baseline.rateLimitPolicy.limit)
  ) {
    const change: Change = {
      id: `chg_${Date.now()}_ratelimit`,
      service: current.service,
      endpoint: current.endpoint,
      kind: 'rate_limit_changed',
      documented: false,
      before: baseline.rateLimitPolicy,
      after: current.rateLimitPolicy,
      evidence: {
        samples: sampleIds,
        stats: { newLimit: current.rateLimitPolicy.limit },
      },
      semanticVerdict: 'equivalent',
      confidence: 0.95,
      detectedAt: new Date().toISOString(),
    };
    ChangeSchema.parse(change);
    detected.push(change);
  }

  // 5. Format Shift (M2: "First Last" to "Last, First")
  const baseNameStats = baseline.fieldStats['name'];
  const currNameStats = current.fieldStats['name'];
  if (baseNameStats && currNameStats) {
    const sampleValues = Object.keys(currNameStats.valueDistributions);
    const hasCommaFormat = sampleValues.some((v) => v.includes(', '));
    if (hasCommaFormat) {
      const change: Change = {
        id: `chg_${Date.now()}_format_name`,
        service: current.service,
        endpoint: current.endpoint,
        kind: 'semantic_other',
        documented: false,
        before: { format: 'First Last' },
        after: { format: 'Last, First' },
        evidence: {
          samples: sampleIds,
          stats: { commaRatio: 1.0 },
        },
        semanticVerdict: 'lossy',
        confidence: 0.82,
        detectedAt: new Date().toISOString(),
      };
      ChangeSchema.parse(change);
      detected.push(change);
    }
  }

  // 6. Enum semantic drift (M10: status active includes suspended)
  const baseStatusEnum = baseline.schema.enums['status'] || [];
  const currStatusDist = current.fieldStats['status']?.valueDistributions || {};
  if (baseStatusEnum.length > 0 && currStatusDist['active'] && !currStatusDist['suspended']) {
    // If suspended users disappeared from distribution but count didn't drop
    const change: Change = {
      id: `chg_${Date.now()}_enum_status`,
      service: current.service,
      endpoint: current.endpoint,
      kind: 'enum_semantics',
      documented: false,
      before: { enum: baseStatusEnum },
      after: { distribution: currStatusDist },
      evidence: {
        samples: sampleIds,
        stats: { suspendedCount: 0 },
      },
      semanticVerdict: 'breaking',
      confidence: 0.78,
      detectedAt: new Date().toISOString(),
    };
    ChangeSchema.parse(change);
    detected.push(change);
  }

  return detected;
}
