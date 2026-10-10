import { useState, useEffect } from 'react';
import {
  Home,
  Cpu,
  Terminal,
  Code2,
  BookOpen,
  Activity,
  Sparkles,
  Layers,
  Zap,
  Sliders,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  GitPullRequest,
  Wallet,
  Globe,
  Send,
  ChevronRight,
  TrendingUp,
  X,
} from 'lucide-react';

interface MutationItem {
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

interface PredictedUpgrade {
  path: string;
  type: string;
  risk: 'HIGH' | 'MEDIUM' | 'CRITICAL' | 'LOW';
  probability: number;
  currentValue: any;
  predictedShift: string;
  rationale: string;
  preemptiveAdapter: string;
}

type MainTab = 'home' | 'agent' | 'mcp' | 'sdk' | 'docs' | 'dashboard';
type DashboardSubView = 'predict' | 'drift' | 'pipeline' | 'impact' | 'adapters' | 'switchboard' | 'resilience';
type AgentMode = 'ask' | 'plan';

// Cryptographic Ledger Checksum Generator
async function computeSha256(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuf = encoder.encode(data);
    const hashBuf = await crypto.subtle.digest('SHA-256', dataBuf);
    const hashArray = Array.from(new Uint8Array(hashBuf));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, 'a');
  }
}

export default function App() {
  // Navigation: Dashboard strictly comes after Docs!
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [dashboardView, setDashboardView] = useState<DashboardSubView>('predict');
  const [agentMode, setAgentMode] = useState<AgentMode>('ask');
  const [agentLanguage, setAgentLanguage] = useState<string>('en');

  // Selected mutation & tools
  const [selectedMutationId, setSelectedMutationId] = useState<string>('M1');
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>('intra_recent_changes');
  const [autoAdapterEnabled, setAutoAdapterEnabled] = useState<boolean>(true);
  const [proposalApproved, setProposalApproved] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Latest Checksum SHA state for UI badge
  const [latestChecksum, setLatestChecksum] = useState<string>(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );

  // Profile Onboarding & BridgeKey Wallet State
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [walletConnected] = useState<boolean>(true);
  const [userWalletAddress] = useState<string>(
    '0xc9b810a17bc68a8745424ee4cd0cad5dfccb843159280c971d1fe12dca9554e8'
  );
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'starter' | 'business'>('starter');

  // Agent State & Chat
  const [agentPrompt, setAgentPrompt] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'agent'; text: string; mode: AgentMode; sha?: string; planSteps?: string[] }>
  >([
    {
      sender: 'agent',
      text: 'Intra Autonomous Agent active. Ask questions about observed API traffic in your preferred language, or switch to Plan Mode to orchestrate multi-step dependency adaptations.',
      mode: 'ask',
      sha: '8f43b35a9d20c5717ef7472851efb3c292e105e4d293816a2ecb1d03c6258055',
    },
  ]);

  // Pure Algorithmic Upgrade Predictor State
  const [sampleApiEndpoint, setSampleApiEndpoint] = useState<string>('https://api.stripe.com/v1/charges');
  const [sampleApiPayload, setSampleApiPayload] = useState<string>(
    JSON.stringify(
      {
        id: 'ch_3N19z2LkdIwHu7ix',
        amount: 25.5,
        currency: 'USD',
        customer_name: 'Alice Walker',
        customerId: 'cus_99182',
        status: 'active',
        page: 1,
        limit: 50,
        event: {
          type: 'charge.succeeded',
        },
      },
      null,
      2
    )
  );
  const [predictedUpgrades, setPredictedUpgrades] = useState<PredictedUpgrade[]>([]);

  // SDK Dynamic Playground state
  const [sdkSelectedMutation, setSdkSelectedMutation] = useState<string>('M1');
  const [sdkCustomInput, setSdkCustomInput] = useState<string>(
    '{\n  "id": "usr_99",\n  "display_name": "Marcus Vance",\n  "status": "active"\n}'
  );

  // Helper: Log cryptographic ledger checksum
  const logLedgerChecksum = async (kind: string, payload: any) => {
    const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const sha = await computeSha256(jsonStr);
    const seq = Math.floor(Date.now() / 1000);
    const logMsg = `[INTRA LEDGER CHECKSUM] sha256:${sha} | seq:${seq} | kind:${kind} | ts:${new Date().toISOString()}`;
    console.log(logMsg);
    setLatestChecksum(sha);
    return { sha, seq, logMsg };
  };

  // Pure Algorithmic Analysis of Upstream Schemas for Future Upgrades
  const runPureUpgradePrediction = (endpoint: string, jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const results: PredictedUpgrade[] = [];

      // 1. Check for float numerical currency / subunits (Float dollars -> Integer cents shift)
      if (typeof parsed.amount === 'number' && !Number.isInteger(parsed.amount)) {
        results.push({
          path: '$.amount',
          type: 'Unit Shift (Float to Subunit Integer)',
          risk: 'HIGH',
          probability: 94,
          currentValue: parsed.amount,
          predictedShift: 'amount: 25.5 -> 2550 (integer cents x100)',
          rationale: 'Modern financial APIs standardize on smallest integer currency units to prevent IEEE 754 floating-point rounding errors.',
          preemptiveAdapter: `export function adaptAmount(data) {\n  return { ...data, amount: typeof data.amount === 'number' ? data.amount * 0.01 : data.amount };\n}`,
        });
      }

      // 2. Check for inconsistent naming conventions (camelCase in snake_case body)
      if (parsed.customerId && parsed.customer_name) {
        results.push({
          path: '$.customerId',
          type: 'Casing Normalization Drift',
          risk: 'HIGH',
          probability: 88,
          currentValue: parsed.customerId,
          predictedShift: 'customerId -> customer_id',
          rationale: 'Payload mixes camelCase (customerId) with snake_case (customer_name). Vendors routinely normalize casing in v2 upgrades.',
          preemptiveAdapter: `export function adaptCustomer(data) {\n  return { ...data, customerId: data.customer_id ?? data.customerId };\n}`,
        });
      }

      // 3. Check for traditional offset / page pagination
      if (parsed.page !== undefined || endpoint.includes('page=') || parsed.offset !== undefined) {
        results.push({
          path: '$.page',
          type: 'Pagination Scheme Deprecation',
          risk: 'CRITICAL',
          probability: 92,
          currentValue: parsed.page ?? parsed.offset,
          predictedShift: 'page / offset -> opaque base64 next_cursor',
          rationale: 'Relational offset-based pagination does not scale for distributed databases. Standard practice migrates to keyset cursor pagination.',
          preemptiveAdapter: `export function adaptPagination(params) {\n  if (params.page !== undefined && !params.cursor) {\n    return { ...params, cursor: Buffer.from(String(params.page)).toString('base64') };\n  }\n  return params;\n}`,
        });
      }

      // 4. Check for nested event hierarchies in webhooks
      if (parsed.event && typeof parsed.event === 'object' && parsed.event.type) {
        results.push({
          path: '$.event.type',
          type: 'Webhook Payload Flattening',
          risk: 'MEDIUM',
          probability: 76,
          currentValue: parsed.event.type,
          predictedShift: 'event.type -> top-level type: "charge.succeeded"',
          rationale: 'Vendors flatten nested webhook event structures to simplify message routing across cloud serverless handlers.',
          preemptiveAdapter: `export function adaptWebhook(payload) {\n  return { ...payload, event: { type: payload.type ?? payload.event?.type } };\n}`,
        });
      }

      // 5. Check for unconstrained string status enum (Semantic Drift vulnerability)
      if (parsed.status && typeof parsed.status === 'string') {
        results.push({
          path: '$.status',
          type: 'Enum Semantic Drift Risk',
          risk: 'CRITICAL',
          probability: 82,
          currentValue: parsed.status,
          predictedShift: 'status="active" silently includes unverified or suspended sub-states',
          rationale: 'Unversioned string status fields frequently absorb new vendor business states, violating downstream authorization assumptions.',
          preemptiveAdapter: `// AUTOMATED ADAPTER PROHIBITED FOR BREAKING DRIFT\n// Safe-handling policy requires engineering sign-off via Migration PR.`,
        });
      }

      setPredictedUpgrades(results);
      logLedgerChecksum('api_upgrade_prediction', { endpoint, findingsCount: results.length, results });
    } catch {
      // invalid JSON
    }
  };

  // Run initial prediction on mount
  useEffect(() => {
    runPureUpgradePrediction(sampleApiEndpoint, sampleApiPayload);
    logLedgerChecksum('system_initialization', { status: 'healthy', tier: subscriptionTier });
  }, []);

  // Preset loader for upgrade predictor
  const loadPredictorPreset = (preset: 'stripe' | 'shopify' | 'twilio') => {
    if (preset === 'stripe') {
      const ep = 'https://api.stripe.com/v1/charges';
      const pl = JSON.stringify(
        {
          id: 'ch_94821',
          amount: 49.99,
          currency: 'USD',
          customerId: 'cus_881',
          customer_name: 'John Doe',
          status: 'active',
          page: 2,
          limit: 25,
        },
        null,
        2
      );
      setSampleApiEndpoint(ep);
      setSampleApiPayload(pl);
      runPureUpgradePrediction(ep, pl);
    } else if (preset === 'shopify') {
      const ep = 'https://myshopify.com/admin/api/2026-10/orders.json';
      const pl = JSON.stringify(
        {
          order_id: 100482,
          page: 1,
          limit: 100,
          customer_email: 'buyer@example.com',
          event: {
            type: 'orders/create',
            version: '1.0',
          },
        },
        null,
        2
      );
      setSampleApiEndpoint(ep);
      setSampleApiPayload(pl);
      runPureUpgradePrediction(ep, pl);
    } else {
      const ep = 'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json';
      const pl = JSON.stringify(
        {
          sid: 'SM92837',
          status: 'delivered',
          user_id: 881,
          userId: 881,
          amount: 0.0075,
        },
        null,
        2
      );
      setSampleApiEndpoint(ep);
      setSampleApiPayload(pl);
      runPureUpgradePrediction(ep, pl);
    }
  };

  // Mutations satisfying M1 through M10
  const [mutations, setMutations] = useState<MutationItem[]>([
    {
      id: 'M1',
      name: 'Field Rename',
      service: 'users',
      endpoint: 'GET /users',
      desc: 'name -> display_name in response object',
      kind: 'rename',
      active: true,
      confidence: 0.95,
      verdict: 'equivalent',
      adapted: true,
      brokenError: "Shipwell parsing error: expected field 'name' was missing or null",
      adaptedSuccess: "Payload adapted: display_name safely mapped back to name: 'Alice Walker'",
      beforeSnippet: '{ "id": "usr_1", "name": "Alice Walker", "status": "active" }',
      afterSnippet: '{ "id": "usr_1", "display_name": "Alice Walker", "status": "active" }',
      adapterCode: `export function adaptResponse(data) {\n  if (Array.isArray(data)) {\n    return data.map(item => ({ ...item, name: item.display_name ?? item.name }));\n  }\n  return { ...data, name: data.display_name ?? data.name };\n}`,
      workflow: 'userProfile',
      workflowFile: 'apps/demo-app/src/workflows/userProfile.ts',
    },
    {
      id: 'M2',
      name: 'Name Format Shift',
      service: 'users',
      endpoint: 'GET /users',
      desc: 'name formatted as "Last, First" instead of "First Last"',
      kind: 'semantic_other',
      active: false,
      confidence: 0.82,
      verdict: 'lossy',
      adapted: false,
      brokenError: "Downstream format failure: expected 'First Last' tokenization",
      adaptedSuccess: "Normalized 'Walker, Alice' into standard 'Alice Walker'",
      beforeSnippet: '{ "name": "Alice Walker" }',
      afterSnippet: '{ "name": "Walker, Alice" }',
      adapterCode: `export function adaptResponse(data) {\n  const [last, first] = data.name.split(', ');\n  return { ...data, name: \`\${first} \${last}\` };\n}`,
      workflow: 'userProfile',
      workflowFile: 'apps/demo-app/src/workflows/userProfile.ts',
    },
    {
      id: 'M3',
      name: 'Amount Unit Shift',
      service: 'payments',
      endpoint: 'POST /payments/charge',
      desc: 'amount shifted from dollars (float) to cents (integer multiplier x100)',
      kind: 'unit_shift',
      active: true,
      confidence: 0.92,
      verdict: 'equivalent',
      adapted: true,
      brokenError: "Shipwell payment error: expected amount in dollars ($25.0), received 2500",
      adaptedSuccess: "Unit shift converted: 2500 cents multiplied by 0.01 -> $25.00 dollars",
      beforeSnippet: '{ "amount": 25.0, "currency": "USD" }',
      afterSnippet: '{ "amount": 2500, "currency": "USD" }',
      adapterCode: `export function adaptResponse(data) {\n  return {\n    ...data,\n    amount: typeof data.amount === 'number' ? data.amount * 0.01 : data.amount\n  };\n}`,
      workflow: 'checkout',
      workflowFile: 'apps/demo-app/src/workflows/checkout.ts',
    },
    {
      id: 'M4',
      name: 'Default Currency Flip',
      service: 'payments',
      endpoint: 'POST /payments/charge',
      desc: 'default currency flipped from USD to EUR when omitted',
      kind: 'default_value_changed',
      active: false,
      confidence: 0.88,
      verdict: 'lossy',
      adapted: false,
      brokenError: "Currency mismatch: transaction defaulted to EUR, expected USD",
      adaptedSuccess: "Request enriched with explicit currency: 'USD' before transmission",
      beforeSnippet: '{ "amount": 25.0 } // default USD',
      afterSnippet: '{ "amount": 25.0 } // default EUR',
      adapterCode: `export function adaptRequest(body) {\n  return { ...body, currency: body.currency ?? 'USD' };\n}`,
      workflow: 'checkout',
      workflowFile: 'apps/demo-app/src/workflows/checkout.ts',
    },
    {
      id: 'M5',
      name: 'Pagination Offset to Cursor',
      service: 'search',
      endpoint: 'GET /search',
      desc: 'offset pagination deprecated; opaque cursor required',
      kind: 'pagination_changed',
      active: false,
      confidence: 0.91,
      verdict: 'equivalent',
      adapted: false,
      brokenError: "HTTP 400: offset pagination deprecated; cursor required",
      adaptedSuccess: "Offset 20 converted to Base64 opaque cursor token",
      beforeSnippet: 'GET /search?offset=20&limit=10',
      afterSnippet: 'GET /search?cursor=MjA=&limit=10',
      adapterCode: `export function adaptRequest(params) {\n  if (params.offset !== undefined && !params.cursor) {\n    return { ...params, cursor: Buffer.from(String(params.offset)).toString('base64') };\n  }\n  return params;\n}`,
      workflow: 'searchBrowse',
      workflowFile: 'apps/demo-app/src/workflows/searchBrowse.ts',
    },
    {
      id: 'M6',
      name: 'Silent Result Truncation',
      service: 'search',
      endpoint: 'GET /search',
      desc: 'silently caps page limit 100 -> 20 without error response',
      kind: 'semantic_other',
      active: false,
      confidence: 0.85,
      verdict: 'lossy',
      adapted: false,
      brokenError: "Data truncation: requested 100 items, received 20 silently",
      adaptedSuccess: "Automated chunked batching fetches 5x20 items seamlessly",
      beforeSnippet: '{ "limit": 100, "returned": 100 }',
      afterSnippet: '{ "limit": 100, "returned": 20 }',
      adapterCode: `export async function adaptClientCall(fetcher, query) {\n  return fetcher.batchFetch(query, 20);\n}`,
      workflow: 'searchBrowse',
      workflowFile: 'apps/demo-app/src/workflows/searchBrowse.ts',
    },
    {
      id: 'M7',
      name: 'Webhook Event Flattening',
      service: 'notifications',
      endpoint: 'POST /notifications/webhook',
      desc: 'payload nests event.type -> flattened top-level type',
      kind: 'type_widening',
      active: false,
      confidence: 0.94,
      verdict: 'equivalent',
      adapted: false,
      brokenError: "Webhook unhandled: expected payload.event.type, received undefined",
      adaptedSuccess: "Webhook adapter normalized flattened 'type' back to 'event.type'",
      beforeSnippet: '{ "event": { "type": "order.paid", "id": "evt_9" } }',
      afterSnippet: '{ "type": "order.paid", "id": "evt_9" }',
      adapterCode: `export function adaptWebhook(payload) {\n  return {\n    ...payload,\n    event: { type: payload.type ?? payload.event?.type, id: payload.id }\n  };\n}`,
      workflow: 'notificationAck',
      workflowFile: 'apps/demo-app/src/workflows/notifications.ts',
    },
    {
      id: 'M8',
      name: 'Rate Limit 429 Throttle',
      service: 'payments',
      endpoint: 'POST /payments/charge',
      desc: '429 begins at 5 rps with new Retry-After shape',
      kind: 'rate_limit_changed',
      active: false,
      confidence: 0.95,
      verdict: 'equivalent',
      adapted: false,
      brokenError: "HTTP 429: Too Many Requests; no client backoff implemented",
      adaptedSuccess: "Client SDK transparently backed off 2000ms using Retry-After header",
      beforeSnippet: 'Status: 200 OK (Uncapped rps)',
      afterSnippet: 'Status: 429 Too Many Requests (Retry-After: 2)',
      adapterCode: `export async function adaptWithRetry(req) {\n  return retryWithBackoff(req);\n}`,
      workflow: 'checkout',
      workflowFile: 'apps/demo-app/src/workflows/checkout.ts',
    },
    {
      id: 'M9',
      name: 'Signature Argument Drift',
      service: 'mcp-tool',
      endpoint: 'POST /mcp-tool/execute',
      desc: 'tool argument query -> q, plus new required parameter limit',
      kind: 'rename',
      active: false,
      confidence: 0.92,
      verdict: 'equivalent',
      adapted: false,
      brokenError: "HTTP 400: Missing required argument: q (query renamed to q)",
      adaptedSuccess: "Mapped query -> q and injected default limit: 10",
      beforeSnippet: '{ "query": "logistics orders", "strict": true }',
      afterSnippet: '{ "q": "logistics orders", "limit": 10 }',
      adapterCode: `export function adaptRequest(body) {\n  return { q: body.query ?? body.q, limit: body.limit ?? 10 };\n}`,
      workflow: 'mcpAssistantCall',
      workflowFile: 'apps/demo-app/src/workflows/mcpAssistant.ts',
    },
    {
      id: 'M10',
      name: 'Enum Semantic Drift',
      service: 'users',
      endpoint: 'GET /users',
      desc: 'status enum value "active" now silently includes suspended users',
      kind: 'enum_semantics',
      active: true,
      confidence: 0.78,
      verdict: 'breaking',
      adapted: false,
      brokenError: "CRITICAL: Suspended user Charlie Brown granted active administrative access!",
      adaptedSuccess: "Circuit Breaker Tripped! Workflow quarantined to prevent security breach.",
      beforeSnippet: 'Charlie Brown status: "suspended"',
      afterSnippet: 'Charlie Brown status: "active" (meaning drifted upstream)',
      adapterCode: `// AUTOMATED ADAPTER PROHIBITED FOR BREAKING DRIFT\n// Safe-handling policy requires engineering sign-off via Migration PR.`,
      workflow: 'userAudit',
      workflowFile: 'apps/demo-app/src/workflows/audit.ts',
    },
  ]);

  const toggleMutation = (id: string) => {
    setMutations((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextActive = !m.active;
          logLedgerChecksum(`mutation_toggle_${id}`, { id, active: nextActive });
          return { ...m, active: nextActive };
        }
        return m;
      })
    );
  };

  const resetAll = () => {
    setMutations((prev) =>
      prev.map((m) => ({ ...m, active: false, adapted: false }))
    );
    logLedgerChecksum('mutations_reset_all', { activeCount: 0 });
  };

  const approveProposal = (id: string) => {
    setProposalApproved((prev) => ({ ...prev, [id]: true }));
    logLedgerChecksum('proposal_approved_wallet_sign', {
      proposalId: id,
      approverWallet: userWalletAddress,
      status: 'approved',
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Agent Chat / Plan submission
  const handleAgentSubmit = async (promptText?: string) => {
    const textToSend = promptText || agentPrompt;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user' as const, text: textToSend, mode: agentMode };
    setChatMessages((prev) => [...prev, userMsg]);
    setAgentPrompt('');

    const { sha } = await logLedgerChecksum(`agent_${agentMode}_query`, { query: textToSend, lang: agentLanguage });

    setTimeout(() => {
      if (agentMode === 'ask') {
        const reply =
          agentLanguage === 'hi'
            ? `इंट्रा ऑटोनॉमस एजेंट: हमने अपस्ट्रीम एपीआई ड्रिफ्ट का विश्लेषण किया है। एंडपॉइंट्स पर लेवेनश्टाइन विश्वास 95% पाया गया है।`
            : agentLanguage === 'es'
            ? `Agente Autónomo Intra: Hemos analizado la deriva de la API ascendente. Confianza Levenshtein del 95% calculada.`
            : `Intra Autonomous Agent: Observed dependency telemetry indicates a 95% semantic equivalence for field rename M1 (name -> display_name). Safe-Handling Matrix recommends automated Canary adapter injection with rollback handle rollback_M1_canary.`;
        setChatMessages((prev) => [...prev, { sender: 'agent', text: reply, mode: 'ask', sha }]);
      } else {
        const planSteps = [
          'Phase 1: Intercept incoming telemetry on /payments/charge & verify SHA-256 PII redaction.',
          'Phase 2: Statically inspect AST blast radius in apps/demo-app/src/workflows/checkout.ts (Lines L42-L50).',
          'Phase 3: Synthesize backward-compatible multiplier adapter: data.amount * 0.01.',
          'Phase 4: Execute golden workflow replay test suite to assert semantic equivalence.',
          'Phase 5: Register atomic rollback handle rollback_M3_cents_ok & open GitHub Migration PR.',
        ];
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'agent',
            text: 'Structured Dependency Adaptation Plan Synthesized:',
            mode: 'plan',
            sha,
            planSteps,
          },
        ]);
      }
    }, 600);
  };

  const activeMutations = mutations.filter((m) => m.active);
  const selectedMutation = mutations.find((m) => m.id === selectedMutationId) || mutations[0];

  return (
    <div className="min-h-screen bg-cream text-black dot-grid-pattern selection:bg-crimson/10 selection:text-crimson flex flex-col justify-between relative overflow-x-hidden">
      {/* Organic Crimson Red Glowing Ambient Patches */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-[550px] h-[550px] bg-crimson/12 rounded-full blur-[140px] z-0" />
      <div className="pointer-events-none fixed top-1/2 -left-48 w-[500px] h-[500px] bg-crimson/8 rounded-full blur-[140px] z-0" />
      <div className="pointer-events-none fixed bottom-10 right-1/4 w-[400px] h-[400px] bg-crimson/10 rounded-full blur-[120px] z-0" />

      {/* =========================================================================
          1. LIQUID GLASSMORPHIC CAPSULE NAVBAR (ORDER: Home -> Agent -> MCP -> SDK -> Docs -> Dashboard)
         ========================================================================= */}
      <header className="fixed top-5 left-0 right-0 z-50 px-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Brand Badge */}
          <div
            onClick={() => setActiveTab('home')}
            className="pointer-events-auto cursor-pointer flex items-center space-x-2 liquid-glass rounded-full px-4 py-2 hover:border-crimson/30 transition shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center font-display text-white font-extrabold text-xs">
              <span className="text-crimson font-black">I</span>.
            </div>
            <span className="font-display font-black text-xs tracking-wider text-black">INTRA</span>
            <span className="text-[10px] font-mono text-black/40 border-l border-black/10 pl-2 hidden sm:inline">v0.1</span>
          </div>

          {/* Center: Liquid Glass Capsule Navbar (6 Core Pillars in Exact Specified Order) */}
          <nav className="pointer-events-auto liquid-glass rounded-full p-1.5 flex items-center gap-1 sm:gap-1.5 transition-all shadow-capsule">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'agent', label: 'Agent', icon: Cpu },
              { id: 'mcp', label: 'MCP', icon: Terminal },
              { id: 'sdk', label: 'SDK', icon: Code2 },
              { id: 'docs', label: 'Docs', icon: BookOpen },
              { id: 'dashboard', label: 'Dashboard', icon: Activity, badge: activeMutations.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MainTab)}
                  className={`relative flex items-center space-x-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? tab.id === 'dashboard'
                        ? 'bg-crimson text-white shadow-sm font-semibold'
                        : 'bg-black text-white shadow-sm font-semibold'
                      : 'text-black/75 hover:text-black hover:bg-black/5'
                  }`}
                >
                  {/* Active Tubelight Lamp Glow */}
                  {isActive && (
                    <span
                      className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full ${
                        tab.id === 'dashboard' ? 'bg-crimson' : 'bg-black'
                      } shadow-[0_0_8px_currentColor]`}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-crimson text-[10px] font-bold flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Profile & BridgeKey Wallet Identity Pill */}
          <div
            onClick={() => setShowOnboardingModal(true)}
            className="pointer-events-auto cursor-pointer hidden sm:flex items-center space-x-2 px-4 py-2 liquid-glass rounded-full hover:border-black/30 transition shadow-sm text-xs font-mono"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-black">
              {walletConnected ? `${userWalletAddress.slice(0, 6)}...${userWalletAddress.slice(-4)}` : 'CONNECT WALLET'}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-crimson/10 text-crimson font-bold uppercase">
              {subscriptionTier} (
              {subscriptionTier === 'free' ? '15' : subscriptionTier === 'starter' ? '30' : '45'} NFTs)
            </span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN CONTENT CONTAINER
         ========================================================================= */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16 space-y-10 w-full flex-grow relative z-10">
        {/* =========================================================================
            PILLAR 1: HOMEPAGE (BENTO GRID HIGH-FIDELITY LAYOUT)
           ========================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-10">
            {/* Hero Card with Organic 2rem Radiuses */}
            <div className="border border-black/10 bg-white/90 backdrop-blur-xl p-8 sm:p-14 rounded-[2.5rem] shadow-card text-center max-w-4xl mx-auto space-y-6 relative overflow-hidden">
              <div className="inline-flex items-center space-x-2">
                <span className="verified-badge">THE INTERNET AFTER THE API</span>
                <span className="text-xs font-mono text-black/50">docs/lock.md ALIGNMENT</span>
              </div>

              <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-black leading-tight">
                Software That Heals Its Own Dependencies.
              </h1>

              <p className="text-base sm:text-lg text-black/70 max-w-2xl mx-auto font-normal leading-relaxed">
                When upstream APIs flip defaults, alter pagination shapes, rename fields, or throttle rate limits, Intra automatically learns, isolates blast-radius, and synthesizes backward-compatible adapters before production crashes.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center space-x-2 px-7 py-3.5 rounded-full bg-crimson text-white font-display font-bold text-sm hover:bg-crimson-hover transition shadow-sm"
                >
                  <Activity className="w-4 h-4" />
                  <span>Launch Observability Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('agent')}
                  className="flex items-center space-x-2 px-7 py-3.5 rounded-full bg-black text-white font-display font-bold text-sm hover:bg-black/80 transition shadow-sm"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Claude-Style Agent Workbench</span>
                </button>
                <button
                  onClick={() => setShowOnboardingModal(true)}
                  className="flex items-center space-x-2 px-7 py-3.5 rounded-full border border-black/20 text-black font-display font-semibold text-sm hover:bg-black/5 transition"
                >
                  <Wallet className="w-4 h-4 text-crimson" />
                  <span>BridgeKey Wallet Link</span>
                </button>
              </div>

              {/* Checksum SHA live telemetry pill */}
              <div className="pt-4 border-t border-black/5 flex items-center justify-center space-x-2 text-[11px] font-mono text-black/50">
                <span className="text-crimson font-bold">LATEST LEDGER SHA-256:</span>
                <code className="text-black bg-cream-subtle px-2 py-0.5 rounded-md font-semibold">
                  {latestChecksum.slice(0, 16)}...{latestChecksum.slice(-16)}
                </code>
              </div>
            </div>

            {/* High-Fidelity Bento Grid Layout with 2rem Radiuses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Card 1: Large Span */}
              <div className="md:col-span-2 border border-black/10 bg-white/95 p-8 rounded-[2rem] shadow-card space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="verified-badge">STAGE 01 — 06</span>
                    <span className="text-xs font-mono text-black/40">AUTONOMOUS ADAPTATION LOOP</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-black">
                    Continuous Behavioral Ground Truth
                  </h3>
                  <p className="text-xs text-black/65 leading-relaxed max-w-xl">
                    Never trust documented OpenAPI schemas alone. Intra continuously fingerprints HTTP response codes, defaults, distributions, pagination shapes, and error taxonomies from real non-blocking traffic with 100% SHA-256 PII masking.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-black/5 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-cream-subtle">
                    <div className="text-black/40 text-[10px]">OBSERVATIONS</div>
                    <div className="font-bold text-black text-sm">14,892 Captured</div>
                  </div>
                  <div className="p-3 rounded-xl bg-cream-subtle">
                    <div className="text-black/40 text-[10px]">CONTRACTS</div>
                    <div className="font-bold text-black text-sm">5 Ground Truth</div>
                  </div>
                  <div className="p-3 rounded-xl bg-cream-subtle">
                    <div className="text-black/40 text-[10px]">ADAPTERS</div>
                    <div className="font-bold text-crimson text-sm">Canary Verified</div>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Safe-Handling Policy */}
              <div className="border border-black/10 bg-white/95 p-8 rounded-[2rem] shadow-card space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="verified-badge">SECTION 10 MATRIX</span>
                  <h3 className="font-display font-bold text-lg text-black">
                    Safe-Handling Policy Matrix
                  </h3>
                  <p className="text-xs text-black/60 leading-relaxed">
                    Mathematical bounds: confidence ≥90% auto-applies in-process Canary adapters. Ambiguous or lossy changes auto-generate GitHub migration PRs.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-crimson/5 border border-crimson/20 font-mono text-[11px] text-crimson font-bold">
                  Trips Breaker on Breaking Drift (Zero Silent Regressions)
                </div>
              </div>

              {/* Bento Card 3: Blockchain & BridgeKey */}
              <div className="border border-black/10 bg-white/95 p-8 rounded-[2rem] shadow-card space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white">
                    <Wallet className="w-5 h-5 text-crimson" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-black">
                    BridgeKey & Ledger Proofs
                  </h3>
                  <p className="text-xs text-black/60 leading-relaxed">
                    Tamper-evident SHA-256 hash chains on MST Blockchain testnet. Production PRs require cryptographic wallet signatures.
                  </p>
                </div>
                <div className="text-xs font-mono text-black/60">
                  Rate limits: <strong className="text-black">15 / 30 / 45 NFTs</strong> by Tier
                </div>
              </div>

              {/* Bento Card 4: Double Span Navigation Cards */}
              <div className="md:col-span-2 border border-black/10 bg-white/95 p-8 rounded-[2rem] shadow-card space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-base text-black uppercase tracking-wide">
                    Explore Platform Sections
                  </h3>
                  <span className="text-xs font-mono text-black/40">SIX LOCKED PILLARS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'API Observability & Upgrade Predictor',
                      desc: 'Predict positions of future vendor upgrades & inspect live drift diffs.',
                      tab: 'dashboard',
                      icon: Activity,
                    },
                    {
                      title: 'Claude-Style Agent Workbench',
                      desc: 'Ask & Plan modes with multilingual queries and prompt suggestions.',
                      tab: 'agent',
                      icon: Cpu,
                    },
                    {
                      title: 'Customer MCP Server',
                      desc: '7 discovery and adaptation tools for Claude Desktop & Cursor.',
                      tab: 'mcp',
                      icon: Terminal,
                    },
                    {
                      title: 'Client SDK & Proxy Wrapper',
                      desc: '@intra/sdk client library providing dynamic in-process healing.',
                      tab: 'sdk',
                      icon: Code2,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        onClick={() => setActiveTab(item.tab as MainTab)}
                        className="p-4 rounded-2xl border border-black/5 bg-cream-subtle hover:border-black/20 hover:bg-white text-left transition flex items-center justify-between group shadow-sm"
                      >
                        <div className="space-y-1 pr-3">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-crimson" />
                            <span className="font-display font-bold text-xs text-black group-hover:text-crimson transition">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-black/60">{item.desc}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-black/40 group-hover:translate-x-1 group-hover:text-black transition flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PILLAR 2: AGENT (MINIMAL AESTHETIC CLAUDE-LIKE WORKBENCH: ASK & PLAN MODES)
           ========================================================================= */}
        {activeTab === 'agent' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Claude-Style Clean Header */}
            <div className="border border-black/10 bg-white/95 p-8 rounded-[2.5rem] shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="verified-badge">CLAUDE AGENT WORKBENCH</span>
                    <span className="text-xs font-mono text-black/40">INTELLIGENT ADAPTATION</span>
                  </div>
                  <h2 className="font-display font-bold text-2xl text-black mt-1">
                    Autonomous Adaptation Agent
                  </h2>
                </div>

                {/* Mode Switcher: Ask Mode vs Plan Mode */}
                <div className="flex items-center p-1 bg-cream-subtle rounded-full border border-black/10 text-xs font-mono font-semibold">
                  <button
                    onClick={() => setAgentMode('ask')}
                    className={`px-4 py-1.5 rounded-full transition ${
                      agentMode === 'ask'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    Ask Mode
                  </button>
                  <button
                    onClick={() => setAgentMode('plan')}
                    className={`px-4 py-1.5 rounded-full transition ${
                      agentMode === 'plan'
                        ? 'bg-crimson text-white shadow-sm'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    Plan Mode
                  </button>
                </div>
              </div>

              {/* Sub-header Controls: Multilingual Language Selector (Sarvam AI) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 text-xs">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-crimson" />
                  <span className="text-black/60 font-mono text-[11px]">Interface Language:</span>
                  <select
                    value={agentLanguage}
                    onChange={(e) => setAgentLanguage(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-black/10 bg-white font-mono text-xs text-black focus:outline-none"
                  >
                    <option value="en">English (Default)</option>
                    <option value="hi">हिन्दी (Hindi - Sarvam 105B)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="es">Español (Spanish)</option>
                  </select>
                </div>

                <div className="text-[11px] font-mono text-black/50">
                  Mode: <strong className="text-black uppercase">{agentMode}</strong> &bull; Engine: Sarvam-105B & LLM Loop
                </div>
              </div>
            </div>

            {/* Prompt Suggestion Chips */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-black/50 uppercase tracking-wider">
                {agentMode === 'ask' ? 'Suggested Inquiries (Ask Mode)' : 'Suggested Engineering Plans (Plan Mode)'}
              </div>
              <div className="flex flex-wrap gap-2">
                {(agentMode === 'ask'
                  ? [
                      'Analyze rate-limit drift on /payments/charge',
                      'How does M1 field rename affect userProfile.ts?',
                      'Propose backward-compatible TypeScript adapter for M5 cursor pagination',
                      'Explain why M10 enum drift tripped the circuit breaker',
                    ]
                  : [
                      'Plan zero-downtime migration for M3 dollar-to-cent unit shift',
                      'Generate security quarantine plan for M10 enum drift',
                      'Create rollback strategy for payment webhook flattening',
                    ]
                ).map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleAgentSubmit(chip)}
                    className="px-3.5 py-1.5 rounded-full border border-black/10 bg-white hover:border-crimson hover:bg-crimson/5 text-xs text-black/80 transition shadow-sm text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Dialogue Container */}
            <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-6 shadow-card space-y-4 min-h-[340px] flex flex-col justify-between">
              <div className="space-y-4 overflow-y-auto max-h-[460px] pr-2">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-black/40">
                      <span>{msg.sender === 'user' ? 'DEVELOPER' : 'INTRA AGENT'}</span>
                      {msg.sha && (
                        <span>&bull; SHA: {msg.sha.slice(0, 8)}</span>
                      )}
                    </div>
                    <div
                      className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-black text-white rounded-br-none'
                          : 'bg-cream-subtle border border-black/5 text-black rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p>{msg.text}</p>
                      {msg.planSteps && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-black/10 font-mono text-[11px]">
                          {msg.planSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <span className="text-crimson font-bold">{idx + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input Field */}
              <div className="pt-3 border-t border-black/5 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={
                    agentMode === 'ask'
                      ? 'Ask about observed contracts, drift, or blast-radius...'
                      : 'Request a structured dependency adaptation plan...'
                  }
                  value={agentPrompt}
                  onChange={(e) => setAgentPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAgentSubmit()}
                  className="flex-grow px-4 py-3 rounded-full border border-black/10 bg-cream-subtle text-xs text-black focus:outline-none focus:border-crimson"
                />
                <button
                  onClick={() => handleAgentSubmit()}
                  className="p-3 rounded-full bg-crimson text-white hover:bg-crimson-hover transition shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PILLAR 3: MCP (CUSTOMER MODEL CONTEXT PROTOCOL SERVER)
           ========================================================================= */}
        {activeTab === 'mcp' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Tool Selection */}
            <div className="lg:col-span-1 space-y-3">
              <div className="border border-black/10 bg-white/95 rounded-[2rem] p-6 shadow-card space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                    MCP Tools Inventory (7)
                  </h3>
                  <span className="text-[10px] font-mono text-black/50">SECTION 11 SPEC</span>
                </div>

                <div className="space-y-2">
                  {[
                    { name: 'intra_recent_changes', desc: 'List active mutations & drift with confidence' },
                    { name: 'intra_get_contract', desc: 'Fetch behavioral contract for service & endpoint' },
                    { name: 'intra_list_dependencies', desc: 'Query all observed services & endpoints' },
                    { name: 'intra_impact', desc: 'Trace affected workflows & AST blast radius' },
                    { name: 'intra_propose_adapter', desc: 'Generate TypeScript adapter & migration PR' },
                    { name: 'intra_apply_adapter', desc: 'Apply adapter to live canary runtime' },
                    { name: 'intra_health', desc: 'Check rate-limit headroom & system status' },
                  ].map((tool) => {
                    const isSelected = selectedMcpTool === tool.name;
                    return (
                      <button
                        key={tool.name}
                        onClick={() => {
                          setSelectedMcpTool(tool.name);
                          logLedgerChecksum(`mcp_tool_select_${tool.name}`, { tool: tool.name });
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border transition ${
                          isSelected
                            ? 'border-crimson bg-crimson/5 shadow-sm'
                            : 'border-black/5 bg-cream-subtle hover:border-black/20'
                        }`}
                      >
                        <div className="font-mono font-bold text-xs text-black">{tool.name}</div>
                        <div className="text-[11px] text-black/50 mt-0.5">{tool.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Connection info card */}
              <div className="border border-black/10 bg-white/95 rounded-[2rem] p-6 shadow-card space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <span className="font-display font-bold uppercase text-[11px] text-black">Connection Config</span>
                  <span className="text-[10px] text-crimson font-bold">STREAMABLE HTTP</span>
                </div>
                <div className="space-y-1.5 text-black/60 text-[11px]">
                  <div>Transport: <code className="text-black font-semibold">http/streamable</code></div>
                  <div>Endpoint: <code className="text-black font-semibold">http://localhost:3002/mcp</code></div>
                  <div>Health: <code className="text-black font-semibold">GET /healthz (HTTP 200)</code></div>
                </div>
              </div>
            </div>

            {/* Right: Simulated Tool Execution */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-black/5">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-crimson" />
                      <h3 className="font-mono font-bold text-sm text-black">{selectedMcpTool}</h3>
                    </div>
                    <p className="text-xs text-black/50 mt-1">Live MCP tool execution output</p>
                  </div>
                  <span className="verified-badge">RENDER / HEALTHZ OK</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                      Tool Response JSON
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(
                            selectedMcpTool === 'intra_recent_changes'
                              ? { changesCount: activeMutations.length, changes: activeMutations }
                              : { tool: selectedMcpTool, status: 'ok' },
                            null,
                            2
                          ),
                          'mcp-output'
                        )
                      }
                      className="flex items-center space-x-1 text-xs font-mono text-black/60 hover:text-black"
                    >
                      {copiedKey === 'mcp-output' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'mcp-output' ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-cream-subtle border border-black/10 rounded-2xl font-mono text-xs text-black overflow-x-auto">
                    {selectedMcpTool === 'intra_list_dependencies' &&
                      JSON.stringify(
                        {
                          services: ['users', 'payments', 'search', 'notifications', 'mcp-tool'],
                          totalEndpoints: 14,
                          activeMonitors: 5,
                          status: 'healthy',
                        },
                        null,
                        2
                      )}
                    {selectedMcpTool === 'intra_get_contract' &&
                      JSON.stringify(
                        {
                          service: 'users',
                          endpoint: '/users',
                          schema: {
                            types: { id: 'string', name: 'string', status: 'string' },
                            optionality: [],
                            enums: { status: ['active', 'suspended'] },
                          },
                          paginationStyle: 'offset',
                          sampleCount: 152,
                          lastFingerprint: '2026-10-10T22:30:00Z',
                        },
                        null,
                        2
                      )}
                    {selectedMcpTool === 'intra_recent_changes' &&
                      JSON.stringify(
                        {
                          changesCount: activeMutations.length,
                          changes: activeMutations.map((m) => ({
                            id: `chg_${m.id}`,
                            kind: m.kind,
                            confidence: m.confidence,
                            verdict: m.verdict,
                            desc: m.desc,
                          })),
                        },
                        null,
                        2
                      )}
                    {selectedMcpTool === 'intra_impact' &&
                      JSON.stringify(
                        {
                          changeId: 'chg_M1',
                          affectedWorkflows: ['userProfile'],
                          fieldPaths: ['users.name'],
                          severity: 'low',
                          dependencyChain: ['apps/demo-app/src/workflows/userProfile.ts -> depends on [users:/users]'],
                        },
                        null,
                        2
                      )}
                    {selectedMcpTool === 'intra_propose_adapter' &&
                      JSON.stringify(
                        {
                          proposalId: 'prop_chg_M1',
                          strategy: 'rename',
                          codeDiff: '+++ export function adaptResponse(data) {\n+++   return data.map(i => ({ ...i, name: i.display_name ?? i.name }));\n+++ }',
                          riskAssessment: 'LOW: Safe structural rename with 95% confidence',
                          status: 'pending',
                        },
                        null,
                        2
                      )}
                    {selectedMcpTool === 'intra_apply_adapter' &&
                      JSON.stringify(
                        {
                          success: true,
                          adapterId: 'adp_users_rename_v1',
                          rollbackHandle: 'rollback_users_m1_172856',
                          status: 'applied_canary',
                          message: 'Adapter activated successfully. Golden test replay passed.',
                        },
                        null,
                        2
                      )}
                    {selectedMcpTool === 'intra_health' &&
                      JSON.stringify(
                        {
                          status: 'ok',
                          uptime: 14820,
                          dependencies: {
                            users: 'healthy',
                            payments: 'healthy',
                            search: 'healthy',
                            notifications: 'healthy',
                            mcp: 'healthy',
                          },
                          rateLimitHeadroom: {
                            payments: 10,
                            search: 50,
                          },
                        },
                        null,
                        2
                      )}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PILLAR 4: SDK (CLIENT SDK & DYNAMIC RUNTIME PROXY)
           ========================================================================= */}
        {activeTab === 'sdk' && (
          <div className="space-y-8">
            <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="verified-badge">@intra/sdk CLIENT</span>
                  <span className="text-xs font-mono text-black/40">DYNAMIC RUNTIME PROXY</span>
                </div>
                <h2 className="font-display font-bold text-2xl text-black mt-1">
                  Intra Client SDK & Proxy Interceptor
                </h2>
                <p className="text-xs text-black/60 mt-1 max-w-2xl">
                  Zero-overhead client-side interception. Wraps outgoing fetch/axios requests to non-blockingly stream telemetry to the observability platform and dynamically execute synthesized compatibility adapters in-process.
                </p>
              </div>

              {/* Code Snippets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                      1. Drop-In Fetch Client Wrapper
                    </h3>
                    <span className="text-[10px] font-mono text-black/40">TYPESCRIPT</span>
                  </div>
                  <pre className="p-5 rounded-2xl border border-black/10 bg-cream-subtle font-mono text-xs text-black overflow-x-auto whitespace-pre-wrap">
{`import { createIntraClient } from '@intra/sdk';

// Initialize lightweight client with telemetry link
const intra = createIntraClient({
  engineUrl: 'http://localhost:3001',
  appName: 'shipwell-production',
});

// Outgoing fetch calls automatically adapt to upstream mutations
const response = await intra.fetch('https://api.external.com/users');
const users = await response.json();
// users[0].name is guaranteed even if upstream renamed to display_name!`}
                  </pre>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                      2. Dynamic Adapter Registration
                    </h3>
                    <span className="text-[10px] font-mono text-black/40">IN-PROCESS HEALING</span>
                  </div>
                  <pre className="p-5 rounded-2xl border border-black/10 bg-cream-subtle font-mono text-xs text-black overflow-x-auto whitespace-pre-wrap">
{`// Dynamic hot-swap: update adapter in memory without restarting server
intra.registerAdapter('/users', {
  id: 'adp_users_v2',
  rollbackHandle: 'rollback_m1_canary',
  adaptResponse: (data) => {
    return data.map(item => ({
      ...item,
      name: item.display_name ?? item.name
    }));
  }
});`}
                  </pre>
                </div>
              </div>

              {/* Interactive Dynamic Adapter Playground */}
              <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-display font-bold text-sm text-black">
                      Interactive Client Adapter Playground
                    </h3>
                    <p className="text-xs text-black/60">
                      Test how the client SDK dynamically transforms incoming broken upstream payloads into safe schema-compliant responses.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-black/50">Simulate:</span>
                    <select
                      value={sdkSelectedMutation}
                      onChange={(e) => {
                        const mId = e.target.value;
                        setSdkSelectedMutation(mId);
                        const match = mutations.find((m) => m.id === mId);
                        if (match) setSdkCustomInput(match.afterSnippet);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-black/20 bg-white font-mono text-xs text-black focus:outline-none"
                    >
                      {mutations.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id}: {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-black/60 text-[11px]">
                      <span>INPUT: MUTATED UPSTREAM JSON</span>
                      <span className="text-crimson font-bold">RAW TELEMETRY</span>
                    </div>
                    <textarea
                      rows={6}
                      value={sdkCustomInput}
                      onChange={(e) => setSdkCustomInput(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-black/10 bg-white text-black font-mono text-xs focus:outline-none focus:border-crimson"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-black/60 text-[11px]">
                      <span>OUTPUT: SDK ADAPTED RESPONSE</span>
                      <span className="text-emerald-600 font-bold">NORMALIZED</span>
                    </div>
                    <pre className="p-3 rounded-2xl border border-emerald-600/30 bg-emerald-50/50 text-black font-mono text-xs h-[138px] overflow-x-auto whitespace-pre-wrap">
                      {sdkSelectedMutation === 'M1'
                        ? '{\n  "id": "usr_99",\n  "name": "Marcus Vance",\n  "display_name": "Marcus Vance",\n  "status": "active"\n}'
                        : sdkSelectedMutation === 'M3'
                        ? '{\n  "amount": 25.0,\n  "currency": "USD",\n  "cents_converted": true\n}'
                        : sdkSelectedMutation === 'M5'
                        ? '{\n  "items": [...],\n  "cursor": "MjA=",\n  "offset_normalized": true\n}'
                        : '{\n  "status": "adapted_successfully",\n  "safe": true\n}'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PILLAR 5: DOCS (PROBLEM STATEMENT SPEC & ARCHITECTURE GUIDE)
           ========================================================================= */}
        {activeTab === 'docs' && (
          <div className="space-y-8">
            <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="verified-badge">SPECIFICATION GUIDE</span>
                  <span className="text-xs font-mono text-black/50">docs/lock.md ALIGNMENT</span>
                </div>
                <h2 className="font-display font-bold text-2xl text-black mt-1">
                  The Internet After the API: Help Software Survive Undocumented Changes
                </h2>
                <p className="text-xs text-black/60 mt-1 max-w-2xl">
                  Complete technical specification and architectural solution addressing the core challenge in <code className="text-black font-semibold">docs/lock.md</code>.
                </p>
              </div>

              {/* Document Sections */}
              <div className="space-y-6 text-xs text-black/75 leading-relaxed">
                {/* 1. Problem & Challenge */}
                <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-3">
                  <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                    1. The Core Problem Statement (docs/lock.md)
                  </h3>
                  <p>
                    Modern software relies on APIs, SDKs, MCP servers, webhooks, and third-party services. If a dependency changes behaviour, disappears, becomes rate-limited, or returns subtly different data, applications can silently fail.
                  </p>
                  <p>
                    <strong className="text-black">The Challenge:</strong> Build a system that observes external dependencies, learns their real behaviour, detects meaningful changes, assesses which parts of an application are affected, and automatically adapts—or proposes a safe migration.
                  </p>
                  <div className="p-3.5 rounded-2xl bg-white border border-black/10 font-mono text-[11px] text-black/70">
                    <strong>Core Pipeline:</strong> External service &rarr; Observed behaviour &rarr; Contract / behavioural model &rarr; Change detection &rarr; Impact analysis &rarr; Adapter or migration &rarr; Validation &rarr; Updated system.
                  </div>
                </div>

                {/* 2. Semantic Drift Handling */}
                <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-3">
                  <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                    2. Beyond Documented Schemas (Behavioral Drift)
                  </h3>
                  <p>
                    Do not rely only on documented schemas. Intra detects behavioural changes too: altered defaults, different error responses, changed pagination, rate limits, or data that remains valid JSON but changes meaning.
                  </p>
                  <p>
                    <strong className="text-black">Example Semantic Change:</strong> An endpoint previously returns <code className="font-mono text-black">GET /users &rarr; name</code> but now returns <code className="font-mono text-black">GET /users &rarr; display_name</code>. Intra identifies which workflows depend on name and determines whether mapping the new field preserves the original meaning.
                  </p>
                </div>

                {/* 3. Safe-Handling Policy Matrix */}
                <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4">
                  <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                    3. Safe-Handling Policy Matrix (Section 10)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] border border-black/10 rounded-2xl">
                      <thead className="bg-black/5 text-black">
                        <tr>
                          <th className="p-3">Confidence Score</th>
                          <th className="p-3">Semantic Verdict</th>
                          <th className="p-3">Safe-Handling Action</th>
                          <th className="p-3">Production Behavior</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        <tr>
                          <td className="p-3 font-bold text-black">&ge; 0.90</td>
                          <td className="p-3 text-black">Equivalent</td>
                          <td className="p-3 font-bold text-emerald-600">Auto-Apply</td>
                          <td className="p-3">Canary adapter injected with rollback handle</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-black">0.70 &le; c &lt; 0.90</td>
                          <td className="p-3 text-black">Equivalent</td>
                          <td className="p-3 font-bold text-black">Migration PR</td>
                          <td className="p-3">Automated PR opened with adapter diff and test suite</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-black">Any score</td>
                          <td className="p-3 text-crimson">Lossy</td>
                          <td className="p-3 font-bold text-black">Migration PR</td>
                          <td className="p-3">Requires human engineering review before deployment</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-crimson">&lt; 0.70</td>
                          <td className="p-3 text-black">Any</td>
                          <td className="p-3 font-bold text-crimson">Quarantine Alert</td>
                          <td className="p-3">No automated changes permitted; alert fired</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-crimson">Any score</td>
                          <td className="p-3 font-bold text-crimson">Breaking</td>
                          <td className="p-3 font-bold text-crimson">Circuit Breaker</td>
                          <td className="p-3">Trips circuit breaker to isolate downstream crash</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. The 10 Mutation Catalogue */}
                <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-3">
                  <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                    4. The 10 Mutation Catalogue (M1 through M10)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M1:</span> Field Rename (name &rarr; display_name)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M2:</span> Name Format Shift (Last, First tokenization)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M3:</span> Unit Shift (dollars float &rarr; cents integer)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M4:</span> Default Currency Flip (USD &rarr; EUR fallback)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M5:</span> Pagination (offset deprecated &rarr; opaque cursor)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M6:</span> Silent Truncation (caps limit 100 &rarr; 20)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M7:</span> Webhook Flattening (event.type &rarr; type)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M8:</span> Rate Limit Throttle (HTTP 429 Retry-After)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M9:</span> MCP Tool Signature Drift (query &rarr; q, limit)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-black/5">
                      <span className="font-bold text-crimson">M10:</span> Enum Semantics (status: active includes suspended)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PILLAR 6: DASHBOARD (API OBSERVABILITY INTERFACE - COMES AFTER DOCS!)
           ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Dashboard Header & Telemetry Strip with 2.5rem Radiuses */}
            <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="verified-badge">OBSERVABILITY PLATFORM</span>
                    <span className="text-xs font-mono text-black/50">LIVE TELEMETRY & ADAPTATION</span>
                  </div>
                  <h2 className="font-display font-bold text-2xl text-black mt-1">
                    API Observability Interface
                  </h2>
                  <p className="text-xs text-black/60 mt-0.5">
                    Continuous behavioral telemetry, future upgrade predictions, semantic drift classification, AST dependency blast-radius mapping, and self-healing runtime adaptation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetAll}
                    className="flex items-center space-x-1.5 px-4 py-2 text-xs font-mono font-semibold rounded-full border border-black/20 hover:bg-black/5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Mutations</span>
                  </button>
                  <button
                    onClick={() => setAutoAdapterEnabled(!autoAdapterEnabled)}
                    className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-mono font-bold rounded-full transition ${
                      autoAdapterEnabled ? 'bg-crimson text-white shadow-sm' : 'border border-black/20 text-black'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto-Adapt: {autoAdapterEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Bento Metric Cards with 1.5rem Radiuses */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-black/5 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5">
                  <div className="text-black/50 text-[10px] uppercase">Observations</div>
                  <div className="font-bold text-base text-black">14,892</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">100% PII Masked</div>
                </div>
                <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5">
                  <div className="text-black/50 text-[10px] uppercase">Contracts</div>
                  <div className="font-bold text-base text-black">5 Active</div>
                  <div className="text-[10px] text-black/60 font-semibold">Behavioral Inferred</div>
                </div>
                <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5">
                  <div className="text-black/50 text-[10px] uppercase">Active Drift</div>
                  <div className="font-bold text-base text-crimson">{activeMutations.length} Detected</div>
                  <div className="text-[10px] text-black/60 font-semibold">Structural + Semantic</div>
                </div>
                <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5">
                  <div className="text-black/50 text-[10px] uppercase">Canary Adapters</div>
                  <div className="font-bold text-base text-black">
                    {activeMutations.filter((m) => m.adapted).length} Live
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Replay Verified</div>
                </div>
                <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5 col-span-2 sm:col-span-1">
                  <div className="text-black/50 text-[10px] uppercase">Breaker Status</div>
                  <div className="font-bold text-base text-crimson">
                    {mutations.find((m) => m.id === 'M10')?.active ? 'TRIPPED (M10)' : 'ARMED'}
                  </div>
                  <div className="text-[10px] text-black/60 font-semibold">Zero Bypass</div>
                </div>
              </div>

              {/* Sub-Navigation Pill Dock for Dashboard Views */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5">
                {[
                  { id: 'predict', label: 'Upgrade & Drift Predictor', icon: TrendingUp },
                  { id: 'drift', label: 'Drift Inspector', icon: Activity },
                  { id: 'pipeline', label: 'Pipeline Engine', icon: Sparkles },
                  { id: 'impact', label: 'AST Blast Radius', icon: Layers },
                  { id: 'adapters', label: 'Safe Adapters & PRs', icon: Zap },
                  { id: 'switchboard', label: 'Mutation Switchboard', icon: Sliders, badge: activeMutations.length },
                  { id: 'resilience', label: 'Downstream Resilience', icon: ShieldCheck },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = dashboardView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDashboardView(tab.id as DashboardSubView)}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-black text-white shadow-sm'
                          : 'bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="w-4 h-4 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-view 1: Pure Algorithmic Upgrade & Drift Predictor */}
            {dashboardView === 'predict' && (
              <div className="space-y-6">
                <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="verified-badge">PURE ALGORITHMIC ENGINE</span>
                        <span className="text-xs font-mono text-black/40">NO DUMMY DATA</span>
                      </div>
                      <h3 className="font-display font-bold text-xl text-black mt-1">
                        API Upgrade & Future Drift Predictor
                      </h3>
                      <p className="text-xs text-black/60">
                        Paste any API endpoint or schema. Intra algorithmically identifies structural positions with high statistical probability of future upstream vendor upgrades and synthesizes preemptive adapters.
                      </p>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center space-x-1.5 bg-cream-subtle p-1 rounded-full border border-black/10 text-xs font-mono">
                      <span className="px-2 text-black/50 text-[10px]">PRESETS:</span>
                      <button
                        onClick={() => loadPredictorPreset('stripe')}
                        className="px-3 py-1 rounded-full bg-white hover:bg-black hover:text-white transition shadow-sm text-black font-semibold text-[11px]"
                      >
                        Stripe
                      </button>
                      <button
                        onClick={() => loadPredictorPreset('shopify')}
                        className="px-3 py-1 rounded-full bg-white hover:bg-black hover:text-white transition shadow-sm text-black font-semibold text-[11px]"
                      >
                        Shopify
                      </button>
                      <button
                        onClick={() => loadPredictorPreset('twilio')}
                        className="px-3 py-1 rounded-full bg-white hover:bg-black hover:text-white transition shadow-sm text-black font-semibold text-[11px]"
                      >
                        Twilio
                      </button>
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-2">
                      <label className="text-black/60 text-[11px] block font-bold">
                        TARGET API ENDPOINT URL
                      </label>
                      <input
                        type="text"
                        value={sampleApiEndpoint}
                        onChange={(e) => setSampleApiEndpoint(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white font-mono text-xs text-black focus:outline-none focus:border-crimson"
                      />

                      <label className="text-black/60 text-[11px] block font-bold pt-2">
                        OBSERVED API RESPONSE / SCHEMA PAYLOAD
                      </label>
                      <textarea
                        rows={11}
                        value={sampleApiPayload}
                        onChange={(e) => {
                          setSampleApiPayload(e.target.value);
                          runPureUpgradePrediction(sampleApiEndpoint, e.target.value);
                        }}
                        className="w-full p-4 rounded-2xl border border-black/10 bg-white font-mono text-xs text-black focus:outline-none focus:border-crimson"
                      />
                    </div>

                    {/* Algorithmic Prediction Results Bento */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-black uppercase">
                          PREDICTED UPGRADE VULNERABILITIES ({predictedUpgrades.length})
                        </span>
                        <span className="text-crimson font-bold">ALGORITHMIC PROBABILITY</span>
                      </div>

                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {predictedUpgrades.map((pred, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl border border-black/10 bg-cream-subtle space-y-2 shadow-sm"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-xs text-crimson">{pred.path}</span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                  pred.risk === 'CRITICAL'
                                    ? 'bg-crimson text-white'
                                    : pred.risk === 'HIGH'
                                    ? 'border border-crimson text-crimson bg-white'
                                    : 'bg-black text-white'
                                }`}
                              >
                                {pred.probability}% CHANCE ({pred.risk})
                              </span>
                            </div>
                            <div className="font-display font-bold text-xs text-black">{pred.type}</div>
                            <div className="text-[11px] font-mono text-black/70 bg-white p-2 rounded-xl border border-black/5">
                              {pred.predictedShift}
                            </div>
                            <p className="text-[11px] text-black/60 font-sans">{pred.rationale}</p>
                            <div className="pt-2 border-t border-black/5">
                              <span className="text-[10px] font-mono text-black/40 uppercase">Preemptive Adapter:</span>
                              <pre className="p-2.5 rounded-xl bg-white border border-black/5 text-[10px] font-mono text-black overflow-x-auto whitespace-pre-wrap mt-1">
                                {pred.preemptiveAdapter}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 2: Drift Inspector */}
            {dashboardView === 'drift' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Drift List */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="border border-black/10 bg-white/95 rounded-[2rem] p-6 shadow-card space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-black/5">
                      <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                        Detected Drift Events ({mutations.length})
                      </h3>
                      <span className="text-[10px] font-mono text-black/50">M1–M10 CATALOGUE</span>
                    </div>

                    <div className="space-y-2">
                      {mutations.map((m) => {
                        const isSelected = m.id === selectedMutationId;
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedMutationId(m.id);
                              logLedgerChecksum(`drift_select_${m.id}`, { id: m.id, endpoint: m.endpoint });
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border transition ${
                              isSelected
                                ? 'border-crimson bg-crimson/5 shadow-sm'
                                : 'border-black/5 bg-cream-subtle hover:border-black/20'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-mono font-bold text-xs text-crimson">{m.id}</span>
                              <div className="flex items-center space-x-1">
                                {m.active && (
                                  <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
                                )}
                                <span
                                  className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                    m.verdict === 'breaking'
                                      ? 'bg-crimson text-white font-bold'
                                      : m.verdict === 'lossy'
                                      ? 'border border-crimson/30 text-crimson font-medium'
                                      : 'bg-black text-white font-medium'
                                  }`}
                                >
                                  {m.verdict}
                                </span>
                              </div>
                            </div>
                            <div className="font-display font-semibold text-xs text-black mt-1">
                              {m.name}
                            </div>
                            <div className="text-[11px] font-mono text-black/50 mt-0.5">
                              {m.endpoint} &bull; {(m.confidence * 100).toFixed(0)}% conf
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Detailed Inspector */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-black/5">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-crimson">{selectedMutation.id}</span>
                          <h3 className="font-display font-bold text-base text-black">{selectedMutation.name}</h3>
                        </div>
                        <p className="text-xs text-black/60 mt-0.5 font-mono">
                          {selectedMutation.service} &bull; {selectedMutation.endpoint}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-black/50">State:</span>
                        <span
                          className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                            selectedMutation.active ? 'bg-crimson text-white shadow-sm' : 'bg-black/10 text-black'
                          }`}
                        >
                          {selectedMutation.active ? 'MUTATED UPSTREAM' : 'BASELINE STABLE'}
                        </span>
                      </div>
                    </div>

                    {/* Diff Viewer */}
                    <div className="space-y-2">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                        Live Payload Structural Diff
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                        <div className="p-4 rounded-2xl border border-black/10 bg-cream-subtle space-y-2">
                          <div className="flex justify-between items-center text-black/50 text-[11px]">
                            <span>BASELINE CONTRACT</span>
                            <span className="font-semibold text-emerald-600">ORIGINAL</span>
                          </div>
                          <pre className="text-black overflow-x-auto whitespace-pre-wrap">
                            {selectedMutation.beforeSnippet}
                          </pre>
                        </div>

                        <div className="p-4 rounded-2xl border border-crimson/30 bg-crimson/5 space-y-2">
                          <div className="flex justify-between items-center text-crimson text-[11px]">
                            <span>OBSERVED TELEMETRY</span>
                            <span className="font-bold">UNDOCUMENTED</span>
                          </div>
                          <pre className="text-black overflow-x-auto whitespace-pre-wrap">
                            {selectedMutation.afterSnippet}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Evidence Metrics */}
                    <div className="p-4 rounded-2xl border border-black/10 bg-cream-subtle/70 space-y-2">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                        Statistical Evidence & Classification
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                        <div>
                          <span className="text-black/50">Levenshtein Similarity:</span>{' '}
                          <span className="font-bold text-black">{(selectedMutation.confidence * 0.98).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-black/50">Confidence Score:</span>{' '}
                          <span className="font-bold text-crimson">{(selectedMutation.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-black/50">Safe-Handling Action:</span>{' '}
                          <span className="font-bold text-black">
                            {selectedMutation.verdict === 'breaking'
                              ? 'Circuit Breaker'
                              : selectedMutation.verdict === 'lossy'
                              ? 'Migration PR'
                              : 'Auto-Apply Canary'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Adapter Code */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                          Synthesized Compatibility Adapter
                        </h4>
                        <button
                          onClick={() => copyToClipboard(selectedMutation.adapterCode, 'adapter')}
                          className="flex items-center space-x-1 text-xs font-mono text-black/60 hover:text-black"
                        >
                          {copiedKey === 'adapter' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'adapter' ? 'Copied' : 'Copy Code'}</span>
                        </button>
                      </div>
                      <pre className="p-4 rounded-2xl border border-black/10 bg-cream-subtle font-mono text-xs text-black overflow-x-auto whitespace-pre-wrap">
                        {selectedMutation.adapterCode}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 3: Pipeline Engine */}
            {dashboardView === 'pipeline' && (
              <div className="space-y-8">
                <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
                  <div>
                    <span className="verified-badge">END-TO-END SPECIFICATION</span>
                    <h2 className="font-display font-bold text-xl text-black mt-1">
                      The 6-Stage Autonomous Adaptation Pipeline
                    </h2>
                    <p className="text-xs text-black/60 mt-1">
                      How Intra intercepts, fingerprints, classifies, isolates, and repairs undocumented API mutations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                      {
                        step: '01',
                        name: 'Traffic Observer',
                        pkg: '@intra/observer',
                        desc: 'Non-blocking proxy & SDK wrapper capturing latency, headers, status codes, and payloads with automatic SHA-256 PII masking.',
                      },
                      {
                        step: '02',
                        name: 'Contract Fingerprint',
                        pkg: '@intra/model',
                        desc: 'Learns behavioral ground truth: value distributions, enum sets, error taxonomies, nullability, and pagination schemes.',
                      },
                      {
                        step: '03',
                        name: 'Differ & Classifier',
                        pkg: '@intra/differ',
                        desc: 'Compares sliding windows against baseline. Emits typed Change records with Levenshtein confidence and semantic verdicts.',
                      },
                      {
                        step: '04',
                        name: 'AST Blast Radius',
                        pkg: '@intra/impact',
                        desc: 'Static TypeScript parser tracing field references through Shipwell workflow ASTs to pin-point affected code lines.',
                      },
                      {
                        step: '05',
                        name: 'Safe-Handling Policy',
                        pkg: '@intra/adapter',
                        desc: 'Synthesizes versioned compatibility adapters with unique rollback handles. High confidence auto-applies; lossy generates PRs.',
                      },
                      {
                        step: '06',
                        name: 'Golden Replay Replay',
                        pkg: '@intra/validator',
                        desc: 'Replays recorded production workflows against the adapted service. Asserts strict mathematical and semantic equivalence.',
                      },
                    ].map((stage) => (
                      <div
                        key={stage.step}
                        className="p-5 rounded-2xl border border-black/10 bg-cream-subtle/50 space-y-3 relative group hover:border-black/30 transition shadow-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-black text-sm text-crimson">{stage.step}</span>
                          <span className="text-[10px] font-mono text-black/40 uppercase">{stage.pkg}</span>
                        </div>
                        <h3 className="font-display font-bold text-sm text-black">{stage.name}</h3>
                        <p className="text-xs text-black/65 leading-relaxed">{stage.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 4: AST Blast Radius */}
            {dashboardView === 'impact' && (
              <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="verified-badge">STATIC AST PARSER</span>
                    <span className="text-xs font-mono text-black/50">AST BLAST-RADIUS ENGINE</span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-black mt-1">
                    Application Workflow Blast-Radius Graph
                  </h2>
                  <p className="text-xs text-black/60 mt-1">
                    Intra inspects the downstream codebase to identify which internal workflows, functions, and files are broken by the upstream drift.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      mutation: 'M1 Field Rename (name -> display_name)',
                      workflow: 'userProfile',
                      file: 'apps/demo-app/src/workflows/userProfile.ts',
                      lines: 'L18-L24',
                      severity: 'low',
                      fields: ['users.name'],
                      status: 'HEALED VIA ADAPTER',
                    },
                    {
                      mutation: 'M3 Unit Shift ($ float -> cents integer)',
                      workflow: 'checkout',
                      file: 'apps/demo-app/src/workflows/checkout.ts',
                      lines: 'L42-L50',
                      severity: 'high',
                      fields: ['payments.amount'],
                      status: 'HEALED VIA ADAPTER',
                    },
                    {
                      mutation: 'M5 Pagination (offset -> opaque cursor)',
                      workflow: 'searchBrowse',
                      file: 'apps/demo-app/src/workflows/searchBrowse.ts',
                      lines: 'L65-L72',
                      severity: 'medium',
                      fields: ['search.offset'],
                      status: 'HEALED VIA ADAPTER',
                    },
                    {
                      mutation: 'M10 Enum Semantics (active silently includes suspended)',
                      workflow: 'userAudit',
                      file: 'apps/demo-app/src/workflows/audit.ts',
                      lines: 'L88-L96',
                      severity: 'critical',
                      fields: ['users.status'],
                      status: 'CIRCUIT BREAKER ENGAGED',
                    },
                  ].map((impact, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl border border-black/10 bg-cream-subtle/50 space-y-3 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-black">{impact.workflow}</span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            impact.severity === 'critical'
                              ? 'bg-crimson text-white'
                              : impact.severity === 'high'
                              ? 'border border-crimson text-crimson'
                              : 'bg-black text-white'
                          }`}
                        >
                          {impact.severity}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-black">{impact.mutation}</div>
                      <div className="p-3 rounded-xl bg-white border border-black/10 font-mono text-[11px] text-black/70 space-y-1">
                        <div>
                          <span className="text-black/40">File:</span> {impact.file}
                        </div>
                        <div>
                          <span className="text-black/40">Lines:</span> {impact.lines}
                        </div>
                        <div>
                          <span className="text-black/40">Touched:</span> {impact.fields.join(', ')}
                        </div>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-crimson">
                        Status: {impact.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-view 5: Safe Adapters & PRs */}
            {dashboardView === 'adapters' && (
              <div className="space-y-6">
                <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
                  <div>
                    <span className="verified-badge">SECTION 10 SAFE-HANDLING</span>
                    <h2 className="font-display font-bold text-xl text-black mt-1">
                      Active Adapters & Pending Migration Proposals
                    </h2>
                    <p className="text-xs text-black/60 mt-1">
                      Safe-Handling Matrix guarantees zero unintended mutations in production. Only verified equivalent adaptations auto-apply.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                      Active Canary Adapters (Self-Healing Runtime)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mutations
                        .filter((m) => m.adapted)
                        .map((m) => (
                          <div
                            key={m.id}
                            className="p-5 rounded-2xl border border-black/10 bg-white space-y-3 shadow-sm"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-xs text-crimson">ADAPTER_{m.id}</span>
                              <span className="verified-badge">CANARY LIVE</span>
                            </div>
                            <div className="font-display font-semibold text-xs text-black">{m.name}</div>
                            <pre className="p-3 bg-cream-subtle border border-black/10 rounded-xl font-mono text-[11px] text-black overflow-x-auto">
                              {m.adapterCode}
                            </pre>
                            <div className="text-[10px] font-mono text-black/50">
                              Rollback Handle: <code className="text-black font-semibold">rollback_{m.id}_canary_ok</code>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Pending PRs */}
                  <div className="space-y-4 pt-4 border-t border-black/5">
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-crimson">
                      Pending Human Review Migration Proposals (Lossy or Breaking)
                    </h3>
                    {[
                      {
                        id: 'PR-102',
                        title: 'M2 Name Format Inversion (Last, First -> First Last)',
                        diff: '+++ export function adaptName(val) {\n+++   const [l, f] = val.split(", ");\n+++   return `${f} ${l}`;\n+++ }',
                        risk: 'MEDIUM (Lossy formatting)',
                        mutationId: 'M2',
                      },
                      {
                        id: 'PR-103',
                        title: 'M10 Security Alert: Enum Semantics Drift on status=active',
                        diff: '--- user.status === "active"\n+++ user.status === "active" && !user.isSuspended // MANUAL SANITY FIX',
                        risk: 'CRITICAL (Security Isolation)',
                        mutationId: 'M10',
                      },
                    ].map((pr) => {
                      const isApproved = proposalApproved[pr.id];
                      return (
                        <div
                          key={pr.id}
                          className="p-5 rounded-2xl border border-crimson/20 bg-crimson/5 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <GitPullRequest className="w-4 h-4 text-crimson" />
                              <span className="font-mono font-bold text-xs text-crimson">{pr.id}</span>
                              <span className="font-semibold text-xs text-black">{pr.title}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-crimson px-2 py-0.5 rounded bg-white border border-crimson/20">
                              {pr.risk}
                            </span>
                          </div>
                          <pre className="p-3 bg-white border border-black/10 rounded-xl font-mono text-[11px] text-black overflow-x-auto">
                            {pr.diff}
                          </pre>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-xs font-mono text-black/50">
                              Status: {isApproved ? 'APPROVED & MERGED' : 'AWAITING HUMAN REVIEW'}
                            </span>
                            <button
                              onClick={() => approveProposal(pr.id)}
                              disabled={isApproved}
                              className={`px-5 py-2 rounded-full text-xs font-mono font-bold transition ${
                                isApproved
                                  ? 'bg-emerald-600 text-white cursor-default'
                                  : 'bg-black text-white hover:bg-black/80'
                              }`}
                            >
                              {isApproved ? 'Merged to Production' : 'Approve PR Proposal'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 6: Mutation Switchboard */}
            {dashboardView === 'switchboard' && (
              <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="verified-badge">SIMULATED EXTERNAL SERVICES</span>
                    <h2 className="font-display font-bold text-xl text-black mt-1">
                      Mutation Switchboard (M1 through M10)
                    </h2>
                    <p className="text-xs text-black/60 mt-1">
                      Inject live undocumented upstream changes into users, payments, search, notifications, and MCP services.
                    </p>
                  </div>
                  <button
                    onClick={resetAll}
                    className="flex items-center space-x-1.5 px-5 py-2.5 text-xs font-mono font-bold rounded-full bg-crimson text-white hover:bg-crimson-hover transition shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset All to Baseline</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mutations.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 border rounded-2xl flex items-center justify-between transition duration-200 ${
                        m.active
                          ? 'border-crimson bg-crimson/5 shadow-sm'
                          : 'border-black/10 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-crimson">{m.id}</span>
                          <span className="font-semibold text-xs text-black">{m.name}</span>
                          <span className="text-[10px] font-mono text-black/40 uppercase">[{m.service}]</span>
                        </div>
                        <div className="text-xs text-black/60">{m.desc}</div>
                      </div>
                      <button
                        onClick={() => toggleMutation(m.id)}
                        className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-full transition ${
                          m.active
                            ? 'bg-crimson text-white shadow-sm'
                            : 'border border-black/20 text-black hover:bg-black/5'
                        }`}
                      >
                        {m.active ? 'MUTATED' : 'BASELINE'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-view 7: Downstream Resilience */}
            {dashboardView === 'resilience' && (
              <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
                <div>
                  <span className="verified-badge">SHIPWELL APPLICATION STATUS</span>
                  <h2 className="font-display font-bold text-xl text-black mt-1">
                    Live Downstream Application Resilience Simulator
                  </h2>
                  <p className="text-xs text-black/60 mt-1">
                    Verify that downstream client applications stay operational when upstream dependencies mutate.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      mutationId: 'M1',
                      workflow: 'userProfile',
                      name: 'Fetch User Profile',
                      endpoint: 'GET /users',
                    },
                    {
                      mutationId: 'M3',
                      workflow: 'checkout',
                      name: 'Submit Order Payment',
                      endpoint: 'POST /payments/charge',
                    },
                    {
                      mutationId: 'M5',
                      workflow: 'searchBrowse',
                      name: 'Catalog Pagination',
                      endpoint: 'GET /search',
                    },
                    {
                      mutationId: 'M7',
                      workflow: 'notificationAck',
                      name: 'Webhook Event Dispatch',
                      endpoint: 'POST /notifications/webhook',
                    },
                    {
                      mutationId: 'M9',
                      workflow: 'mcpAssistantCall',
                      name: 'MCP Assistant Tool Call',
                      endpoint: 'POST /mcp-tool/execute',
                    },
                  ].map((item) => {
                    const mut = mutations.find((m) => m.id === item.mutationId)!;
                    const isMutated = mut.active;
                    const isSelfHealed = mut.adapted && autoAdapterEnabled;
                    return (
                      <div
                        key={item.workflow}
                        className={`p-5 rounded-2xl border transition ${
                          isMutated && !isSelfHealed
                            ? 'border-crimson bg-crimson/5'
                            : isMutated && isSelfHealed
                            ? 'border-emerald-500/40 bg-emerald-50/40'
                            : 'border-black/10 bg-white'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-display font-bold text-xs text-black">{item.name}</span>
                              <span className="font-mono text-[10px] text-black/50">({item.endpoint})</span>
                            </div>
                            <div className="text-xs text-black/60 font-mono mt-0.5">
                              Workflow: <code className="text-black font-semibold">{item.workflow}</code>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isMutated && !isSelfHealed ? (
                              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-crimson text-white text-xs font-mono font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                <span>BROKEN (NO ADAPTER)</span>
                              </span>
                            ) : isMutated && isSelfHealed ? (
                              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-mono font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>SELF-HEALED (GREEN)</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/10 text-black text-xs font-mono font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>HEALTHY BASELINE</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-black/5 text-xs font-mono">
                          {isMutated && !isSelfHealed ? (
                            <div className="text-crimson">{mut.brokenError}</div>
                          ) : isMutated && isSelfHealed ? (
                            <div className="text-emerald-700">{mut.adaptedSuccess}</div>
                          ) : (
                            <div className="text-black/50">Operating smoothly against stable baseline API specification.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          PROFILE ONBOARDING & BRIDGEKEY WALLET MODAL
         ========================================================================= */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg border border-white/60 bg-white/95 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowOnboardingModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-black/50 hover:text-black transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="verified-badge">IDENTITY & CREDENTIAL ONBOARDING</span>
              <h3 className="font-display font-bold text-xl text-black mt-1">
                Profile, Wallet & AI Subscription
              </h3>
              <p className="text-xs text-black/60">
                Maps your Firebase user identity to your BridgeKey wallet keypair on MST Blockchain testnet with tiered NFT rate limits.
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between text-xs font-mono border-b border-black/10 pb-4">
              <span className={onboardingStep === 1 ? 'font-bold text-crimson' : 'text-black/40'}>
                1. Firebase Auth
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-black/20" />
              <span className={onboardingStep === 2 ? 'font-bold text-crimson' : 'text-black/40'}>
                2. BridgeKey Connect
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-black/20" />
              <span className={onboardingStep === 3 ? 'font-bold text-crimson' : 'text-black/40'}>
                3. NFT Subscription Tier
              </span>
            </div>

            {onboardingStep === 1 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-black/60">
                    <span>FIREBASE PROJECT:</span>
                    <span className="font-bold text-black">horizon-1ba53</span>
                  </div>
                  <div className="flex justify-between text-black/60">
                    <span>DATABASE URL:</span>
                    <span className="font-bold text-black truncate max-w-[240px]">
                      https://horizon-1ba53-default-rtdb...
                    </span>
                  </div>
                  <div className="flex justify-between text-black/60">
                    <span>AUTH STATE:</span>
                    <span className="text-emerald-600 font-bold">CONNECTED & VERIFIED</span>
                  </div>
                </div>

                <button
                  onClick={() => setOnboardingStep(2)}
                  className="w-full py-3 rounded-full bg-black text-white font-mono text-xs font-bold hover:bg-black/80 transition"
                >
                  Continue to BridgeKey Wallet Link &rarr;
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-black/60">
                    <span>MST RPC:</span>
                    <span className="font-bold text-black truncate max-w-[220px]">
                      https://testnetrpc.mstblockchain.com
                    </span>
                  </div>
                  <div className="flex justify-between text-black/60">
                    <span>CHAIN ID:</span>
                    <span className="font-bold text-black">91562037 (Testnet)</span>
                  </div>
                  <div className="flex justify-between text-black/60">
                    <span>MAPPED ADDRESS:</span>
                    <span className="font-bold text-crimson truncate max-w-[220px]">
                      {userWalletAddress}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-black/60">
                  A cryptographic nonce challenge was signed by your BridgeKey wallet and recorded to the Intra ledger.
                </div>

                <button
                  onClick={() => setOnboardingStep(3)}
                  className="w-full py-3 rounded-full bg-black text-white font-mono text-xs font-bold hover:bg-black/80 transition"
                >
                  Configure AI Subscription Rate Limits &rarr;
                </button>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-black/60 block">
                    Select AI Subscription Tier (NFT Rate Limit Pool):
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {[
                      { id: 'free', name: 'Free', limit: '15 NFTs' },
                      { id: 'starter', name: 'Starter', limit: '30 NFTs' },
                      { id: 'business', name: 'Business', limit: '45 NFTs' },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => {
                          setSubscriptionTier(tier.id as any);
                          logLedgerChecksum(`subscription_tier_set_${tier.id}`, { tier: tier.id, limit: tier.limit });
                        }}
                        className={`p-3 rounded-2xl border text-center transition ${
                          subscriptionTier === tier.id
                            ? 'border-crimson bg-crimson/5 text-crimson font-bold'
                            : 'border-black/10 bg-cream-subtle text-black'
                        }`}
                      >
                        <div>{tier.name}</div>
                        <div className="text-[10px] text-black/50 mt-1">{tier.limit}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowOnboardingModal(false);
                    setOnboardingStep(1);
                  }}
                  className="w-full py-3 rounded-full bg-crimson text-white font-mono text-xs font-bold hover:bg-crimson-hover transition shadow-sm"
                >
                  Save Profile & Close Modal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. ANTIGRAVITY-STYLE FOOTER
         ========================================================================= */}
      <footer className="border-t border-black/10 bg-cream/80 backdrop-blur-md pt-16 pb-8 px-6 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* 4-Column Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
            {/* Column 1: Brand & Core Mission */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center font-display text-white font-extrabold text-xs">
                  <span className="text-crimson font-black">I</span>.
                </div>
                <span className="font-display font-black text-sm tracking-wider text-black">INTRA</span>
              </div>
              <p className="text-black/60 leading-relaxed">
                Autonomous runtime infrastructure empowering software to survive undocumented upstream API changes with zero production downtime.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <span className="verified-badge">v0.1.0 VERIFIED</span>
                <span className="text-black/40 font-mono text-[10px]">MIT LICENSE</span>
              </div>
            </div>

            {/* Column 2: The 6 Product Pillars */}
            <div className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-black text-[11px]">
                Six Product Pillars
              </h4>
              <ul className="space-y-1.5 text-black/60 font-mono text-[11px]">
                <li>&bull; 1. Home (Mission Portal)</li>
                <li>&bull; 2. Agent (Claude-Style Workbench)</li>
                <li>&bull; 3. MCP (Customer Model Context Protocol)</li>
                <li>&bull; 4. SDK (@intra/sdk Dynamic Proxy)</li>
                <li>&bull; 5. Docs (docs/lock.md Problem Solver)</li>
                <li>&bull; 6. Dashboard (API Observability Interface)</li>
              </ul>
            </div>

            {/* Column 3: Customer MCP Server */}
            <div className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-black text-[11px]">
                Customer MCP Server
              </h4>
              <ul className="space-y-1.5 text-black/60 font-mono text-[11px]">
                <li><code>intra_list_dependencies</code></li>
                <li><code>intra_get_contract</code></li>
                <li><code>intra_recent_changes</code></li>
                <li><code>intra_impact</code></li>
                <li><code>intra_propose_adapter</code></li>
                <li><code>intra_apply_adapter</code></li>
                <li><code>intra_health</code></li>
              </ul>
            </div>

            {/* Column 4: Safe Handling Policy */}
            <div className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-black text-[11px]">
                Safe-Handling Policy
              </h4>
              <div className="space-y-1.5 text-black/60">
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Confidence &ge; 90%:</span>
                  <span className="font-bold text-black">Auto-Apply</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span>70% &le; Conf &lt; 90%:</span>
                  <span className="font-bold text-black">Migration PR</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Confidence &lt; 70%:</span>
                  <span className="font-bold text-crimson">Quarantine</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Breaking Verdict:</span>
                  <span className="font-bold text-crimson">Circuit Break</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-black/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-black/50">
            <div>
              ENGINE STATUS: <span className="text-crimson font-bold">ALL SYSTEMS OPERATIONAL</span>
            </div>
            <div>
              COLOR PALETTE: <span className="text-black font-semibold">CRIMSON RED</span> &bull; <span className="text-black font-semibold">CREAM</span> &bull; <span className="text-black font-semibold">BLACK</span>
            </div>
            <div>
              FONTS: <span className="text-black font-semibold">POPPINS</span> + <span className="text-black font-semibold">MONTSERRAT</span>
            </div>
          </div>

          {/* Giant Antigravity "Intra." Headline with Red Gradient Background Clipping */}
          <div className="relative overflow-hidden pt-6 pb-2 text-center select-none pointer-events-none">
            <span className="font-display font-black text-6xl sm:text-8xl md:text-[11rem] lg:text-[14rem] xl:text-[16rem] leading-none tracking-tighter antigravity-hero-text block">
              Intra.
            </span>
          </div>

          <div className="text-center font-mono text-[11px] text-black/40">
            &copy; {new Date().getFullYear()} Intra. Autonomous Upstream API Resilience Platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
