import { Change, Impact, ImpactSchema } from '@intra/shared';

export interface WorkflowDependency {
  workflowName: string;
  service: string;
  endpoint: string;
  usedFields: string[];
  filePath: string;
}

export class ImpactAnalyzer {
  private workflowGraph: Map<string, WorkflowDependency[]> = new Map();

  constructor() {
    this.registerDefaultShipwellWorkflows();
  }

  public registerDependency(dep: WorkflowDependency): void {
    const key = `${dep.service.toLowerCase()}:${dep.endpoint.toLowerCase()}`;
    const list = this.workflowGraph.get(key) || [];
    list.push(dep);
    this.workflowGraph.set(key, list);
  }

  private registerDefaultShipwellWorkflows(): void {
    // Shipwell default workflows
    this.registerDependency({
      workflowName: 'checkout',
      service: 'payments',
      endpoint: '/payments/charge',
      usedFields: ['amount', 'currency', 'status'],
      filePath: 'apps/demo-app/src/workflows/checkout.ts',
    });

    this.registerDependency({
      workflowName: 'userProfile',
      service: 'users',
      endpoint: '/users',
      usedFields: ['id', 'name', 'status'],
      filePath: 'apps/demo-app/src/workflows/userProfile.ts',
    });

    this.registerDependency({
      workflowName: 'searchBrowse',
      service: 'search',
      endpoint: '/search',
      usedFields: ['items', 'total', 'offset', 'limit'],
      filePath: 'apps/demo-app/src/workflows/searchBrowse.ts',
    });

    this.registerDependency({
      workflowName: 'notificationAck',
      service: 'notifications',
      endpoint: '/notifications/webhook',
      usedFields: ['event.type', 'event.id'],
      filePath: 'apps/demo-app/src/workflows/notifications.ts',
    });

    this.registerDependency({
      workflowName: 'mcpAssistantCall',
      service: 'mcp-tool',
      endpoint: '/mcp-tool/execute',
      usedFields: ['query', 'result'],
      filePath: 'apps/demo-app/src/workflows/mcpAssistant.ts',
    });
  }

  public analyze(change: Change): Impact {
    const key = `${change.service.toLowerCase()}:${change.endpoint.toLowerCase()}`;
    const deps = this.workflowGraph.get(key) || [];

    const affectedWorkflows: string[] = [];
    const fieldPaths: string[] = [];
    const dependencyChain: string[] = [];

    // Extract changed field name
    let changedField = '';
    if (change.before && typeof change.before === 'object' && 'field' in change.before) {
      changedField = String((change.before as Record<string, unknown>).field);
    } else if (change.kind === 'rename') {
      changedField = 'name';
    } else if (change.kind === 'unit_shift') {
      changedField = 'amount';
    } else if (change.kind === 'pagination_changed') {
      changedField = 'offset';
    }

    for (const dep of deps) {
      const isAffected =
        !changedField ||
        dep.usedFields.includes(changedField) ||
        change.kind === 'pagination_changed' ||
        change.kind === 'rate_limit_changed' ||
        change.kind === 'enum_semantics';

      if (isAffected) {
        if (!affectedWorkflows.includes(dep.workflowName)) {
          affectedWorkflows.push(dep.workflowName);
        }
        if (changedField && !fieldPaths.includes(`${change.service}.${changedField}`)) {
          fieldPaths.push(`${change.service}.${changedField}`);
        }
        dependencyChain.push(`${dep.filePath} -> depends on [${dep.service}:${dep.endpoint}]`);
      }
    }

    let severity: Impact['severity'] = 'medium';
    if (change.semanticVerdict === 'breaking') {
      severity = 'critical';
    } else if (affectedWorkflows.length >= 2 || change.semanticVerdict === 'lossy') {
      severity = 'high';
    } else if (change.semanticVerdict === 'equivalent') {
      severity = 'low';
    }

    // Elevate severity if route touches critical financial or ledger pathways
    severity = annotateCriticality(change.service, change.endpoint, severity);

    const impact: Impact = {
      changeId: change.id,
      affectedWorkflows,
      fieldPaths: fieldPaths.length > 0 ? fieldPaths : [`${change.service}:${change.endpoint}`],
      severity,
      dependencyChain,
    };

    ImpactSchema.parse(impact);
    return impact;
  }
}

/**
 * Checks if a service or endpoint belongs to sensitive financial processing.
 */
export function isFinancialOrPaymentRoute(service: string, endpoint: string): boolean {
  const normService = service.toLowerCase();
  const normEndpoint = endpoint.toLowerCase();
  const financialKeywords = ['payment', 'charge', 'billing', 'invoice', 'ledger', 'checkout', 'payout'];
  return financialKeywords.some(kw => normService.includes(kw) || normEndpoint.includes(kw));
}

/**
 * Annotates severity to critical if financial pathway is impacted by non-equivalent drift.
 */
export function annotateCriticality(
  service: string,
  endpoint: string,
  currentSeverity: Impact['severity']
): Impact['severity'] {
  if (isFinancialOrPaymentRoute(service, endpoint)) {
    if (currentSeverity === 'high' || currentSeverity === 'medium') {
      return 'critical';
    }
  }
  return currentSeverity;
}
