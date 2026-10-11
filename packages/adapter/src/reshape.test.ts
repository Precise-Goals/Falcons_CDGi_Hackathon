import { describe, it, expect } from 'vitest';
import {
  reshapeObject,
  invertMappings,
  getNestedValue,
  setNestedValue,
  wrapEnvelope,
  unwrapEnvelope,
} from './reshape.js';

describe('@intra/adapter Schema Reshape & Restructuring', () => {
  describe('Nested Dot-Path Access and Mutation', () => {
    it('retrieves deeply nested properties safely', () => {
      const obj = { user: { profile: { address: { city: 'San Francisco' } } } };
      expect(getNestedValue(obj, 'user.profile.address.city')).toBe('San Francisco');
      expect(getNestedValue(obj, 'user.profile.phone')).toBeUndefined();
      expect(getNestedValue(null, 'user.id')).toBeUndefined();
    });

    it('sets deeply nested property creating intermediary containers', () => {
      const target: Record<string, unknown> = {};
      setNestedValue(target, 'data.user.id', 'usr_42');
      expect(target).toEqual({
        data: {
          user: {
            id: 'usr_42',
          },
        },
      });
    });
  });

  describe('Flat <-> Nested Reshape Transformations', () => {
    it('restructures flat database records into nested domain models', () => {
      const flatSource = {
        user_id: 'usr_100',
        user_email: 'user@example.com',
        billing_currency: 'USD',
        billing_amount: 5000,
      };

      const mappings = {
        'account.id': 'user_id',
        'account.contact.email': 'user_email',
        'invoice.currency': 'billing_currency',
        'invoice.amount': 'billing_amount',
      };

      const nested = reshapeObject(flatSource, mappings);
      expect(nested).toEqual({
        account: {
          id: 'usr_100',
          contact: {
            email: 'user@example.com',
          },
        },
        invoice: {
          currency: 'USD',
          amount: 5000,
        },
      });
    });

    it('inverts mappings to restore flat structure from nested models', () => {
      const nestedSource = {
        account: {
          id: 'usr_100',
          contact: { email: 'user@example.com' },
        },
        invoice: {
          currency: 'USD',
          amount: 5000,
        },
      };

      const mappings = {
        'account.id': 'user_id',
        'account.contact.email': 'user_email',
        'invoice.currency': 'billing_currency',
        'invoice.amount': 'billing_amount',
      };

      const inverted = invertMappings(mappings);
      const flat = reshapeObject(nestedSource, inverted);

      expect(flat).toEqual({
        user_id: 'usr_100',
        user_email: 'user@example.com',
        billing_currency: 'USD',
        billing_amount: 5000,
      });
    });
  });

  describe('Envelope Wrap & Unwrap Operations', () => {
    it('wraps payload in API envelope with metadata', () => {
      const payload = { id: 1, name: 'Item' };
      const enveloped = wrapEnvelope(payload, 'data', { status: 200, timestamp: '2026-10-12T00:00:00Z' });

      expect(enveloped.data).toEqual(payload);
      expect(enveloped.status).toBe(200);
      expect(enveloped.timestamp).toBe('2026-10-12T00:00:00Z');
    });

    it('unwraps payload from envelope gracefully with fallback for flat inputs', () => {
      const enveloped = { data: { id: 1, name: 'Item' }, status: 200 };
      expect(unwrapEnvelope(enveloped, 'data')).toEqual({ id: 1, name: 'Item' });

      const plain = { id: 2, name: 'Plain' };
      expect(unwrapEnvelope(plain, 'data')).toEqual(plain);
    });
  });
});
