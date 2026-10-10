import { describe, it, expect } from 'vitest';
import { IntraClient } from './client.js';

describe('@intra/sdk Client Adapter Routing', () => {
  it('applies registered adapter to response transparently', () => {
    const client = new IntraClient({ engineUrl: 'http://localhost:3001' });

    // Register M1 rename adapter
    client.registerAdapter('/users', (data: any) => {
      return data.map((item: any) => ({
        ...item,
        name: item.display_name ?? item.name,
      }));
    });

    const mutatedResponse = [{ id: '1', display_name: 'Alice' }];
    const adapted = client.adaptResponse('/users', mutatedResponse);
    expect(adapted[0].name).toBe('Alice');
  });

  it('passes through untouched if no adapter is registered', () => {
    const client = new IntraClient({ engineUrl: 'http://localhost:3001' });
    const original = { amount: 10.5 };
    const res = client.adaptResponse('/payments', original);
    expect(res).toEqual(original);
  });
});
