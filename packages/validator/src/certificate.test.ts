import { describe, it, expect } from 'vitest';
import { issueReplayCertificate, verifyCertificate } from './certificate.js';

describe('@intra/validator Replay Certificate Verification Stamp', () => {
  it('issues CERTIFIED stamp when 100% golden pass rate and promote decision met', () => {
    const cert = issueReplayCertificate({
      adapterId: 'adp_users_101',
      changeId: 'chg_ren_01',
      service: 'users',
      endpoint: '/users/profile',
      totalVectorsTested: 100,
      goldenPassRate: 1.0,
      sprtDecision: 'promote',
      sprtSampleCount: 150,
      sprtErrorRate: 0.002,
    });

    expect(cert.status).toBe('CERTIFIED');
    expect(cert.signatureHex).toHaveLength(64);
    expect(verifyCertificate(cert)).toBe(true);
  });

  it('issues REJECTED stamp when golden pass rate is below 100%', () => {
    const cert = issueReplayCertificate({
      adapterId: 'adp_users_102',
      changeId: 'chg_ren_02',
      service: 'users',
      endpoint: '/users/profile',
      totalVectorsTested: 100,
      goldenPassRate: 0.95, // failed 5 vectors
      sprtDecision: 'promote',
      sprtSampleCount: 150,
      sprtErrorRate: 0.05,
    });

    expect(cert.status).toBe('REJECTED');
    expect(verifyCertificate(cert)).toBe(true); // structurally valid signature but status is REJECTED
  });
});
