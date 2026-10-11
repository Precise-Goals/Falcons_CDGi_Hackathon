export interface MutationItem {
  id: string;
  name: string;
  service: string;
  endpoint: string;
  desc: string;
  kind: string;
  active: boolean;
  confidence: number;
  verdict: 'equivalent' | 'lossy' | 'breaking' | 'unknown';
  adapted: boolean;
  brokenError: string;
  adaptedSuccess: string;
  beforeSnippet: string;
  afterSnippet: string;
  adapterCode: string;
  workflow: string;
  workflowFile: string;
}

export interface PredictedUpgrade {
  path: string;
  type: string;
  risk: 'HIGH' | 'MEDIUM' | 'CRITICAL' | 'LOW';
  probability: number;
  currentValue: any;
  predictedShift: string;
  rationale: string;
  preemptiveAdapter: string;
}

export interface EngineHealthResponse {
  status: string;
  uptime: number;
  dependencies: Record<string, string>;
  rateLimitHeadroom: Record<string, number>;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  tier: 'free' | 'starter' | 'business';
  nftLimit: number;
  walletAddress?: string;
  walletSignature?: string;
  mstBalance?: string;
  idToken: string;
  mappedAt?: string;
  activeTokenId?: number;
  activeTokenUri?: string;
}

export type MainTab = 'home' | 'agent' | 'mcp' | 'sdk' | 'docs' | 'pricing' | 'dashboard' | 'eval' | 'trigger';
export type DashboardSubView = 'graph' | 'predict' | 'drift' | 'pipeline' | 'impact' | 'adapters' | 'switchboard' | 'resilience';
export type DocsCategory = 'docs' | 'terms' | 'research';
export type AgentMode = 'ask' | 'plan';

export interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  mode: AgentMode;
  sha?: string;
  planSteps?: string[];
}

export interface MstcPurchaseSuccess {
  txHash: string;
  checksum: string;
  plan: string;
  amountMstc: string;
  tokenId?: number;
  tokenUri?: string;
}
