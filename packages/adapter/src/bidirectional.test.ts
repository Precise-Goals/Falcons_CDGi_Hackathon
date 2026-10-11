import { describe, it, expect } from 'vitest';
import { createBiDirectionalAdapter } from './bidirectional.js';

describe('@intra/adapter Bi-directional Transformation', () => {
  interface ClientSearchRequest {
    query: string;
    maxResults: number;
  }

  interface ServiceSearchRequest {
    q: string;
    limit: number;
  }

  interface ServiceSearchResponse {
    results: Array<{ id: string; title: string }>;
    total_count: number;
  }

  interface ClientSearchResponse {
    items: Array<{ id: string; title: string }>;
    total: number;
  }

  const searchAdapter = createBiDirectionalAdapter<
    ClientSearchRequest,
    ServiceSearchRequest,
    ServiceSearchResponse,
    ClientSearchResponse
  >({
    name: 'search_v1_to_v2_adapter',
    service: 'search',
    endpoint: '/search',
    transformRequest: (clientReq) => ({
      q: clientReq.query,
      limit: clientReq.maxResults,
    }),
    transformResponse: (serviceRes) => ({
      items: serviceRes.results,
      total: serviceRes.total_count,
    }),
    metadata: { version: '2.0.0' },
  });

  it('adapts outbound client request into upstream drifted service schema', () => {
    const clientReq: ClientSearchRequest = { query: 'logistics fleet', maxResults: 25 };
    const upstreamReq = searchAdapter.adaptRequest(clientReq);

    expect(upstreamReq).toEqual({
      q: 'logistics fleet',
      limit: 25,
    });
  });

  it('adapts inbound upstream service response back into expected client schema', () => {
    const serviceRes: ServiceSearchResponse = {
      results: [
        { id: 'item_1', title: 'Container Carrier 101' },
        { id: 'item_2', title: 'Forklift AGV 202' },
      ],
      total_count: 2,
    };

    const clientRes = searchAdapter.adaptResponse(serviceRes);
    expect(clientRes).toEqual({
      items: [
        { id: 'item_1', title: 'Container Carrier 101' },
        { id: 'item_2', title: 'Forklift AGV 202' },
      ],
      total: 2,
    });
  });

  it('supports inverter for simulation gateway mock pairing', () => {
    const inverted = searchAdapter.invert(
      (serviceReq) => ({ query: serviceReq.q, maxResults: serviceReq.limit }),
      (clientRes) => ({ results: clientRes.items, total_count: clientRes.total })
    );

    expect(inverted.name).toBe('search_v1_to_v2_adapter_inverted');
    expect(inverted.metadata.inverted).toBe(true);

    const clientReq = inverted.adaptRequest({ q: 'telemetry', limit: 5 });
    expect(clientReq).toEqual({ query: 'telemetry', maxResults: 5 });

    const serviceRes = inverted.adaptResponse({ items: [], total: 0 });
    expect(serviceRes).toEqual({ results: [], total_count: 0 });
  });
});
