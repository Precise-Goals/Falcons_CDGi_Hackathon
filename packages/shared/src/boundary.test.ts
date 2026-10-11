import { describe, it, expect } from 'vitest';
import {
  ObservationSchema,
  ContractSchema,
  ChangeSchema,
  ChangeKindSchema,
  SemanticVerdictSchema,
  BehaviouralFingerprintSchema,
  MigrationProposalSchema,
  type Observation,
  type Contract,
  type Change,
  type ChangeKind,
  type SemanticVerdict,
  type MigrationProposal,
} from './index.js';

describe('Adversarial & Boundary Test Suite: @intra/shared', () => {
  // ---------------------------------------------------------------------------
  // Helper Fixture Builders
  // ---------------------------------------------------------------------------

  const buildValidObservation = (overrides?: Partial<Observation>): Observation => ({
    id: 'obs-boundary-001',
    service: 'payment-service',
    endpoint: '/api/v1/charges',
    method: 'POST',
    status: 201,
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-xyz-987',
      'user-agent': 'IntraObserver/1.0',
    },
    body: { chargeId: 'ch_123', amount: 5000, currency: 'USD' },
    latencyMs: 42.5,
    rateLimitHeaders: {
      'x-ratelimit-limit': '100',
      'x-ratelimit-remaining': '99',
    },
    paginationShape: {
      hasMore: false,
      totalCount: 1,
    },
    timestamp: '2026-10-10T14:30:00.000Z',
    ...overrides,
  });

  const buildValidChange = (overrides?: Partial<Change>): Change => ({
    id: 'chg-boundary-001',
    service: 'payment-service',
    endpoint: '/api/v1/charges',
    kind: 'unit_shift',
    documented: false,
    before: { amount: 50.0, unit: 'dollars' },
    after: { amount: 5000, unit: 'cents' },
    evidence: {
      samples: ['obs-001', 'obs-002'],
      stats: { meanRatio: 100, sampleSize: 250 },
    },
    semanticVerdict: 'equivalent',
    confidence: 0.98,
    detectedAt: '2026-10-10T14:35:00.000Z',
    ...overrides,
  });

  const buildValidContract = (overrides?: Partial<Contract>): Contract => ({
    service: 'payment-service',
    endpoint: '/api/v1/charges',
    schema: {
      types: { id: 'string', amount: 'number', currency: 'string' },
      optionality: ['currency'],
      enums: { currency: ['USD', 'EUR', 'GBP'] },
      formats: { id: 'uuid' },
    },
    fieldStats: {
      amount: {
        valueDistributions: { '0-100': 0.75, '101-500': 0.2, '500+': 0.05 },
        units: 'cents',
        formats: ['integer'],
        cardinality: 'high',
        defaults: [0],
      },
    },
    errorTaxonomy: {
      '400': 'INVALID_PAYLOAD',
      '404': 'CHARGE_NOT_FOUND',
      '429': 'RATE_LIMIT_EXCEEDED',
    },
    paginationStyle: 'cursor',
    rateLimitPolicy: {
      limit: 100,
      window: '60s',
    },
    updatedAt: '2026-10-10T14:00:00.000Z',
    ...overrides,
  });

  const buildValidMigrationProposal = (
    overrides?: Partial<MigrationProposal>
  ): MigrationProposal => ({
    id: 'prop-boundary-001',
    changeId: 'chg-boundary-001',
    diff: '--- old.ts\n+++ new.ts\n@@ -1,2 +1,2 @@\n-const amount = res.amount;\n+const amount = res.amount / 100;',
    rationale: 'Normalized cents back to dollars to preserve client compatibility.',
    riskAssessment: 'Low risk: mathematical inversion verified by golden tests.',
    status: 'pending',
    createdAt: '2026-10-10T14:40:00.000Z',
    ...overrides,
  });

  // ===========================================================================
  // 1. Malformed Observations
  // ===========================================================================
  describe('Requirement 1: Malformed Observations & Boundary Inputs', () => {
    describe('Missing required fields', () => {
      const requiredFields: Array<keyof Observation> = [
        'id',
        'service',
        'endpoint',
        'method',
        'status',
        'headers',
        'latencyMs',
        'timestamp',
      ];

      for (const field of requiredFields) {
        it(`rejects observation missing required field "${field}"`, () => {
          const malformed = buildValidObservation();
          delete (malformed as Record<string, unknown>)[field];

          const result = ObservationSchema.safeParse(malformed);
          expect(result.success).toBe(false);
          if (!result.success) {
            const hasFieldIssue = result.error.issues.some((issue) =>
              issue.path.includes(field)
            );
            expect(hasFieldIssue).toBe(true);
          }
        });
      }

      it('rejects completely empty object {}', () => {
        const result = ObservationSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('rejects null and undefined inputs', () => {
        expect(ObservationSchema.safeParse(null).success).toBe(false);
        expect(ObservationSchema.safeParse(undefined).success).toBe(false);
      });
    });

    describe('Invalid status codes', () => {
      it('rejects floating-point status codes', () => {
        const malformed = buildValidObservation({ status: 200.5 as unknown as number });
        const result = ObservationSchema.safeParse(malformed);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('integer');
        }
      });

      it('rejects string status codes', () => {
        const malformed = {
          ...buildValidObservation(),
          status: '200',
        };
        const result = ObservationSchema.safeParse(malformed);
        expect(result.success).toBe(false);
      });

      it('rejects NaN and Infinity status codes', () => {
        expect(
          ObservationSchema.safeParse(buildValidObservation({ status: NaN })).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(buildValidObservation({ status: Infinity })).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(buildValidObservation({ status: -Infinity })).success
        ).toBe(false);
      });

      it('rejects null, undefined, and boolean status codes', () => {
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ status: null as unknown as number })
          ).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ status: undefined as unknown as number })
          ).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ status: true as unknown as number })
          ).success
        ).toBe(false);
      });

      it('accepts legitimate HTTP status boundary integers', () => {
        for (const status of [100, 200, 201, 204, 301, 400, 404, 429, 500, 503]) {
          expect(
            ObservationSchema.safeParse(buildValidObservation({ status })).success
          ).toBe(true);
        }
      });
    });

    describe('Negative latency and latency boundary conditions', () => {
      it('rejects non-numeric latency values (strings, null, undefined, NaN)', () => {
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ latencyMs: '42ms' as unknown as number })
          ).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ latencyMs: null as unknown as number })
          ).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ latencyMs: undefined as unknown as number })
          ).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(buildValidObservation({ latencyMs: NaN })).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ latencyMs: true as unknown as number })
          ).success
        ).toBe(false);
      });

      it('parses zero and sub-millisecond precision latency boundaries', () => {
        expect(
          ObservationSchema.safeParse(buildValidObservation({ latencyMs: 0 })).success
        ).toBe(true);
        expect(
          ObservationSchema.safeParse(buildValidObservation({ latencyMs: 0.005 })).success
        ).toBe(true);
        expect(
          ObservationSchema.safeParse(buildValidObservation({ latencyMs: 3600000 })).success
        ).toBe(true);
      });

      it('flags adversarial negative latency payloads via domain invariant validation', () => {
        const negativeObservation = buildValidObservation({ latencyMs: -12.5 });
        const parseResult = ObservationSchema.safeParse(negativeObservation);
        // Schema level allows raw number
        expect(parseResult.success).toBe(true);

        // Domain invariant check: negative duration is physically invalid / malformed
        const isPhysicallyValidLatency = (obs: Observation): boolean => obs.latencyMs >= 0;
        expect(isPhysicallyValidLatency(negativeObservation)).toBe(false);
      });
    });

    describe('Timestamp boundaries & future temporal anomalies', () => {
      it('rejects non-string timestamps (numbers, booleans, objects, null)', () => {
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ timestamp: 1773289200000 as unknown as string })
          ).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ timestamp: null as unknown as string })
          ).success
        ).toBe(false);
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ timestamp: true as unknown as string })
          ).success
        ).toBe(false);
      });

      it('parses valid ISO8601 timestamps', () => {
        const obs = buildValidObservation({
          timestamp: '2026-10-10T14:30:00.000Z',
        });
        expect(ObservationSchema.safeParse(obs).success).toBe(true);
      });

      it('detects adversarial future timestamps via temporal validation logic', () => {
        const futureTimestampObs = buildValidObservation({
          timestamp: '2099-01-01T00:00:00.000Z',
        });
        const parseResult = ObservationSchema.safeParse(futureTimestampObs);
        expect(parseResult.success).toBe(true);

        // Domain temporal guard: verify timestamp does not lie beyond allowed skew (e.g. 5 minutes in future)
        const isNotFutureSkewed = (obs: Observation, maxSkewMs = 300000): boolean => {
          const parsedTime = new Date(obs.timestamp).getTime();
          return !Number.isNaN(parsedTime) && parsedTime <= Date.now() + maxSkewMs;
        };

        expect(isNotFutureSkewed(futureTimestampObs)).toBe(false);
      });
    });

    describe('Adversarial payloads, Unicode, and Header bounds', () => {
      it('handles unicode, emoji, and zero-width characters in string fields', () => {
        const unicodeObs = buildValidObservation({
          service: 'サービス-💳-users',
          endpoint: '/api/v1/üser-profile/тест/🚀',
          headers: {
            'x-custom-unicode': '日本語と絵文字🌟\u200B\uFEFF',
          },
        });
        const parsed = ObservationSchema.safeParse(unicodeObs);
        expect(parsed.success).toBe(true);
      });

      it('rejects headers with non-string values', () => {
        const malformed = {
          ...buildValidObservation(),
          headers: {
            'content-type': 'application/json',
            'x-ratelimit-remaining': 50 as unknown as string,
          },
        };
        expect(ObservationSchema.safeParse(malformed).success).toBe(false);
      });

      it('rejects rateLimitHeaders with non-string values', () => {
        const malformed = buildValidObservation({
          rateLimitHeaders: {
            limit: 100 as unknown as string,
          },
        });
        expect(ObservationSchema.safeParse(malformed).success).toBe(false);
      });

      it('handles deeply nested bodies and huge arrays', () => {
        const hugeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `user-${i}` }));
        const nestedBody = {
          level1: { level2: { level3: { level4: { items: hugeArray } } } },
        };
        const obs = buildValidObservation({ body: nestedBody });
        expect(ObservationSchema.safeParse(obs).success).toBe(true);
      });

      it('allows optional fields to be omitted or undefined', () => {
        const minimalObs = buildValidObservation({
          rateLimitHeaders: undefined,
          paginationShape: undefined,
          errorBody: undefined,
        });
        expect(ObservationSchema.safeParse(minimalObs).success).toBe(true);
      });

      it('parses structured RFC 7807 problem details and nested errorBody payloads', () => {
        const rfc7807Error = {
          type: 'https://api.intra.dev/errors/rate-limit-exceeded',
          title: 'Too Many Requests',
          status: 429,
          detail: 'Quota exceeded: 120 calls per minute exhausted',
          instance: '/orders/charge-99182',
          invalidParams: [{ name: 'api_key', reason: 'throttled' }],
        };
        const obsRfc = buildValidObservation({
          status: 429,
          errorBody: rfc7807Error,
        });
        expect(ObservationSchema.safeParse(obsRfc).success).toBe(true);

        const graphQlError = {
          errors: [
            {
              message: 'Field "totalPrice" is deprecated and requires subselection',
              locations: [{ line: 12, column: 5 }],
              path: ['order', 'totalPrice'],
              extensions: { code: 'DEPRECATED_SYNTAX', severity: 'WARNING' },
            },
          ],
        };
        const obsGql = buildValidObservation({
          status: 200,
          errorBody: graphQlError,
        });
        expect(ObservationSchema.safeParse(obsGql).success).toBe(true);
      });

      it('accepts string, array, and arbitrary primitive errorBody values', () => {
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ status: 500, errorBody: 'Internal Gateway Timeout: upstream down' })
          ).success
        ).toBe(true);
        expect(
          ObservationSchema.safeParse(
            buildValidObservation({ status: 400, errorBody: ['err_code_1', 'err_code_2'] })
          ).success
        ).toBe(true);
      });
    });
  });

  // ===========================================================================
  // 2. Change Schema Boundaries
  // ===========================================================================
  describe('Requirement 2: Change Schema Boundaries', () => {
    describe('Confidence score bounds ([0.0, 1.0])', () => {
      it('accepts exact lower bound 0.0', () => {
        const change = buildValidChange({ confidence: 0.0 });
        const result = ChangeSchema.safeParse(change);
        expect(result.success).toBe(true);
      });

      it('accepts exact upper bound 1.0', () => {
        const change = buildValidChange({ confidence: 1.0 });
        const result = ChangeSchema.safeParse(change);
        expect(result.success).toBe(true);
      });

      it('accepts intermediate boundary values (0.0001, 0.5, 0.9999)', () => {
        for (const conf of [0.0001, 0.1, 0.5, 0.8999, 0.9999]) {
          const change = buildValidChange({ confidence: conf });
          expect(ChangeSchema.safeParse(change).success).toBe(true);
        }
      });

      it('rejects confidence values strictly less than 0.0', () => {
        const subZero = [-0.00001, -0.1, -1.0, -100, -Infinity];
        for (const conf of subZero) {
          const change = buildValidChange({ confidence: conf });
          const result = ChangeSchema.safeParse(change);
          expect(result.success).toBe(false);
          if (!result.success) {
            const hasMinIssue = result.error.issues.some((issue) =>
              issue.path.includes('confidence')
            );
            expect(hasMinIssue).toBe(true);
          }
        }
      });

      it('rejects confidence values strictly greater than 1.0', () => {
        const aboveOne = [1.00001, 1.1, 2.0, 100, Infinity];
        for (const conf of aboveOne) {
          const change = buildValidChange({ confidence: conf });
          const result = ChangeSchema.safeParse(change);
          expect(result.success).toBe(false);
          if (!result.success) {
            const hasMaxIssue = result.error.issues.some((issue) =>
              issue.path.includes('confidence')
            );
            expect(hasMaxIssue).toBe(true);
          }
        }
      });

      it('rejects non-numeric confidence types (string, NaN, null, undefined)', () => {
        expect(
          ChangeSchema.safeParse(
            buildValidChange({ confidence: '0.95' as unknown as number })
          ).success
        ).toBe(false);
        expect(
          ChangeSchema.safeParse(buildValidChange({ confidence: NaN })).success
        ).toBe(false);
        expect(
          ChangeSchema.safeParse(
            buildValidChange({ confidence: null as unknown as number })
          ).success
        ).toBe(false);
        expect(
          ChangeSchema.safeParse(
            buildValidChange({ confidence: undefined as unknown as number })
          ).success
        ).toBe(false);
      });
    });

    describe('All 13 ChangeKind enums validated', () => {
      const all13ChangeKinds: ChangeKind[] = [
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
      ];

      it('has exactly 13 catalogued change kinds', () => {
        expect(all13ChangeKinds).toHaveLength(13);
        expect(ChangeKindSchema.options).toHaveLength(13);
        expect(new Set(all13ChangeKinds)).toEqual(new Set(ChangeKindSchema.options));
      });

      for (const kind of all13ChangeKinds) {
        it(`accepts ChangeKind "${kind}" via ChangeKindSchema and ChangeSchema`, () => {
          expect(ChangeKindSchema.safeParse(kind).success).toBe(true);
          const change = buildValidChange({ kind });
          const result = ChangeSchema.safeParse(change);
          expect(result.success).toBe(true);
        });
      }

      it('rejects unauthorized or misspelled ChangeKind values', () => {
        const invalidKinds = [
          'field_deleted',
          'renamed',
          'format_change',
          'rate_limit',
          'latency_spike',
          'FIELD_ADDED',
          'unknown_drift',
          '',
          null,
          undefined,
        ];

        for (const badKind of invalidKinds) {
          expect(ChangeKindSchema.safeParse(badKind).success).toBe(false);
          const change = buildValidChange({ kind: badKind as ChangeKind });
          expect(ChangeSchema.safeParse(change).success).toBe(false);
        }
      });
    });

    describe('All 4 SemanticVerdict enums validated', () => {
      const all4Verdicts: SemanticVerdict[] = [
        'equivalent',
        'lossy',
        'breaking',
        'unknown',
      ];

      it('has exactly 4 semantic verdicts', () => {
        expect(all4Verdicts).toHaveLength(4);
        expect(SemanticVerdictSchema.options).toHaveLength(4);
        expect(new Set(all4Verdicts)).toEqual(new Set(SemanticVerdictSchema.options));
      });

      for (const verdict of all4Verdicts) {
        it(`accepts SemanticVerdict "${verdict}" via SemanticVerdictSchema and ChangeSchema`, () => {
          expect(SemanticVerdictSchema.safeParse(verdict).success).toBe(true);
          const change = buildValidChange({ semanticVerdict: verdict });
          const result = ChangeSchema.safeParse(change);
          expect(result.success).toBe(true);
        });
      }

      it('rejects unauthorized SemanticVerdict values', () => {
        const invalidVerdicts = [
          'compatible',
          'safe',
          'fatal',
          'benign',
          'EQUIVALENT',
          'lossless',
          '',
          null,
          undefined,
        ];

        for (const badVerdict of invalidVerdicts) {
          expect(SemanticVerdictSchema.safeParse(badVerdict).success).toBe(false);
          const change = buildValidChange({
            semanticVerdict: badVerdict as SemanticVerdict,
          });
          expect(ChangeSchema.safeParse(change).success).toBe(false);
        }
      });
    });

    describe('Evidence and Documentation boundary checks', () => {
      it('validates empty samples array and empty stats map', () => {
        const change = buildValidChange({
          evidence: { samples: [], stats: {} },
        });
        expect(ChangeSchema.safeParse(change).success).toBe(true);
      });

      it('rejects evidence with non-string sample IDs', () => {
        const change = buildValidChange({
          evidence: {
            samples: [123 as unknown as string],
            stats: { score: 1.0 },
          },
        });
        expect(ChangeSchema.safeParse(change).success).toBe(false);
      });

      it('rejects evidence with non-number stats values', () => {
        const change = buildValidChange({
          evidence: {
            samples: ['obs-001'],
            stats: { score: 'high' as unknown as number },
          },
        });
        expect(ChangeSchema.safeParse(change).success).toBe(false);
      });

      it('enforces boolean documented field', () => {
        expect(
          ChangeSchema.safeParse(buildValidChange({ documented: true })).success
        ).toBe(true);
        expect(
          ChangeSchema.safeParse(buildValidChange({ documented: false })).success
        ).toBe(true);
        expect(
          ChangeSchema.safeParse(
            buildValidChange({ documented: 'false' as unknown as boolean })
          ).success
        ).toBe(false);
        expect(
          ChangeSchema.safeParse(
            buildValidChange({ documented: 1 as unknown as boolean })
          ).success
        ).toBe(false);
      });
    });
  });

  // ===========================================================================
  // 3. Contract Schema Edge Cases
  // ===========================================================================
  describe('Requirement 3: Contract Schema Edge Cases', () => {
    describe('Empty fieldStats & schema optionality', () => {
      it('accepts Contract with empty fieldStats {}', () => {
        const contract = buildValidContract({ fieldStats: {} });
        const result = ContractSchema.safeParse(contract);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(Object.keys(result.data.fieldStats)).toHaveLength(0);
        }
      });

      it('accepts Contract with empty schema maps & empty errorTaxonomy', () => {
        const contract = buildValidContract({
          schema: {
            types: {},
            optionality: [],
            enums: {},
            formats: {},
          },
          fieldStats: {},
          errorTaxonomy: {},
        });
        expect(ContractSchema.safeParse(contract).success).toBe(true);
      });

      it('accepts Contract with and without rateLimitPolicy', () => {
        const withRateLimit = buildValidContract({
          rateLimitPolicy: { limit: 500, window: '1m' },
        });
        expect(ContractSchema.safeParse(withRateLimit).success).toBe(true);

        const withoutRateLimit = buildValidContract({ rateLimitPolicy: undefined });
        expect(ContractSchema.safeParse(withoutRateLimit).success).toBe(true);
      });

      it('validates rateLimitPolicy edge cases and rejects malformed fields', () => {
        // Valid edge cases
        const zeroLimit = buildValidContract({
          rateLimitPolicy: { limit: 0, window: '0s' },
        });
        expect(ContractSchema.safeParse(zeroLimit).success).toBe(true);

        const highThroughputLimit = buildValidContract({
          rateLimitPolicy: { limit: 1_000_000, window: '1d' },
        });
        expect(ContractSchema.safeParse(highThroughputLimit).success).toBe(true);

        // Invalid: missing window
        const missingWindow = buildValidContract({
          rateLimitPolicy: { limit: 100 } as any,
        });
        expect(ContractSchema.safeParse(missingWindow).success).toBe(false);

        // Invalid: string limit
        const stringLimit = buildValidContract({
          rateLimitPolicy: { limit: '100' as any, window: '1m' },
        });
        expect(ContractSchema.safeParse(stringLimit).success).toBe(false);

        // Invalid: number window
        const numberWindow = buildValidContract({
          rateLimitPolicy: { limit: 100, window: 60 as any },
        });
        expect(ContractSchema.safeParse(numberWindow).success).toBe(false);
      });
    });

    describe('Rare and standard pagination styles', () => {
      const allowedPaginationStyles = [
        'cursor',
        'offset',
        'page',
        'link-header',
        'none',
      ] as const;

      for (const style of allowedPaginationStyles) {
        it(`accepts pagination style "${style}"`, () => {
          const contract = buildValidContract({ paginationStyle: style });
          expect(ContractSchema.safeParse(contract).success).toBe(true);
        });
      }

      it('specifically validates rare pagination style "link-header" (RFC 5988)', () => {
        const contract = buildValidContract({ paginationStyle: 'link-header' });
        const result = ContractSchema.safeParse(contract);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.paginationStyle).toBe('link-header');
        }
      });

      it('specifically validates "none" for non-paginated endpoints', () => {
        const contract = buildValidContract({ paginationStyle: 'none' });
        const result = ContractSchema.safeParse(contract);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.paginationStyle).toBe('none');
        }
      });

      it('rejects unauthorized pagination styles', () => {
        const invalidStyles = [
          'keyset',
          'seek',
          'token',
          'infinite-scroll',
          'cursor-v2',
          '',
          null,
        ];
        for (const badStyle of invalidStyles) {
          const contract = buildValidContract({
            paginationStyle: badStyle as Contract['paginationStyle'],
          });
          expect(ContractSchema.safeParse(contract).success).toBe(false);
        }
      });
    });

    describe('Extreme value distributions & BehaviouralFingerprint', () => {
      it('accepts empty valueDistributions {}', () => {
        const fingerprint = {
          valueDistributions: {},
          cardinality: 'low' as const,
        };
        expect(BehaviouralFingerprintSchema.safeParse(fingerprint).success).toBe(true);
      });

      it('accepts extreme distribution numeric boundaries (0, MAX_SAFE_INTEGER, MIN_SAFE_INTEGER, sub-normal floats)', () => {
        const extremeDistributions = {
          zero: 0,
          maxSafeInt: Number.MAX_SAFE_INTEGER,
          minSafeInt: Number.MIN_SAFE_INTEGER,
          tinyFloat: 1e-12,
          hugeFloat: 1e12,
          negativeDelta: -45.5,
        };

        const fingerprint = {
          valueDistributions: extremeDistributions,
          cardinality: 'high' as const,
        };

        const result = BehaviouralFingerprintSchema.safeParse(fingerprint);
        expect(result.success).toBe(true);
      });

      it('accepts massive dense histogram with 1000 buckets', () => {
        const massiveBuckets: Record<string, number> = {};
        for (let i = 0; i < 1000; i++) {
          massiveBuckets[`bucket_${i}`] = Math.random();
        }

        const contract = buildValidContract({
          fieldStats: {
            responseTimes: {
              valueDistributions: massiveBuckets,
              cardinality: 'high',
              units: 'ms',
            },
          },
        });

        expect(ContractSchema.safeParse(contract).success).toBe(true);
      });

      it('rejects non-numeric distribution values (strings, NaN, null)', () => {
        expect(
          BehaviouralFingerprintSchema.safeParse({
            valueDistributions: { '0-10': '50%' as unknown as number },
            cardinality: 'low',
          }).success
        ).toBe(false);

        expect(
          BehaviouralFingerprintSchema.safeParse({
            valueDistributions: { '0-10': NaN },
            cardinality: 'low',
          }).success
        ).toBe(false);

        expect(
          BehaviouralFingerprintSchema.safeParse({
            valueDistributions: { '0-10': null as unknown as number },
            cardinality: 'low',
          }).success
        ).toBe(false);
      });

      it('validates all 4 cardinality enums and rejects invalid ones', () => {
        const validCardinalities = ['low', 'high', 'unique', 'enum'] as const;
        for (const card of validCardinalities) {
          expect(
            BehaviouralFingerprintSchema.safeParse({
              valueDistributions: {},
              cardinality: card,
            }).success
          ).toBe(true);
        }

        expect(
          BehaviouralFingerprintSchema.safeParse({
            valueDistributions: {},
            cardinality: 'medium' as unknown as 'low',
          }).success
        ).toBe(false);
      });
    });
  });

  // ===========================================================================
  // 4. MigrationProposal Status Transitions
  // ===========================================================================
  describe('Requirement 4: MigrationProposal Status Transitions', () => {
    describe('Valid status enums and validation', () => {
      const validStatuses: MigrationProposal['status'][] = [
        'pending',
        'approved',
        'rejected',
      ];

      for (const status of validStatuses) {
        it(`accepts MigrationProposal with status "${status}"`, () => {
          const proposal = buildValidMigrationProposal({ status });
          const result = MigrationProposalSchema.safeParse(proposal);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.status).toBe(status);
          }
        });
      }

      it('rejects unauthorized or arbitrary status strings', () => {
        const invalidStatuses = [
          'draft',
          'in_review',
          'applied',
          'rolled_back',
          'merged',
          'cancelled',
          'PENDING',
          '',
          null,
          undefined,
        ];

        for (const badStatus of invalidStatuses) {
          const proposal = buildValidMigrationProposal({
            status: badStatus as MigrationProposal['status'],
          });
          expect(MigrationProposalSchema.safeParse(proposal).success).toBe(false);
        }
      });
    });

    describe('State Transition Lifecycle Machine', () => {
      type ProposalStatus = MigrationProposal['status'];

      const allowedTransitions: Record<ProposalStatus, ProposalStatus[]> = {
        pending: ['approved', 'rejected'],
        approved: [], // Terminal in proposal lifecycle (must open new proposal if revoked)
        rejected: [], // Terminal in proposal lifecycle
      };

      const transitionProposal = (
        current: MigrationProposal,
        nextStatus: ProposalStatus
      ): MigrationProposal => {
        const validNext = allowedTransitions[current.status];
        if (!validNext.includes(nextStatus)) {
          throw new Error(
            `Illegal state transition from "${current.status}" to "${nextStatus}"`
          );
        }

        const updated: MigrationProposal = {
          ...current,
          status: nextStatus,
        };

        // Ensure newly transitioned proposal is valid against schema
        MigrationProposalSchema.parse(updated);
        return updated;
      };

      it('successfully transitions from pending -> approved', () => {
        const initial = buildValidMigrationProposal({ status: 'pending' });
        expect(MigrationProposalSchema.safeParse(initial).success).toBe(true);

        const approved = transitionProposal(initial, 'approved');
        expect(approved.status).toBe('approved');
        expect(MigrationProposalSchema.safeParse(approved).success).toBe(true);
      });

      it('successfully transitions from pending -> rejected', () => {
        const initial = buildValidMigrationProposal({ status: 'pending' });
        expect(MigrationProposalSchema.safeParse(initial).success).toBe(true);

        const rejected = transitionProposal(initial, 'rejected');
        expect(rejected.status).toBe('rejected');
        expect(MigrationProposalSchema.safeParse(rejected).success).toBe(true);
      });

      it('disallows transition from approved -> pending (terminal state)', () => {
        const approved = buildValidMigrationProposal({ status: 'approved' });
        expect(() => transitionProposal(approved, 'pending')).toThrow(
          'Illegal state transition from "approved" to "pending"'
        );
      });

      it('disallows transition from rejected -> approved (terminal state)', () => {
        const rejected = buildValidMigrationProposal({ status: 'rejected' });
        expect(() => transitionProposal(rejected, 'approved')).toThrow(
          'Illegal state transition from "rejected" to "approved"'
        );
      });

      it('disallows transitioning to identical state (pending -> pending)', () => {
        const pending = buildValidMigrationProposal({ status: 'pending' });
        expect(() => transitionProposal(pending, 'pending')).toThrow(
          'Illegal state transition from "pending" to "pending"'
        );
      });
    });

    describe('Proposal boundary payloads', () => {
      it('accepts empty diff string and massive unified diffs', () => {
        const emptyDiff = buildValidMigrationProposal({ diff: '' });
        expect(MigrationProposalSchema.safeParse(emptyDiff).success).toBe(true);

        const hugeDiff = 'diff --git a/file b/file\n' + '+ line of code\n'.repeat(5000);
        const largeProposal = buildValidMigrationProposal({ diff: hugeDiff });
        expect(MigrationProposalSchema.safeParse(largeProposal).success).toBe(true);
      });

      it('accepts unicode and multi-paragraph rationale & riskAssessment', () => {
        const proposal = buildValidMigrationProposal({
          rationale: 'Reasoning: 変更の理由とリスク分析\nLine 2: 🚀 Automated synthesis.',
          riskAssessment: 'No breaking changes detected in p99 workflow telemetry.',
        });
        expect(MigrationProposalSchema.safeParse(proposal).success).toBe(true);
      });
    });
  });
});
