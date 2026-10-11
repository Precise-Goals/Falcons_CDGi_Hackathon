import { z } from 'zod';
import type { Change, ChangeKind, ChangeSetRollup, Impact } from './types.js';

export const ObservationSchema = z.object({
  id: z.string(),
  service: z.string(),
  endpoint: z.string(),
  method: z.string(),
  status: z.number().int(),
  headers: z.record(z.string()),
  body: z.unknown(),
  latencyMs: z.number(),
  rateLimitHeaders: z.record(z.string()).optional(),
  paginationShape: z.record(z.unknown()).optional(),
  errorBody: z.unknown().optional(),
  timestamp: z.string(),
});

export const BehaviouralFingerprintSchema = z.object({
  valueDistributions: z.record(z.number()),
  units: z.string().optional(),
  formats: z.array(z.string()).optional(),
  cardinality: z.enum(['low', 'high', 'unique', 'enum']),
  defaults: z.array(z.unknown()).optional(),
});

export const ContractSchema = z.object({
  service: z.string(),
  endpoint: z.string(),
  schema: z.object({
    types: z.record(z.string()),
    optionality: z.array(z.string()),
    enums: z.record(z.array(z.string())),
    formats: z.record(z.string()),
  }),
  fieldStats: z.record(BehaviouralFingerprintSchema),
  errorTaxonomy: z.record(z.unknown()),
  paginationStyle: z.enum(['cursor', 'offset', 'page', 'link-header', 'none']),
  rateLimitPolicy: z
    .object({
      limit: z.number(),
      window: z.string(),
    })
    .optional(),
  updatedAt: z.string(),
});

export const ChangeKindSchema = z.enum([
  'field_added',
  'field_removed',
  'type_changed',
  'rename',
  'unit_shift',
  'enum_semantics',
  'default_changed',
  'pagination_changed',
  'error_shape_changed',
  'rate_limit_changed',
  'truncation',
  'latency_regime',
  'semantic_other',
]);

export const SemanticVerdictSchema = z.enum([
  'equivalent',
  'lossy',
  'breaking',
  'unknown',
]);

export const ChangeSchema = z.object({
  id: z.string(),
  service: z.string(),
  endpoint: z.string(),
  kind: ChangeKindSchema,
  documented: z.boolean(),
  before: z.unknown(),
  after: z.unknown(),
  evidence: z.object({
    samples: z.array(z.string()),
    stats: z.record(z.number()),
  }),
  semanticVerdict: SemanticVerdictSchema,
  confidence: z.number().min(0).max(1),
  detectedAt: z.string(),
});

export const ImpactSchema = z.object({
  changeId: z.string(),
  affectedWorkflows: z.array(z.string()),
  fieldPaths: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  dependencyChain: z.array(z.string()),
});

export const AdapterStrategySchema = z.enum([
  'rename',
  'transform',
  'default-inject',
  'pagination-normalize',
  'retry-backoff',
]);

export const AdapterSchema = z.object({
  id: z.string(),
  changeId: z.string(),
  strategy: AdapterStrategySchema,
  code: z.string(),
  tests: z.string(),
  rollbackHandle: z.string(),
  appliedAt: z.string().optional(),
});

export const ValidationResultSchema = z.object({
  adapterId: z.string(),
  pass: z.boolean(),
  semanticEquivalence: z.boolean(),
  goldenTestResults: z.record(z.boolean()),
  evidence: z.string(),
});

export const MigrationProposalSchema = z.object({
  id: z.string(),
  changeId: z.string(),
  diff: z.string(),
  rationale: z.string(),
  riskAssessment: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.string(),
});

export const ChangeSetRollupSchema = z.object({
  service: z.string(),
  endpoint: z.string(),
  totalChanges: z.number().int().min(0),
  highestSeverity: z.enum(['low', 'medium', 'high', 'critical']),
  hasBreakingChanges: z.boolean(),
  averageConfidence: z.number().min(0).max(1),
  changesByKind: z.record(z.string(), z.number()),
  samplesSummary: z.array(z.string()),
});

export function rollupChangeSet(
  service: string,
  endpoint: string,
  changes: Change[],
  impacts?: Impact[]
): ChangeSetRollup {
  const totalChanges = changes.length;
  if (totalChanges === 0) {
    return {
      service,
      endpoint,
      totalChanges: 0,
      highestSeverity: 'low',
      hasBreakingChanges: false,
      averageConfidence: 1.0,
      changesByKind: {},
      samplesSummary: [],
    };
  }

  const hasBreakingChanges = changes.some((c) => c.semanticVerdict === 'breaking');
  const avgConf =
    changes.reduce((sum, c) => sum + c.confidence, 0) / totalChanges;

  const changesByKind: Partial<Record<ChangeKind, number>> = {};
  const sampleSet = new Set<string>();

  for (const c of changes) {
    changesByKind[c.kind] = (changesByKind[c.kind] || 0) + 1;
    for (const sample of c.evidence.samples) {
      sampleSet.add(sample);
    }
  }

  const severityRank: Record<'low' | 'medium' | 'high' | 'critical', number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  let highestSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (impacts && impacts.length > 0) {
    for (const imp of impacts) {
      if (severityRank[imp.severity] > severityRank[highestSeverity]) {
        highestSeverity = imp.severity;
      }
    }
  } else if (hasBreakingChanges) {
    highestSeverity = 'high';
  }

  return {
    service,
    endpoint,
    totalChanges,
    highestSeverity,
    hasBreakingChanges,
    averageConfidence: Math.round(avgConf * 1000) / 1000,
    changesByKind,
    samplesSummary: Array.from(sampleSet),
  };
}

