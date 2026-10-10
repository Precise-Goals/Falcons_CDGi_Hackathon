import { describe, it, expect } from 'vitest';
import { ObservationCollector } from './collector.js';
import { redactHeaders, redactPayload } from './redact.js';

describe('Observation Collector & PII Redactor', () => {
  it('redacts sensitive headers like authorization and cookie', () => {
    const rawHeaders = {
      authorization: 'Bearer secret_token_xyz',
      cookie: 'session_id=12345',
      'content-type': 'application/json',
      'x-custom': 'public-info',
    };

    const redacted = redactHeaders(rawHeaders);
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.cookie).toBe('[REDACTED]');
    expect(redacted['content-type']).toBe('application/json');
    expect(redacted['x-custom']).toBe('public-info');
  });

  it('redacts sensitive payload keys recursively', () => {
    const payload = {
      user: {
        id: 'usr_1',
        password: 'mySuperSecretPassword',
        profile: {
          token: 'jwt.token.here',
          email: 'test@example.com',
        },
      },
    };

    const redacted = redactPayload(payload) as typeof payload;
    expect(redacted.user.password).toBe('[REDACTED]');
    expect(redacted.user.profile.token).toBe('[REDACTED]');
    expect(redacted.user.id).toBe('usr_1');
    expect(redacted.user.profile.email).toBe('test@example.com');
  });

  it('records valid observations into collector buffer', () => {
    const collector = new ObservationCollector(10);
    const obs = collector.record({
      service: 'users',
      endpoint: '/users',
      method: 'GET',
      status: 200,
      headers: { authorization: 'Bearer secret' },
      body: [{ id: '1', name: 'Alice' }],
      latencyMs: 14,
    });

    expect(obs.headers.authorization).toBe('[REDACTED]');
    expect(collector.getByService('users').length).toBe(1);
    expect(collector.getAll().length).toBe(1);
  });
});
