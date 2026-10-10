import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { Buffer } from 'node:buffer';
import { Switchboard } from './switchboard.js';
import { buildSimServicesApp } from './services.js';

describe('Comprehensive Simulated Service Mutations (M1-M10)', () => {
  let switchboard: Switchboard;
  let app: FastifyInstance;

  beforeEach(async () => {
    switchboard = new Switchboard();
    app = buildSimServicesApp(switchboard);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. Switchboard API Endpoints
  // =========================================================================
  describe('Switchboard API Endpoints', () => {
    it('GET /sim/switchboard lists all 10 catalogue mutations in baseline state', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/sim/switchboard',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(Array.isArray(data.mutations)).toBe(true);
      expect(data.mutations).toHaveLength(10);

      const expectedIds = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'];
      const returnedIds = data.mutations.map((m: { id: string }) => m.id);
      expect(returnedIds).toEqual(expectedIds);

      // Verify all active flags are initially false
      for (const m of data.mutations) {
        expect(m.active).toBe(false);
        expect(m).toHaveProperty('name');
        expect(m).toHaveProperty('service');
        expect(m).toHaveProperty('description');
      }
    });

    it('POST /sim/switchboard/toggle enables and disables mutation state', async () => {
      // 1. Enable M1
      const enableRes = await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M1', active: true },
      });
      expect(enableRes.statusCode).toBe(200);
      const enableData = enableRes.json();
      expect(enableData.success).toBe(true);
      expect(enableData.mutation.id).toBe('M1');
      expect(enableData.mutation.active).toBe(true);
      expect(switchboard.isEnabled('M1')).toBe(true);

      // Verify mutation is reflected in switchboard list
      const listRes = await app.inject({
        method: 'GET',
        url: '/sim/switchboard',
      });
      const m1 = listRes.json().mutations.find((m: { id: string }) => m.id === 'M1');
      expect(m1.active).toBe(true);

      // 2. Disable M1
      const disableRes = await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M1', active: false },
      });
      expect(disableRes.statusCode).toBe(200);
      const disableData = disableRes.json();
      expect(disableData.success).toBe(true);
      expect(disableData.mutation.id).toBe('M1');
      expect(disableData.mutation.active).toBe(false);
      expect(switchboard.isEnabled('M1')).toBe(false);
    });

    it('POST /sim/switchboard/toggle with nonexistent ID returns 404', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'NONEXISTENT_MUTATION_999', active: true },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({ error: 'Mutation not found' });
    });

    it('POST /sim/switchboard/toggle with empty string ID returns 404', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: '', active: true },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({ error: 'Mutation not found' });
    });

    it('POST /sim/switchboard/reset turns off all active mutations', async () => {
      // Enable multiple mutations
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M1', active: true },
      });
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M3', active: true },
      });
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M7', active: true },
      });

      expect(switchboard.isEnabled('M1')).toBe(true);
      expect(switchboard.isEnabled('M3')).toBe(true);
      expect(switchboard.isEnabled('M7')).toBe(true);

      // Reset
      const resetRes = await app.inject({
        method: 'POST',
        url: '/sim/switchboard/reset',
      });
      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.json()).toEqual({
        success: true,
        message: 'All mutations reset to baseline',
      });

      // Verify all mutations are reset
      expect(switchboard.isEnabled('M1')).toBe(false);
      expect(switchboard.isEnabled('M3')).toBe(false);
      expect(switchboard.isEnabled('M7')).toBe(false);

      const listRes = await app.inject({
        method: 'GET',
        url: '/sim/switchboard',
      });
      const activeCount = listRes.json().mutations.filter((m: { active: boolean }) => m.active).length;
      expect(activeCount).toBe(0);
    });
  });

  // =========================================================================
  // 2. M1: Field Rename (Users Service)
  // =========================================================================
  describe('M1 (Field Rename)', () => {
    it('baseline: GET /users returns name, not display_name', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/users',
      });
      expect(res.statusCode).toBe(200);
      const users = res.json();
      expect(users).toHaveLength(3);

      expect(users[0]).toEqual({
        id: 'usr_1',
        name: 'Alice Walker',
        status: 'active',
      });
      expect(users[0]).not.toHaveProperty('display_name');

      expect(users[1]).toEqual({
        id: 'usr_2',
        name: 'Bob Stone',
        status: 'active',
      });
      expect(users[1]).not.toHaveProperty('display_name');

      expect(users[2]).toEqual({
        id: 'usr_3',
        name: 'Charlie Brown',
        status: 'suspended',
      });
      expect(users[2]).not.toHaveProperty('display_name');
    });

    it('M1 enabled: GET /users returns display_name, not name', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M1', active: true },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/users',
      });
      expect(res.statusCode).toBe(200);
      const users = res.json();
      expect(users).toHaveLength(3);

      expect(users[0]).toEqual({
        id: 'usr_1',
        display_name: 'Alice Walker',
        status: 'active',
      });
      expect(users[0]).not.toHaveProperty('name');

      expect(users[1]).toEqual({
        id: 'usr_2',
        display_name: 'Bob Stone',
        status: 'active',
      });
      expect(users[1]).not.toHaveProperty('name');

      expect(users[2]).toEqual({
        id: 'usr_3',
        display_name: 'Charlie Brown',
        status: 'suspended',
      });
      expect(users[2]).not.toHaveProperty('name');
    });
  });

  // =========================================================================
  // 3. M2: Name Format Shift (Users Service)
  // =========================================================================
  describe('M2 (Name Format Shift)', () => {
    it('baseline: GET /users formats name as "First Last"', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/users',
      });
      expect(res.statusCode).toBe(200);
      const users = res.json();
      expect(users[0].name).toBe('Alice Walker');
      expect(users[1].name).toBe('Bob Stone');
      expect(users[2].name).toBe('Charlie Brown');
    });

    it('M2 enabled: GET /users formats as "Last, First" (e.g. "Walker, Alice")', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M2', active: true },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/users',
      });
      expect(res.statusCode).toBe(200);
      const users = res.json();
      expect(users).toHaveLength(3);

      expect(users[0]).toEqual({
        id: 'usr_1',
        name: 'Walker, Alice',
        status: 'active',
      });
      expect(users[1]).toEqual({
        id: 'usr_2',
        name: 'Stone, Bob',
        status: 'active',
      });
      expect(users[2]).toEqual({
        id: 'usr_3',
        name: 'Brown, Charlie',
        status: 'suspended',
      });
    });
  });

  // =========================================================================
  // 4. M2 + M1 Combined (Users Service)
  // =========================================================================
  describe('M2 + M1 Combined', () => {
    it('M2 + M1 combined: display_name formatted as "Last, First"', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M1', active: true },
      });
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M2', active: true },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/users',
      });
      expect(res.statusCode).toBe(200);
      const users = res.json();

      expect(users[0]).toEqual({
        id: 'usr_1',
        display_name: 'Walker, Alice',
        status: 'active',
      });
      expect(users[0]).not.toHaveProperty('name');

      expect(users[1]).toEqual({
        id: 'usr_2',
        display_name: 'Stone, Bob',
        status: 'active',
      });
      expect(users[1]).not.toHaveProperty('name');

      expect(users[2]).toEqual({
        id: 'usr_3',
        display_name: 'Brown, Charlie',
        status: 'suspended',
      });
      expect(users[2]).not.toHaveProperty('name');
    });
  });

  // =========================================================================
  // 5. M3: Unit Shift (Payments Service)
  // =========================================================================
  describe('M3 (Unit Shift)', () => {
    it('baseline: POST /payments/charge returns float dollars', async () => {
      const res1 = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 25.0 },
      });
      expect(res1.statusCode).toBe(200);
      expect(res1.json().amount).toBe(25.0);

      const res2 = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 10.99 },
      });
      expect(res2.statusCode).toBe(200);
      expect(res2.json().amount).toBe(10.99);
    });

    it('M3 enabled: POST /payments/charge converts 25.0 -> 2500, 10.99 -> 1099', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M3', active: true },
      });

      // 25.0 -> 2500
      const res1 = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 25.0 },
      });
      expect(res1.statusCode).toBe(200);
      const data1 = res1.json();
      expect(data1.amount).toBe(2500);
      expect(data1.currency).toBe('USD');
      expect(data1.status).toBe('succeeded');
      expect(data1.id).toMatch(/^chg_\d+$/);

      // 10.99 -> 1099
      const res2 = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 10.99 },
      });
      expect(res2.statusCode).toBe(200);
      expect(res2.json().amount).toBe(1099);
    });

    it('M3 enabled: handles precision boundaries (0.01 -> 1, 99.95 -> 9995, default 25.0 -> 2500)', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M3', active: true },
      });

      // 0.01 -> 1
      const resPenny = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 0.01 },
      });
      expect(resPenny.json().amount).toBe(1);

      // 99.95 -> 9995
      const resSub = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 99.95 },
      });
      expect(resSub.json().amount).toBe(9995);

      // Default amount (omitted in payload) defaults to 25.0 -> converted to 2500
      const resDefault = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: {},
      });
      expect(resDefault.json().amount).toBe(2500);
    });
  });

  // =========================================================================
  // 6. M4: Currency Flip (Payments Service)
  // =========================================================================
  describe('M4 (Currency Flip)', () => {
    it('baseline: POST /payments/charge with omitted currency defaults to USD', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 25.0 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().currency).toBe('USD');
    });

    it('M4 enabled: POST /payments/charge with omitted currency defaults to EUR instead of USD', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M4', active: true },
      });

      // Omitted currency in payload
      const res = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 25.0 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().currency).toBe('EUR');

      // Empty payload defaults to EUR
      const resEmpty = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: {},
      });
      expect(resEmpty.statusCode).toBe(200);
      expect(resEmpty.json().currency).toBe('EUR');
    });

    it('M4 enabled: preserves explicit currency if provided by caller', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M4', active: true },
      });

      const resGbp = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 50.0, currency: 'GBP' },
      });
      expect(resGbp.statusCode).toBe(200);
      expect(resGbp.json().currency).toBe('GBP');

      const resUsd = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 50.0, currency: 'USD' },
      });
      expect(resUsd.statusCode).toBe(200);
      expect(resUsd.json().currency).toBe('USD');
    });

    it('M3 + M4 combined: converts dollars to cents and defaults currency to EUR', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M3', active: true },
      });
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M4', active: true },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 19.99 },
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.amount).toBe(1999);
      expect(data.currency).toBe('EUR');
    });
  });

  // =========================================================================
  // 7. M5: Pagination Offset to Cursor (Search Service)
  // =========================================================================
  describe('M5 (Pagination)', () => {
    it('baseline: GET /search with offset returns 200 with offset pagination structure', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/search?offset=0&limit=10',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.items).toHaveLength(10);
      expect(data.total).toBe(100);
      expect(data.offset).toBe(0);
      expect(data.limit).toBe(10);
      expect(data).not.toHaveProperty('nextCursor');
    });

    it('M5 enabled: GET /search with offset returns 400 deprecation error', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M5', active: true },
      });

      const resWithOffset0 = await app.inject({
        method: 'GET',
        url: '/search?offset=0',
      });
      expect(resWithOffset0.statusCode).toBe(400);
      expect(resWithOffset0.json()).toEqual({
        error: 'offset pagination deprecated; cursor required',
        requiredHeaderOrParam: 'cursor',
      });

      const resWithOffsetAndLimit = await app.inject({
        method: 'GET',
        url: '/search?offset=20&limit=10',
      });
      expect(resWithOffsetAndLimit.statusCode).toBe(400);
      expect(resWithOffsetAndLimit.json()).toEqual({
        error: 'offset pagination deprecated; cursor required',
        requiredHeaderOrParam: 'cursor',
      });
    });

    it('M5 enabled: GET /search without offset returns items and base64 nextCursor', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M5', active: true },
      });

      // Initial page request (no offset, no cursor)
      const res = await app.inject({
        method: 'GET',
        url: '/search',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();

      expect(data.items).toHaveLength(20);
      expect(data.items[0].id).toBe('item_1');
      expect(data.items[19].id).toBe('item_20');
      expect(data.total).toBe(100);

      // Verify nextCursor is a valid base64 encoded string representing index 20
      expect(typeof data.nextCursor).toBe('string');
      const decodedCursor = Buffer.from(data.nextCursor, 'base64').toString('ascii');
      expect(decodedCursor).toBe('20');
    });

    it('M5 enabled: allows traversing full dataset using base64 cursor', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M5', active: true },
      });

      // Page 1
      const page1Res = await app.inject({
        method: 'GET',
        url: '/search',
      });
      const cursor1 = page1Res.json().nextCursor;
      expect(cursor1).toBeTruthy();

      // Page 2
      const page2Res = await app.inject({
        method: 'GET',
        url: `/search?cursor=${cursor1}`,
      });
      expect(page2Res.statusCode).toBe(200);
      const page2Data = page2Res.json();
      expect(page2Data.items).toHaveLength(20);
      expect(page2Data.items[0].id).toBe('item_21');
      expect(page2Data.items[19].id).toBe('item_40');

      // Final page: cursor for offset 80 (items 81-100)
      const cursorFinal = Buffer.from('80').toString('base64');
      const pageFinalRes = await app.inject({
        method: 'GET',
        url: `/search?cursor=${cursorFinal}`,
      });
      expect(pageFinalRes.statusCode).toBe(200);
      const finalData = pageFinalRes.json();
      expect(finalData.items).toHaveLength(20);
      expect(finalData.items[0].id).toBe('item_81');
      expect(finalData.items[19].id).toBe('item_100');
      expect(finalData.nextCursor).toBeNull();
    });
  });

  // =========================================================================
  // 8. M6: Silent Truncation (Search Service)
  // =========================================================================
  describe('M6 (Silent Truncation)', () => {
    it('baseline: GET /search with limit=100 returns 100 items', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/search?limit=100',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.limit).toBe(100);
      expect(data.items).toHaveLength(100);
    });

    it('M6 enabled: GET /search with limit=100 silently truncates items to 20', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M6', active: true },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/search?limit=100',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.limit).toBe(20);
      expect(data.items).toHaveLength(20);
      expect(data.total).toBe(100);
      expect(data.items[0].id).toBe('item_1');
      expect(data.items[19].id).toBe('item_20');
    });

    it('M6 enabled: GET /search without explicit limit silently truncates default 100 to 20', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M6', active: true },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/search',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.limit).toBe(20);
      expect(data.items).toHaveLength(20);
    });

    it('M6 enabled: limit <= 20 is not truncated (e.g. limit=10, limit=20)', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M6', active: true },
      });

      const res10 = await app.inject({
        method: 'GET',
        url: '/search?limit=10',
      });
      expect(res10.statusCode).toBe(200);
      expect(res10.json().limit).toBe(10);
      expect(res10.json().items).toHaveLength(10);

      const res20 = await app.inject({
        method: 'GET',
        url: '/search?limit=20',
      });
      expect(res20.statusCode).toBe(200);
      expect(res20.json().limit).toBe(20);
      expect(res20.json().items).toHaveLength(20);

      const res21 = await app.inject({
        method: 'GET',
        url: '/search?limit=21',
      });
      expect(res21.statusCode).toBe(200);
      expect(res21.json().limit).toBe(20);
      expect(res21.json().items).toHaveLength(20);
    });

    it('M6 enabled: preserves offset while silently truncating limit', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M6', active: true },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/search?offset=40&limit=100',
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.offset).toBe(40);
      expect(data.limit).toBe(20);
      expect(data.items).toHaveLength(20);
      expect(data.items[0].id).toBe('item_41');
      expect(data.items[19].id).toBe('item_60');
    });
  });

  // =========================================================================
  // 9. M7: Webhook Flattening (Notifications Service)
  // =========================================================================
  describe('M7 (Webhook Flattening)', () => {
    it('baseline: POST /notifications/webhook nests event object ({ event: { type, id } })', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/notifications/webhook',
        payload: { event: { type: 'order.placed', id: 'evt_101' } },
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();

      expect(data).toHaveProperty('event');
      expect(data.event).toEqual({
        type: 'order.placed',
        id: 'evt_101',
      });
      expect(data).not.toHaveProperty('type');
      expect(data.received).toBe(true);
      expect(typeof data.timestamp).toBe('number');
    });

    it('M7 enabled: POST /notifications/webhook flattens { event: { type: "order.placed" } } into top-level type: "order.placed"', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M7', active: true },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/notifications/webhook',
        payload: { event: { type: 'order.placed', id: 'evt_202' } },
      });
      expect(res.statusCode).toBe(200);
      const data = res.json();

      expect(data.type).toBe('order.placed');
      expect(data.id).toBe('evt_202');
      expect(data).not.toHaveProperty('event');
      expect(data.received).toBe(true);
      expect(typeof data.timestamp).toBe('number');
    });

    it('M7 enabled: handles payloads without nested event object via top-level fallback', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M7', active: true },
      });

      const resFallback = await app.inject({
        method: 'POST',
        url: '/notifications/webhook',
        payload: { type: 'payment.success', id: 'evt_303' },
      });
      expect(resFallback.statusCode).toBe(200);
      const data = resFallback.json();
      expect(data.type).toBe('payment.success');
      expect(data.id).toBe('evt_303');
      expect(data).not.toHaveProperty('event');
    });

    it('M7 enabled: handles empty body with default fallback fields', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M7', active: true },
      });

      const resEmpty = await app.inject({
        method: 'POST',
        url: '/notifications/webhook',
        payload: {},
      });
      expect(resEmpty.statusCode).toBe(200);
      const data = resEmpty.json();
      expect(data.type).toBe('unknown_event');
      expect(data.id).toBe('evt_0');
      expect(data.received).toBe(true);
    });
  });

  // =========================================================================
  // 10. M8: Rate Limit (Payments Service)
  // =========================================================================
  describe('M8 (Rate Limit)', () => {
    it('baseline: allows more than 5 requests in a 1 second window without throttling', async () => {
      for (let i = 0; i < 8; i++) {
        const res = await app.inject({
          method: 'POST',
          url: '/payments/charge',
          payload: { amount: 10.0 },
        });
        expect(res.statusCode).toBe(200);
      }
    });

    it('M8 enabled: returns status 429 and Retry-After header after 5 requests in 1 second window', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M8', active: true },
      });

      // First 5 requests must succeed with 200
      for (let i = 1; i <= 5; i++) {
        const resOk = await app.inject({
          method: 'POST',
          url: '/payments/charge',
          payload: { amount: 15.0 },
        });
        expect(resOk.statusCode).toBe(200);
      }

      // 6th request must trigger 429
      const resThrottled = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 15.0 },
      });
      expect(resThrottled.statusCode).toBe(429);
      expect(resThrottled.headers['retry-after']).toBe('2');
      expect(resThrottled.headers['x-ratelimit-limit']).toBe('5');
      expect(resThrottled.headers['x-ratelimit-remaining']).toBe('0');
      expect(resThrottled.json()).toEqual({
        error: 'Too Many Requests',
        retry_after_seconds: 2,
      });

      // 7th request also throttled
      const resThrottledNext = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 15.0 },
      });
      expect(resThrottledNext.statusCode).toBe(429);
      expect(resThrottledNext.headers['retry-after']).toBe('2');
    });

    it('M8 enabled: simultaneous request burst throttles properly', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M8', active: true },
      });

      // Send 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        app.inject({
          method: 'POST',
          url: '/payments/charge',
          payload: { amount: 20.0 },
        })
      );
      const responses = await Promise.all(promises);

      const status200Count = responses.filter((r) => r.statusCode === 200).length;
      const status429Count = responses.filter((r) => r.statusCode === 429).length;

      expect(status200Count).toBe(5);
      expect(status429Count).toBe(5);

      for (const res of responses.filter((r) => r.statusCode === 429)) {
        expect(res.headers['retry-after']).toBe('2');
        expect(res.headers['x-ratelimit-limit']).toBe('5');
        expect(res.headers['x-ratelimit-remaining']).toBe('0');
        expect(res.json().retry_after_seconds).toBe(2);
      }
    });
  });

  // =========================================================================
  // 11. M9: MCP Tool Drift (MCP Tool Service)
  // =========================================================================
  describe('M9 (MCP Tool Drift)', () => {
    it('baseline: POST /mcp-tool/execute with legacy query succeeds with 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/mcp-tool/execute',
        payload: { query: 'shoes' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        result: 'Matched records for query: shoes',
        status: 'completed',
      });

      // Default baseline query when body is empty
      const resEmpty = await app.inject({
        method: 'POST',
        url: '/mcp-tool/execute',
        payload: {},
      });
      expect(resEmpty.statusCode).toBe(200);
      expect(resEmpty.json().result).toBe('Matched records for query: default');
    });

    it('M9 enabled: POST /mcp-tool/execute with legacy query rejects with 400', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M9', active: true },
      });

      // Legacy payload using 'query' instead of 'q'
      const resLegacy = await app.inject({
        method: 'POST',
        url: '/mcp-tool/execute',
        payload: { query: 'shoes' },
      });
      expect(resLegacy.statusCode).toBe(400);
      expect(resLegacy.json()).toEqual({
        error: 'Missing required argument: q (query renamed to q)',
      });

      // Missing query entirely
      const resEmpty = await app.inject({
        method: 'POST',
        url: '/mcp-tool/execute',
        payload: {},
      });
      expect(resEmpty.statusCode).toBe(400);
      expect(resEmpty.json()).toEqual({
        error: 'Missing required argument: q (query renamed to q)',
      });
    });

    it('M9 enabled: POST /mcp-tool/execute with q but missing limit rejects with 400', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M9', active: true },
      });

      const resMissingLimit = await app.inject({
        method: 'POST',
        url: '/mcp-tool/execute',
        payload: { q: 'shoes' },
      });
      expect(resMissingLimit.statusCode).toBe(400);
      expect(resMissingLimit.json()).toEqual({
        error: 'Missing required argument: limit is now required',
      });
    });

    it('M9 enabled: POST /mcp-tool/execute with { q: "shoes", limit: 5 } succeeds with 200', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M9', active: true },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/mcp-tool/execute',
        payload: { q: 'shoes', limit: 5 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        result: 'Matched 5 records for query: shoes',
        status: 'completed',
      });
    });

    it('M9 enabled: boundary limit=0 is accepted as valid integer', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M9', active: true },
      });

      const resZero = await app.inject({
        method: 'POST',
        url: '/mcp-tool/execute',
        payload: { q: 'sandals', limit: 0 },
      });
      expect(resZero.statusCode).toBe(200);
      expect(resZero.json()).toEqual({
        result: 'Matched 0 records for query: sandals',
        status: 'completed',
      });
    });

    it('M9 enabled: handles unicode and special characters in q parameter', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M9', active: true },
      });

      const unicodeQuery = '👟 靴 100% #1';
      const res = await app.inject({
        method: 'POST',
        url: '/mcp-tool/execute',
        payload: { q: unicodeQuery, limit: 12 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        result: `Matched 12 records for query: ${unicodeQuery}`,
        status: 'completed',
      });
    });
  });

  // =========================================================================
  // 12. M10: Enum Semantics (Users Service)
  // =========================================================================
  describe('M10 (Enum Semantics)', () => {
    it('baseline: Charlie Brown (isSuspended: true) has status: "suspended"', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/users',
      });
      expect(res.statusCode).toBe(200);
      const users = res.json();
      const charlie = users.find((u: { id: string }) => u.id === 'usr_3');
      expect(charlie).toBeDefined();
      expect(charlie.name).toBe('Charlie Brown');
      expect(charlie.status).toBe('suspended');
    });

    it('M10 enabled: GET /users returns Charlie Brown (isSuspended: true) as status: "active" instead of "suspended"', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M10', active: true },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/users',
      });
      expect(res.statusCode).toBe(200);
      const users = res.json();
      expect(users).toHaveLength(3);

      const charlie = users.find((u: { id: string }) => u.id === 'usr_3');
      expect(charlie).toBeDefined();
      expect(charlie.status).toBe('active');

      // Alice and Bob remain active
      const alice = users.find((u: { id: string }) => u.id === 'usr_1');
      expect(alice.status).toBe('active');
      const bob = users.find((u: { id: string }) => u.id === 'usr_2');
      expect(bob.status).toBe('active');
    });

    it('M10 enabled: toggling off restores Charlie Brown status to "suspended"', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M10', active: true },
      });

      // Now toggle off
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M10', active: false },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/users',
      });
      const users = res.json();
      const charlie = users.find((u: { id: string }) => u.id === 'usr_3');
      expect(charlie.status).toBe('suspended');
    });
  });

  // =========================================================================
  // 13. Combined Mutations, Boundary Invariants & False-Positive Resistance
  // =========================================================================
  describe('Combined Multi-Mutation Interactions & False-Positive Resistance', () => {
    it('combines M1 + M2 + M10: display_name formatted as "Last, First" with Charlie Brown active', async () => {
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M1', active: true },
      });
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M2', active: true },
      });
      await app.inject({
        method: 'POST',
        url: '/sim/switchboard/toggle',
        payload: { mutationId: 'M10', active: true },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/users',
      });
      expect(res.statusCode).toBe(200);
      const users = res.json();

      expect(users).toEqual([
        { id: 'usr_1', display_name: 'Walker, Alice', status: 'active' },
        { id: 'usr_2', display_name: 'Stone, Bob', status: 'active' },
        { id: 'usr_3', display_name: 'Brown, Charlie', status: 'active' },
      ]);
    });

    it('false-positive resistance: benign extra request properties do not trigger errors', async () => {
      // Payments with extra non-schema metadata
      const payRes = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: {
          amount: 50.0,
          currency: 'USD',
          customerId: 'cust_xyz',
          extraBenignField: 'harmless_data',
        },
      });
      expect(payRes.statusCode).toBe(200);
      expect(payRes.json().amount).toBe(50.0);

      // Search with benign extra query param
      const searchRes = await app.inject({
        method: 'GET',
        url: '/search?offset=0&limit=5&benignTag=true',
      });
      expect(searchRes.statusCode).toBe(200);
      expect(searchRes.json().items).toHaveLength(5);
    });

    it('full reset verification: restores baseline behavior across all services simultaneously', async () => {
      // Enable all 10 mutations
      for (const id of ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10']) {
        await app.inject({
          method: 'POST',
          url: '/sim/switchboard/toggle',
          payload: { mutationId: id, active: true },
        });
      }

      // Verify M1, M3, M5 are active before reset
      const preUsers = await app.inject({ method: 'GET', url: '/users' });
      expect(preUsers.json()[0]).toHaveProperty('display_name');

      const preSearch = await app.inject({ method: 'GET', url: '/search?offset=0' });
      expect(preSearch.statusCode).toBe(400);

      // Trigger global reset
      const resetRes = await app.inject({
        method: 'POST',
        url: '/sim/switchboard/reset',
      });
      expect(resetRes.statusCode).toBe(200);

      // Verify Users is back to baseline (name, Charlie suspended)
      const postUsers = await app.inject({ method: 'GET', url: '/users' });
      expect(postUsers.json()[0]).toHaveProperty('name', 'Alice Walker');
      expect(postUsers.json()[0]).not.toHaveProperty('display_name');
      expect(postUsers.json()[2].status).toBe('suspended');

      // Verify Payments is back to baseline (float dollars, default USD)
      const postPay = await app.inject({
        method: 'POST',
        url: '/payments/charge',
        payload: { amount: 15.5 },
      });
      expect(postPay.json().amount).toBe(15.5);
      expect(postPay.json().currency).toBe('USD');

      // Verify Search is back to baseline (offset allowed, 100 items limit)
      const postSearch = await app.inject({
        method: 'GET',
        url: '/search?offset=0&limit=100',
      });
      expect(postSearch.statusCode).toBe(200);
      expect(postSearch.json().items).toHaveLength(100);

      // Verify Webhook is back to baseline (nested event object)
      const postWebhook = await app.inject({
        method: 'POST',
        url: '/notifications/webhook',
        payload: { event: { type: 'test.event', id: '1' } },
      });
      expect(postWebhook.json()).toHaveProperty('event');
      expect(postWebhook.json().event.type).toBe('test.event');

      // Verify MCP Tool is back to baseline (accepts legacy query)
      const postMcp = await app.inject({
        method: 'POST',
        url: '/mcp-tool/execute',
        payload: { query: 'test' },
      });
      expect(postMcp.statusCode).toBe(200);
      expect(postMcp.json().result).toBe('Matched records for query: test');
    });
  });
});
