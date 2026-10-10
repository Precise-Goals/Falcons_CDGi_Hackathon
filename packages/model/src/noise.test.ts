import { describe, it, expect } from 'vitest';
import { inferContract } from './infer.js';
import { ContractSchema, type Observation } from '@intra/shared';

describe('Model Inference: Edge Cases & Noisy Inputs (@intra/model)', () => {
  const createObservation = (overrides: Partial<Observation> = {}): Observation => ({
    id: `obs_${Math.random().toString(36).slice(2, 9)}`,
    service: 'orders-service',
    endpoint: '/api/v1/orders',
    method: 'GET',
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: { id: 'ord_100', status: 'pending' },
    latencyMs: 12.5,
    timestamp: '2026-10-10T20:00:00.000Z',
    ...overrides,
  });

  // =========================================================================
  // Requirement 1: Infer contract from empty array
  // =========================================================================
  describe('Requirement 1: Empty observations boundary', () => {
    it('throws Error("Cannot infer contract from 0 observations") when passed an empty array', () => {
      expect(() => inferContract([])).toThrowError('Cannot infer contract from 0 observations');
    });

    it('throws an exact instance of Error with the specified message', () => {
      try {
        inferContract([]);
        expect.unreachable('Should have thrown an error');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe('Cannot infer contract from 0 observations');
      }
    });
  });

  // =========================================================================
  // Requirement 2: Optionality inference
  // =========================================================================
  describe('Requirement 2: Optionality inference', () => {
    it('flags fields present in only 50% of requests in schema.optionality', () => {
      const observations: Observation[] = [
        createObservation({ id: 'obs_1', body: { orderId: '101', customerId: 'c1', couponCode: 'SAVE10' } }),
        createObservation({ id: 'obs_2', body: { orderId: '102', customerId: 'c2' } }),
      ];

      const contract = inferContract(observations);

      expect(contract.schema.optionality).toContain('couponCode');
      expect(contract.schema.optionality).not.toContain('orderId');
      expect(contract.schema.optionality).not.toContain('customerId');
    });

    it('correctly categorizes fields across a 10-sample observation batch with 50% optionality', () => {
      const observations: Observation[] = Array.from({ length: 10 }, (_, index) => {
        const hasOptionalField = index % 2 === 0; // Exactly 5 out of 10 (50%)
        const body: Record<string, unknown> = {
          orderId: `ord_${index}`,
          tenantId: 'tenant_main',
        };
        if (hasOptionalField) {
          body.giftNote = 'Happy Birthday';
        }
        return createObservation({ id: `obs_batch_${index}`, body });
      });

      const contract = inferContract(observations);

      expect(contract.schema.optionality).toContain('giftNote');
      expect(contract.schema.optionality).not.toContain('orderId');
      expect(contract.schema.optionality).not.toContain('tenantId');
      expect(ContractSchema.safeParse(contract).success).toBe(true);
    });

    it('flags fields with low frequency (e.g. 10% or 20%) in schema.optionality', () => {
      const observations: Observation[] = Array.from({ length: 10 }, (_, index) => {
        const body: Record<string, unknown> = { id: `id_${index}`, base: 'common' };
        if (index === 0) {
          body.rareField = 'only_once'; // 10%
        }
        if (index < 2) {
          body.twoOutOfTen = 'twice'; // 20%
        }
        return createObservation({ id: `obs_freq_${index}`, body });
      });

      const contract = inferContract(observations);

      expect(contract.schema.optionality).toContain('rareField');
      expect(contract.schema.optionality).toContain('twoOutOfTen');
      expect(contract.schema.optionality).not.toContain('id');
      expect(contract.schema.optionality).not.toContain('base');
    });

    it('returns empty schema.optionality when all fields are present in 100% of observations', () => {
      const observations: Observation[] = [
        createObservation({ id: 'obs_1', body: { sku: 'SKU-A', qty: 2 } }),
        createObservation({ id: 'obs_2', body: { sku: 'SKU-B', qty: 5 } }),
        createObservation({ id: 'obs_3', body: { sku: 'SKU-C', qty: 1 } }),
      ];

      const contract = inferContract(observations);
      expect(contract.schema.optionality).toEqual([]);
    });
  });

  // =========================================================================
  // Requirement 3: High cardinality vs Enum cardinality
  // =========================================================================
  describe('Requirement 3: High cardinality vs Enum cardinality', () => {
    it('classifies <= 5 unique values as enum cardinality', () => {
      // 1 unique value boundary
      const obsSingleVal = Array.from({ length: 5 }, (_, i) =>
        createObservation({ id: `obs_s_${i}`, body: { type: 'standard' } })
      );
      const contractSingle = inferContract(obsSingleVal);
      expect(contractSingle.fieldStats.type.cardinality).toBe('enum');

      // 3 unique values
      const statusValues = ['pending', 'shipped', 'delivered'];
      const obsThreeVals = statusValues.map((val, i) =>
        createObservation({ id: `obs_3_${i}`, body: { status: val } })
      );
      const contractThree = inferContract(obsThreeVals);
      expect(contractThree.fieldStats.status.cardinality).toBe('enum');

      // Exactly 5 unique values (upper boundary of enum)
      const fiveLevels = ['lv1', 'lv2', 'lv3', 'lv4', 'lv5'];
      const obsFiveVals = fiveLevels.map((lvl, i) =>
        createObservation({ id: `obs_5_${i}`, body: { level: lvl } })
      );
      const contractFive = inferContract(obsFiveVals);
      expect(contractFive.fieldStats.level.cardinality).toBe('enum');
      expect(contractFive.schema.enums.level).toEqual(expect.arrayContaining(fiveLevels));
    });

    it('classifies 6 to 20 unique values as low cardinality', () => {
      // Exactly 6 unique values (boundary just above enum: 6 <= 20)
      const sixCategories = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
      const obsSixVals = sixCategories.map((cat, i) =>
        createObservation({ id: `obs_6_${i}`, body: { category: cat } })
      );
      const contractSix = inferContract(obsSixVals);
      expect(contractSix.fieldStats.category.cardinality).toBe('low');

      // Exactly 20 unique values (upper boundary of low)
      const twentyCodes = Array.from({ length: 20 }, (_, i) => `code_${i}`);
      const obsTwentyVals = twentyCodes.map((code, i) =>
        createObservation({ id: `obs_20_${i}`, body: { code } })
      );
      const contractTwenty = inferContract(obsTwentyVals);
      expect(contractTwenty.fieldStats.code.cardinality).toBe('low');
    });

    it('classifies > 20 unique values as high cardinality', () => {
      // Exactly 21 unique values (boundary just above low: 21 > 20)
      const twentyOneIds = Array.from({ length: 21 }, (_, i) => `uuid_${i}`);
      const obsTwentyOneVals = twentyOneIds.map((val, i) =>
        createObservation({ id: `obs_21_${i}`, body: { uuid: val } })
      );
      const contractTwentyOne = inferContract(obsTwentyOneVals);
      expect(contractTwentyOne.fieldStats.uuid.cardinality).toBe('high');

      // 50 unique values (high cardinality burst)
      const fiftyTokens = Array.from({ length: 50 }, (_, i) => `tok_${i}_${Math.random()}`);
      const obsFiftyVals = fiftyTokens.map((token, i) =>
        createObservation({ id: `obs_50_${i}`, body: { sessionToken: token } })
      );
      const contractFifty = inferContract(obsFiftyVals);
      expect(contractFifty.fieldStats.sessionToken.cardinality).toBe('high');
      expect(Object.keys(contractFifty.fieldStats.sessionToken.valueDistributions).length).toBe(50);
    });

    it('does not add strings >= 30 characters to schema.enums while maintaining cardinality stats', () => {
      const longStringA = 'a'.repeat(30);
      const longStringB = 'b'.repeat(35);
      const obs = [
        createObservation({ id: 'obs_long_1', body: { hash: longStringA } }),
        createObservation({ id: 'obs_long_2', body: { hash: longStringB } }),
      ];

      const contract = inferContract(obs);
      expect(contract.fieldStats.hash.cardinality).toBe('enum'); // 2 unique values <= 5
      expect(contract.schema.enums.hash).toBeUndefined(); // Strings >= 30 chars are not enums
    });
  });

  // =========================================================================
  // Requirement 4: Error taxonomy learning
  // =========================================================================
  describe('Requirement 4: Error taxonomy learning', () => {
    it('accurately indexes status 400, 429, and 500 error bodies into errorTaxonomy', () => {
      const error400Body = {
        code: 'VALIDATION_FAILED',
        message: 'Invalid payload: order items required',
        fields: ['items'],
      };
      const error429Body = {
        error: 'Too Many Requests',
        retryAfterMs: 3000,
        quotaLimit: 100,
      };
      const error500Body = {
        error: 'Internal Server Error',
        requestId: 'req_crash_999',
        stackTraceAvailable: false,
      };

      const observations: Observation[] = [
        createObservation({
          id: 'obs_err_400',
          status: 400,
          errorBody: error400Body,
          body: null,
        }),
        createObservation({
          id: 'obs_err_429',
          status: 429,
          errorBody: error429Body,
          body: null,
        }),
        createObservation({
          id: 'obs_err_500',
          status: 500,
          errorBody: error500Body,
          body: null,
        }),
        createObservation({
          id: 'obs_ok_200',
          status: 200,
          body: { orderId: 'ord_ok', status: 'completed' },
        }),
      ];

      const contract = inferContract(observations);

      expect(contract.errorTaxonomy['status_400']).toEqual(error400Body);
      expect(contract.errorTaxonomy['status_429']).toEqual(error429Body);
      expect(contract.errorTaxonomy['status_500']).toEqual(error500Body);
      expect(contract.errorTaxonomy['status_200']).toBeUndefined();
    });

    it('indexes other HTTP error status codes (e.g. 404, 502, 503)', () => {
      const observations: Observation[] = [
        createObservation({
          id: 'obs_404',
          status: 404,
          errorBody: { error: 'Not Found', resource: 'Order' },
        }),
        createObservation({
          id: 'obs_503',
          status: 503,
          errorBody: { error: 'Service Unavailable', maintenanceMode: true },
        }),
      ];

      const contract = inferContract(observations);
      expect(contract.errorTaxonomy['status_404']).toEqual({ error: 'Not Found', resource: 'Order' });
      expect(contract.errorTaxonomy['status_503']).toEqual({ error: 'Service Unavailable', maintenanceMode: true });
    });

    it('does not index errors when status >= 400 but errorBody is absent/undefined', () => {
      const observations: Observation[] = [
        createObservation({
          id: 'obs_err_no_body',
          status: 404,
          errorBody: undefined,
          body: null,
        }),
      ];

      const contract = inferContract(observations);
      expect(contract.errorTaxonomy['status_404']).toBeUndefined();
    });

    it('does not index errorBody if status is successful (< 400)', () => {
      const observations: Observation[] = [
        createObservation({
          id: 'obs_200_noisy',
          status: 200,
          errorBody: { note: 'benign warning' },
          body: { id: 'ord_ok' },
        }),
      ];

      const contract = inferContract(observations);
      expect(contract.errorTaxonomy['status_200']).toBeUndefined();
    });
  });

  // =========================================================================
  // Requirement 5: Pagination style inference
  // =========================================================================
  describe('Requirement 5: Pagination style inference', () => {
    it('infers cursor pagination style when body contains cursor or nextCursor', () => {
      const obsWithCursor = [
        createObservation({
          id: 'obs_cur_1',
          body: { cursor: 'cur_abc_123', items: [{ id: 1 }] },
        }),
      ];
      expect(inferContract(obsWithCursor).paginationStyle).toBe('cursor');

      const obsWithNextCursor = [
        createObservation({
          id: 'obs_cur_2',
          body: { nextCursor: 'cur_xyz_789', data: [{ id: 2 }] },
        }),
      ];
      expect(inferContract(obsWithNextCursor).paginationStyle).toBe('cursor');
    });

    it('infers offset pagination style when body contains both offset and limit', () => {
      const obsWithOffset = [
        createObservation({
          id: 'obs_offset_1',
          body: { offset: 0, limit: 50, results: [{ id: 1 }] },
        }),
      ];
      expect(inferContract(obsWithOffset).paginationStyle).toBe('offset');
    });

    it('infers page pagination style when body contains page', () => {
      const obsWithPage = [
        createObservation({
          id: 'obs_page_1',
          body: { page: 1, totalPages: 5, items: [{ id: 1 }] },
        }),
      ];
      expect(inferContract(obsWithPage).paginationStyle).toBe('page');
    });

    it('infers none pagination style when pagination keys are absent', () => {
      // Standard payload without pagination
      const obsNoneA = [
        createObservation({
          id: 'obs_none_1',
          body: { id: 'ord_1', total: 100, items: ['item_1', 'item_2'] },
        }),
      ];
      expect(inferContract(obsNoneA).paginationStyle).toBe('none');

      // Array payload
      const obsNoneB = [
        createObservation({
          id: 'obs_none_2',
          body: [{ id: 'ord_1' }, { id: 'ord_2' }],
        }),
      ];
      expect(inferContract(obsNoneB).paginationStyle).toBe('none');

      // Empty object payload
      const obsNoneC = [
        createObservation({
          id: 'obs_none_3',
          body: {},
        }),
      ];
      expect(inferContract(obsNoneC).paginationStyle).toBe('none');

      // Body with only offset (without limit) does not match offset pagination
      const obsOnlyOffset = [
        createObservation({
          id: 'obs_none_4',
          body: { offset: 10, items: [] },
        }),
      ];
      expect(inferContract(obsOnlyOffset).paginationStyle).toBe('none');

      // Body with only limit (without offset) does not match offset pagination
      const obsOnlyLimit = [
        createObservation({
          id: 'obs_none_5',
          body: { limit: 10, items: [] },
        }),
      ];
      expect(inferContract(obsOnlyLimit).paginationStyle).toBe('none');
    });
  });

  // =========================================================================
  // Additional Edge Cases: Units & Currency Deduction
  // =========================================================================
  describe('Units and Financial Semantics Deduction', () => {
    it('infers units as "cents" when amount/price field is an integer', () => {
      const observations: Observation[] = [
        createObservation({
          id: 'obs_int_amt',
          body: { id: 'chg_1', amount: 2500, unitPrice: 500 },
        }),
      ];

      const contract = inferContract(observations);
      expect(contract.fieldStats.amount.units).toBe('cents');
      expect(contract.fieldStats.unitPrice.units).toBe('cents');
    });

    it('infers units as "dollars" when amount/price field is a float', () => {
      const observations: Observation[] = [
        createObservation({
          id: 'obs_flt_amt',
          body: { id: 'chg_2', amount: 25.5, totalPrice: 99.99 },
        }),
      ];

      const contract = inferContract(observations);
      expect(contract.fieldStats.amount.units).toBe('dollars');
      expect(contract.fieldStats.totalPrice.units).toBe('dollars');
    });

    it('leaves units undefined for non-price/amount fields', () => {
      const observations: Observation[] = [
        createObservation({
          id: 'obs_no_units',
          body: { id: 'chg_3', quantity: 10, weightKg: 12.5 },
        }),
      ];

      const contract = inferContract(observations);
      expect(contract.fieldStats.quantity.units).toBeUndefined();
      expect(contract.fieldStats.weightKg.units).toBeUndefined();
    });
  });

  // =========================================================================
  // Additional Edge Cases: Rate Limit Policy Extraction
  // =========================================================================
  describe('Rate Limit Policy Extraction', () => {
    it('extracts rate limit from "x-ratelimit-limit" header', () => {
      const observations = [
        createObservation({
          rateLimitHeaders: { 'x-ratelimit-limit': '150' },
        }),
      ];
      const contract = inferContract(observations);
      expect(contract.rateLimitPolicy).toEqual({ limit: 150, window: '1s' });
    });

    it('extracts rate limit from "ratelimit-limit" header', () => {
      const observations = [
        createObservation({
          rateLimitHeaders: { 'ratelimit-limit': '300' },
        }),
      ];
      const contract = inferContract(observations);
      expect(contract.rateLimitPolicy).toEqual({ limit: 300, window: '1s' });
    });

    it('ignores zero or invalid rate limit header values', () => {
      const observations = [
        createObservation({
          rateLimitHeaders: { 'x-ratelimit-limit': '0' },
        }),
      ];
      const contract = inferContract(observations);
      expect(contract.rateLimitPolicy).toBeUndefined();
    });

    it('leaves rateLimitPolicy undefined when no rate limit headers exist', () => {
      const observations = [createObservation({ rateLimitHeaders: undefined })];
      const contract = inferContract(observations);
      expect(contract.rateLimitPolicy).toBeUndefined();
    });
  });

  // =========================================================================
  // Additional Edge Cases: Noisy Payloads & Robust Parsing
  // =========================================================================
  describe('Noisy Payloads and Adversarial Ingestion', () => {
    it('handles observations with array bodies containing nulls and primitives safely', () => {
      const observations = [
        createObservation({
          id: 'obs_noisy_arr',
          body: [
            { id: 'item_1', name: 'Valid Object' },
            null,
            'primitive_string',
            42,
            { id: 'item_2', name: 'Second Object' },
          ],
        }),
      ];

      const contract = inferContract(observations);
      expect(contract.schema.types.id).toBe('string');
      expect(contract.schema.types.name).toBe('string');
      expect(contract.fieldStats.id.cardinality).toBe('enum');
      expect(ContractSchema.safeParse(contract).success).toBe(true);
    });

    it('accurately identifies diverse data types (integer, float, boolean, array, null, string)', () => {
      const observations = [
        createObservation({
          body: {
            intVal: 100,
            floatVal: 12.34,
            boolVal: true,
            arrayVal: [1, 2, 3],
            nullVal: null,
            strVal: 'hello world',
          },
        }),
      ];

      const contract = inferContract(observations);
      expect(contract.schema.types.intVal).toBe('integer');
      expect(contract.schema.types.floatVal).toBe('float');
      expect(contract.schema.types.boolVal).toBe('boolean');
      expect(contract.schema.types.arrayVal).toBe('array');
      expect(contract.schema.types.nullVal).toBe('null');
      expect(contract.schema.types.strVal).toBe('string');
    });

    it('validates generated contracts conform to ContractSchema', () => {
      const observations = [
        createObservation({
          id: 'obs_valid_zod',
          service: 'checkout',
          endpoint: '/checkout/pay',
          body: { transactionId: 'tx_123', amount: 50.0, status: 'approved' },
          rateLimitHeaders: { 'x-ratelimit-limit': '20' },
        }),
      ];

      const contract = inferContract(observations);
      const parseResult = ContractSchema.safeParse(contract);
      expect(parseResult.success).toBe(true);
      expect(contract.updatedAt).toBeDefined();
      expect(new Date(contract.updatedAt).getTime()).not.toBeNaN();
    });
  });
});
