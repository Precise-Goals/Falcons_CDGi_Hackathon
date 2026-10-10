import { describe, it, expect, vi } from 'vitest';
import {
  parseSarvamJsonResponse,
  generateSarvamDynamicApiSchema,
  generateSarvamDynamicApiBatch,
} from './lib/sarvamGenerator';
import * as sarvamModule from './lib/sarvam';

describe('Sarvam AI Procedural API Generator', () => {
  describe('parseSarvamJsonResponse', () => {
    it('parses raw JSON correctly', () => {
      const raw = JSON.stringify({
        domain: 'FinTech',
        endpoint: '/v1/pay',
        method: 'POST',
      });
      const result = parseSarvamJsonResponse(raw);
      expect(result.domain).toBe('FinTech');
      expect(result.endpoint).toBe('/v1/pay');
      expect(result.method).toBe('POST');
    });

    it('parses markdown code fenced JSON correctly', () => {
      const raw = '```json\n{\n  "domain": "Logistics",\n  "mutationType": "unit_shift"\n}\n```';
      const result = parseSarvamJsonResponse(raw);
      expect(result.domain).toBe('Logistics');
      expect(result.mutationType).toBe('unit_shift');
    });

    it('extracts JSON surrounded by conversational text', () => {
      const raw = 'Here is the generated API drift scenario:\n{"domain":"Healthcare","expectedVerdict":"lossy"}\nHope this helps!';
      const result = parseSarvamJsonResponse(raw);
      expect(result.domain).toBe('Healthcare');
      expect(result.expectedVerdict).toBe('lossy');
    });

    it('throws when response is empty or unparsable', () => {
      expect(() => parseSarvamJsonResponse('')).toThrow();
      expect(() => parseSarvamJsonResponse('invalid not a json')).toThrow();
    });
  });

  describe('generateSarvamDynamicApiSchema', () => {
    it('generates a valid GeneratedApiSchema with live predictability analysis', async () => {
      const mockResponse = {
        text: JSON.stringify({
          domain: 'Autonomous Drone Grid',
          service: 'avionics',
          endpoint: '/drones/v1/telemetry?page=1',
          method: 'POST',
          baselinePayload: {
            drone_id: 'dr_992',
            altitude: 120.5,
            amount: 45.5,
            page: 1,
            status: 'in_flight',
          },
          mutatedPayload: {
            drone_id: 'dr_992',
            altitude: 12050,
            amount: 4550,
            page: 1,
            status: 'in_flight',
          },
          mutationType: 'unit_shift',
          mutationDescription: 'Altitude units converted from meters to centimeters',
          targetField: 'altitude',
          oldValue: 120.5,
          newValue: 12050,
          expectedVerdict: 'equivalent',
          expectedConfidence: 0.95,
        }),
        checksum: 'sha256_mock_drone',
        model: 'sarvam-105b',
        latencyMs: 120,
      };

      const spy = vi.spyOn(sarvamModule, 'askSarvamAI').mockResolvedValueOnce(mockResponse);

      const schema = await generateSarvamDynamicApiSchema('Autonomous Drone Grid');

      expect(spy).toHaveBeenCalled();
      expect(schema.domain).toBe('Autonomous Drone Grid');
      expect(schema.endpoint).toBe('/drones/v1/telemetry?page=1');
      expect(schema.mutationType).toBe('unit_shift');
      expect(schema.expectedVerdict).toBe('equivalent');
      expect(schema.expectedConfidence).toBe(0.95);
      expect(schema.baselineObservations.length).toBeGreaterThanOrEqual(2);
      expect(schema.predictability).toBeDefined();
      expect(schema.predictability.findings.length).toBeGreaterThan(0);
      expect(schema.predictability.score).toBeGreaterThan(0);

      spy.mockRestore();
    });

    it('retries on initial parse failure and succeeds on retry', async () => {
      const badResponse = {
        text: 'Malformed text not json',
        checksum: 'mock1',
        model: 'sarvam-105b',
        latencyMs: 100,
      };

      const goodResponse = {
        text: JSON.stringify({
          domain: 'FinTech Settlements',
          service: 'settlements',
          endpoint: '/v2/transfers',
          method: 'POST',
          baselinePayload: { amount: 100 },
          mutatedPayload: { amount: 10000 },
          mutationType: 'unit_shift',
          mutationDescription: 'Dollars to cents',
          targetField: 'amount',
          oldValue: 100,
          newValue: 10000,
          expectedVerdict: 'equivalent',
          expectedConfidence: 0.96,
        }),
        checksum: 'mock2',
        model: 'sarvam-105b',
        latencyMs: 120,
      };

      const spy = vi
        .spyOn(sarvamModule, 'askSarvamAI')
        .mockResolvedValueOnce(badResponse)
        .mockResolvedValueOnce(goodResponse);

      const schema = await generateSarvamDynamicApiSchema('FinTech Settlements');
      expect(schema.domain).toBe('FinTech Settlements');
      expect(spy).toHaveBeenCalledTimes(2);

      spy.mockRestore();
    });
  });

  describe('generateSarvamDynamicApiBatch', () => {
    it('generates a batch of schemas with onProgress updates', async () => {
      const mockSchema = {
        domain: 'Vector Search Cloud',
        service: 'embeddings',
        endpoint: '/v1/vectors/similarity',
        method: 'POST',
        baselinePayload: { vector_dim: 1536 },
        mutatedPayload: { vector_dim: 1536, precision: 'fp16' },
        mutationType: 'rename',
        mutationDescription: 'Vector precision metadata added',
        targetField: 'vector_dim',
        oldValue: 1536,
        newValue: 1536,
        expectedVerdict: 'equivalent',
        expectedConfidence: 0.94,
      };

      const spy = vi.spyOn(sarvamModule, 'askSarvamAI').mockResolvedValue({
        text: JSON.stringify(mockSchema),
        checksum: 'mock_batch',
        model: 'sarvam-105b',
        latencyMs: 50,
      });

      let progressCount = 0;
      const batch = await generateSarvamDynamicApiBatch(5, (completed, total) => {
        progressCount = completed;
        expect(total).toBe(5);
      });

      expect(batch).toHaveLength(5);
      expect(progressCount).toBe(5);
      expect(batch[0].id).toBe('api_sarvam_01');
      expect(batch[4].id).toBe('api_sarvam_05');

      spy.mockRestore();
    });
  });
});
