import { IntraClient } from '@intra/sdk';

export interface WorkflowResult {
  name: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export class ShipwellApp {
  public client: IntraClient;
  private simBaseUrl: string;

  constructor(simBaseUrl = 'http://localhost:4000', engineUrl = 'http://localhost:3001') {
    this.simBaseUrl = simBaseUrl;
    this.client = new IntraClient({ engineUrl });
  }

  // 1. User Profile Workflow (dependent on GET /users -> name)
  public async runUserProfileWorkflow(): Promise<WorkflowResult> {
    try {
      const res = await fetch(`${this.simBaseUrl}/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawData = await res.json();

      // Pass through Intra SDK adapter if registered
      const adapted = this.client.adaptResponse('/users', rawData);

      // Shipwell strict requirement: user object must contain `name`
      if (!Array.isArray(adapted) || !adapted[0] || !adapted[0].name) {
        throw new Error("Shipwell parsing error: expected field 'name' was missing or null");
      }

      return {
        name: 'userProfile',
        success: true,
        data: adapted[0],
      };
    } catch (err: any) {
      return {
        name: 'userProfile',
        success: false,
        error: err.message,
      };
    }
  }

  // 2. Checkout Workflow (dependent on POST /payments/charge -> amount in dollars float)
  public async runCheckoutWorkflow(amount = 25.0): Promise<WorkflowResult> {
    try {
      const res = await fetch(`${this.simBaseUrl}/payments/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawData = await res.json();

      const adapted = this.client.adaptResponse('/payments/charge', rawData);

      // Shipwell expects amount to be in reasonable dollars range (<100 for a 25 dollar charge)
      if (adapted.amount > 100) {
        throw new Error(
          `Shipwell payment error: expected amount in dollars, but received ${adapted.amount}`
        );
      }

      return {
        name: 'checkout',
        success: true,
        data: adapted,
      };
    } catch (err: any) {
      return {
        name: 'checkout',
        success: false,
        error: err.message,
      };
    }
  }

  // 3. Search Browse Workflow (dependent on GET /search?offset=0)
  public async runSearchWorkflow(): Promise<WorkflowResult> {
    try {
      const res = await fetch(`${this.simBaseUrl}/search?offset=0&limit=10`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return {
        name: 'searchBrowse',
        success: true,
        data,
      };
    } catch (err: any) {
      return {
        name: 'searchBrowse',
        success: false,
        error: err.message,
      };
    }
  }

  // 4. Run all workflows
  public async runAll(): Promise<Record<string, WorkflowResult>> {
    const userProfile = await this.runUserProfileWorkflow();
    const checkout = await this.runCheckoutWorkflow();
    const searchBrowse = await this.runSearchWorkflow();

    return {
      userProfile,
      checkout,
      searchBrowse,
    };
  }
}
