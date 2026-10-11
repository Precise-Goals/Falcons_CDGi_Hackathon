/**
 * Shared Domain Types for Intra
 * Single source of truth across engine, dashboard, mcpserver, and client SDK.
 */

export interface Observation {
  id: string;
  service: string;
  endpoint: string;
  method: string;
  status: number;
  headers: Record<string, string>;
  body: unknown;
  latencyMs: number;
  rateLimitHeaders?: Record<string, string>;
  paginationShape?: Record<string, unknown>;
  errorBody?: unknown;
  timestamp: string;
}

export interface BehaviouralFingerprint {
  valueDistributions: Record<string, number>;
  units?: string;
  formats?: string[];
  cardinality: 'low' | 'high' | 'unique' | 'enum';
  defaults?: unknown[];
}

export interface Contract {
  service: string;
  endpoint: string;
  schema: {
    types: Record<string, string>;
    optionality: string[];
    enums: Record<string, string[]>;
    formats: Record<string, string>;
  };
  fieldStats: Record<string, BehaviouralFingerprint>;
  errorTaxonomy: Record<string, unknown>;
  paginationStyle: 'cursor' | 'offset' | 'page' | 'link-header' | 'none';
  rateLimitPolicy?: {
    limit: number;
    window: string;
  };
  updatedAt: string;
}

export type ChangeKind =
  | 'field_added'
  | 'field_removed'
  | 'type_changed'
  | 'rename'
  | 'unit_shift'
  | 'enum_semantics'
  | 'default_changed'
  | 'pagination_changed'
  | 'error_shape_changed'
  | 'rate_limit_changed'
  | 'truncation'
  | 'latency_regime'
  | 'semantic_other';

export type SemanticVerdict = 'equivalent' | 'lossy' | 'breaking' | 'unknown';

export interface Change {
  id: string;
  service: string;
  endpoint: string;
  kind: ChangeKind;
  documented: boolean;
  before: unknown;
  after: unknown;
  evidence: {
    samples: string[]; // Observation IDs
    stats: Record<string, number>;
  };
  semanticVerdict: SemanticVerdict;
  confidence: number; // 0..1
  detectedAt: string;
}

export interface Impact {
  changeId: string;
  affectedWorkflows: string[];
  fieldPaths: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  dependencyChain: string[];
}

export type AdapterStrategy =
  | 'rename'
  | 'transform'
  | 'default-inject'
  | 'pagination-normalize'
  | 'retry-backoff';

export interface Adapter {
  id: string;
  changeId: string;
  strategy: AdapterStrategy;
  code: string;
  tests: string;
  rollbackHandle: string;
  appliedAt?: string;
}

export interface ValidationResult {
  adapterId: string;
  pass: boolean;
  semanticEquivalence: boolean;
  goldenTestResults: Record<string, boolean>;
  evidence: string;
}

export interface MigrationProposal {
  id: string;
  changeId: string;
  diff: string;
  rationale: string;
  riskAssessment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  endpoints: string[];
  status: 'healthy' | 'degraded' | 'mutated' | 'quarantined';
}

export interface SwitchboardMutation {
  id: string;
  service: string;
  name: string;
  active: boolean;
  description: string;
}

export interface ChangeSetRollup {
  service: string;
  endpoint: string;
  totalChanges: number;
  highestSeverity: 'low' | 'medium' | 'high' | 'critical';
  hasBreakingChanges: boolean;
  averageConfidence: number;
  changesByKind: Partial<Record<ChangeKind, number>>;
  samplesSummary: string[];
}

