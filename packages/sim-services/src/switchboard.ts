export interface MutationState {
  id: string;
  name: string;
  service: string;
  active: boolean;
  description: string;
}

export class Switchboard {
  private mutations: Map<string, MutationState> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    const catalog: Omit<MutationState, 'active'>[] = [
      {
        id: 'M1',
        name: 'Field Rename',
        service: 'users',
        description: 'GET /users field name -> display_name',
      },
      {
        id: 'M2',
        name: 'Name Format Shift',
        service: 'users',
        description: 'name now "Last, First" instead of "First Last"',
      },
      {
        id: 'M3',
        name: 'Amount Unit Shift',
        service: 'payments',
        description: 'amount from dollars (float) to cents (int)',
      },
      {
        id: 'M4',
        name: 'Default Currency Flip',
        service: 'payments',
        description: 'default currency flips USD -> EUR when omitted',
      },
      {
        id: 'M5',
        name: 'Pagination Offset to Cursor',
        service: 'search',
        description: 'pagination offset -> opaque cursor',
      },
      {
        id: 'M6',
        name: 'Silent Result Truncation',
        service: 'search',
        description: 'silently caps page size 100 -> 20',
      },
      {
        id: 'M7',
        name: 'Webhook Event Flattening',
        service: 'notifications',
        description: 'payload nests event.type -> type',
      },
      {
        id: 'M8',
        name: 'Rate Limit 429 Throttle',
        service: 'payments',
        description: '429 begins at 5 rps with new Retry-After shape',
      },
      {
        id: 'M9',
        name: 'Tool Signature Argument Drift',
        service: 'mcp-tool',
        description: 'tool arg query -> q, plus new required limit',
      },
      {
        id: 'M10',
        name: 'Enum Semantic Drift',
        service: 'users',
        description: 'status enum value active includes suspended users',
      },
    ];

    for (const item of catalog) {
      this.mutations.set(item.id, { ...item, active: false });
    }
  }

  public isEnabled(id: string): boolean {
    return this.mutations.get(id)?.active ?? false;
  }

  public toggle(id: string, active: boolean): boolean {
    const m = this.mutations.get(id);
    if (!m) return false;
    m.active = active;
    return true;
  }

  public list(): MutationState[] {
    return Array.from(this.mutations.values());
  }

  public resetAll(): void {
    for (const m of this.mutations.values()) {
      m.active = false;
    }
  }
}
