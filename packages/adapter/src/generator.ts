import {
  Adapter,
  AdapterSchema,
  Change,
  MigrationProposal,
  MigrationProposalSchema,
} from '@intra/shared';

export type PolicyAction =
  | 'auto_apply'
  | 'open_migration_pr'
  | 'quarantine_alert'
  | 'circuit_break';

export interface HandlingDecision {
  action: PolicyAction;
  adapter?: Adapter;
  proposal?: MigrationProposal;
  rollbackHandle?: string;
  rationale: string;
}

export class SafeHandlingEngine {
  public evaluate(change: Change): HandlingDecision {
    const rollbackHandle = `rollback_${change.id}_${Date.now()}`;

    // Policy Rule: breaking (no mapping) -> circuit break
    if (change.semanticVerdict === 'breaking') {
      const proposal = this.generateProposal(change, undefined);
      return {
        action: 'circuit_break',
        proposal,
        rollbackHandle,
        rationale: `Breaking change detected with no safe automated mapping. Circuit breaker tripped.`,
      };
    }

    // Policy Rule 1: confidence >= 0.90 AND equivalent -> auto-apply
    if (change.confidence >= 0.9 && change.semanticVerdict === 'equivalent') {
      const adapter = this.generateAdapter(change, rollbackHandle);
      return {
        action: 'auto_apply',
        adapter,
        rollbackHandle,
        rationale: `High confidence (${change.confidence}) equivalent drift: safe to auto-apply via canary.`,
      };
    }

    // Policy Rule 2: 0.70 <= confidence < 0.90 OR lossy -> proposal PR
    if (
      (change.confidence >= 0.7 && change.confidence < 0.9) ||
      change.semanticVerdict === 'lossy'
    ) {
      const adapter = this.generateAdapter(change, rollbackHandle);
      const proposal = this.generateProposal(change, adapter);
      return {
        action: 'open_migration_pr',
        adapter,
        proposal,
        rollbackHandle,
        rationale: `Confidence ${change.confidence} or lossy verdict: requires human-reviewed migration proposal.`,
      };
    }

    // Policy Rule 4: confidence < 0.70 or unknown -> quarantine & alert
    const proposal = this.generateProposal(change, undefined);
    return {
      action: 'quarantine_alert',
      proposal,
      rollbackHandle,
      rationale: `Unknown verdict or low confidence (${change.confidence}). Quarantined to prevent data corruption.`,
    };
  }

  private generateAdapter(change: Change, rollbackHandle: string): Adapter {
    let strategy: Adapter['strategy'] = 'rename';
    let code = '';
    let tests = '';

    if (change.kind === 'rename') {
      strategy = 'rename';
      code = `
// Adapter for ${change.service} ${change.endpoint} [${change.id}]
export function adaptResponse(data) {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      name: item.display_name ?? item.name
    }));
  }
  return { ...data, name: data.display_name ?? data.name };
}
`.trim();
      tests = `
it('maps display_name back to name seamlessly', () => {
  const mutated = [{ id: '1', display_name: 'Alice' }];
  const adapted = adaptResponse(mutated);
  expect(adapted[0].name).toBe('Alice');
});
`.trim();
    } else if (change.kind === 'unit_shift') {
      strategy = 'transform';
      code = `
// Adapter for ${change.service} ${change.endpoint} [${change.id}]
export function adaptResponse(data) {
  return {
    ...data,
    amount: typeof data.amount === 'number' ? data.amount * 0.01 : data.amount
  };
}
`.trim();
      tests = `
it('converts cents back to dollars', () => {
  const mutated = { id: 'c1', amount: 2500 };
  const adapted = adaptResponse(mutated);
  expect(adapted.amount).toBe(25.0);
});
`.trim();
    } else if (change.kind === 'pagination_changed') {
      strategy = 'pagination-normalize';
      code = `
// Adapter for ${change.service} ${change.endpoint} [${change.id}]
export function adaptRequest(params) {
  if (params.offset !== undefined && !params.cursor) {
    const cursor = Buffer.from(String(params.offset)).toString('base64');
    return { ...params, cursor };
  }
  return params;
}
`.trim();
      tests = `
it('normalizes legacy offset parameter to cursor token', () => {
  const adapted = adaptRequest({ offset: 20 });
  expect(adapted.cursor).toBeDefined();
});
`.trim();
    } else {
      strategy = 'default-inject';
      code = `
export function adaptResponse(data) {
  return { ...data };
}
`.trim();
      tests = `it('passes through', () => {});`;
    }

    const adapter: Adapter = {
      id: `adp_${change.id}_v1`,
      changeId: change.id,
      strategy,
      code,
      tests,
      rollbackHandle,
      appliedAt: new Date().toISOString(),
    };

    AdapterSchema.parse(adapter);
    return adapter;
  }

  private generateProposal(change: Change, adapter?: Adapter): MigrationProposal {
    const diff = adapter
      ? `+++ generated adapter (${adapter.strategy})\n${adapter.code}`
      : `--- Breaking change: manual migration required for ${change.service}:${change.endpoint}`;

    const proposal: MigrationProposal = {
      id: `prop_${change.id}`,
      changeId: change.id,
      diff,
      rationale: `Automated detection detected ${change.kind} in ${change.service}. Semantic verdict: ${change.semanticVerdict}.`,
      riskAssessment:
        change.semanticVerdict === 'breaking'
          ? 'HIGH: Potential data divergence if not reviewed by engineering.'
          : 'MEDIUM: Semantic format shift may affect downstream components.',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    MigrationProposalSchema.parse(proposal);
    return proposal;
  }
}
