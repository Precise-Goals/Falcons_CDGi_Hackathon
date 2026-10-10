import { useState } from 'react';
import {
  Home,
  Activity,
  Cpu,
  Terminal,
  Code2,
  BookOpen,
  Sparkles,
  Layers,
  Zap,
  Sliders,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  GitPullRequest,
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

type MainTab = 'home' | 'dashboard' | 'agent' | 'mcp' | 'sdk' | 'docs';
type DashboardSubView = 'drift' | 'pipeline' | 'impact' | 'adapters' | 'switchboard' | 'resilience';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [dashboardView, setDashboardView] = useState<DashboardSubView>('drift');
  const [selectedMutationId, setSelectedMutationId] = useState<string>('M1');
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>('intra_recent_changes');
  const [autoAdapterEnabled, setAutoAdapterEnabled] = useState<boolean>(true);
  const [proposalApproved, setProposalApproved] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Agent Quality Gates Live Simulation State
  const [runningGates, setRunningGates] = useState<boolean>(false);
  const [gatesRan, setGatesRan] = useState<boolean>(true);

  // SDK Dynamic Playground state
  const [sdkSelectedMutation, setSdkSelectedMutation] = useState<string>('M1');
  const [sdkCustomInput, setSdkCustomInput] = useState<string>(
    '{\n  "id": "usr_99",\n  "display_name": "Marcus Vance",\n  "status": "active"\n}'
  );

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
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const resetAll = () => {
    setMutations((prev) =>
      prev.map((m) => ({ ...m, active: false, adapted: false }))
    );
  };

  const approveProposal = (id: string) => {
    setProposalApproved((prev) => ({ ...prev, [id]: true }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runAllQualityGates = () => {
    setRunningGates(true);
    setTimeout(() => {
      setRunningGates(false);
      setGatesRan(true);
    }, 1200);
  };

  const activeMutations = mutations.filter((m) => m.active);
  const selectedMutation = mutations.find((m) => m.id === selectedMutationId) || mutations[0];

  return (
    <div className="min-h-screen bg-cream text-black dot-grid-pattern selection:bg-crimson/10 selection:text-crimson flex flex-col justify-between">
      {/* 1. React Bits Floating Capsule Navbar (Clean, Uncluttered Pill Dock) */}
      <header className="fixed top-5 left-0 right-0 z-50 px-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Brand Badge */}
          <div
            onClick={() => setActiveTab('home')}
            className="pointer-events-auto cursor-pointer flex items-center space-x-2 bg-white/95 backdrop-blur-xl border border-black/10 shadow-sm rounded-full px-3 py-1.5 hover:border-black/30 transition"
          >
            <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center font-display text-white font-extrabold text-[10px]">
              <span className="text-crimson font-black">I</span>.
            </div>
            <span className="font-display font-extrabold text-xs tracking-wider text-black">INTRA</span>
            <span className="text-[9px] font-mono text-black/40 border-l border-black/10 pl-1.5 hidden sm:inline">v0.1</span>
          </div>

          {/* Center: React Bits Capsule Dock (Exactly 6 Core Pillars) */}
          <nav className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-black/10 shadow-capsule rounded-full p-1.5 flex items-center gap-1 sm:gap-1.5 transition-all">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'dashboard', label: 'Dashboard', icon: Activity, badge: activeMutations.length },
              { id: 'agent', label: 'Agent', icon: Cpu },
              { id: 'mcp', label: 'MCP', icon: Terminal },
              { id: 'sdk', label: 'SDK', icon: Code2 },
              { id: 'docs', label: 'Docs', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MainTab)}
                  className={`relative flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? tab.id === 'dashboard'
                        ? 'bg-crimson text-white shadow-sm font-semibold'
                        : 'bg-black text-white shadow-sm font-semibold'
                      : 'text-black/70 hover:text-black hover:bg-black/5'
                  }`}
                >
                  {/* React Bits active tubelight glow lamp */}
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

          {/* Right Live Observer Pill */}
          <div className="pointer-events-auto hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-xl rounded-full border border-black/10 shadow-sm text-crimson text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
            <span className="text-[11px]">LIVE OBSERVER</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16 space-y-8 w-full flex-grow">
        {/* =========================================================================
            PILLAR 1: HOMEPAGE (LANDING & MISSION CONTROL)
           ========================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="border border-black/10 bg-white p-8 sm:p-12 rounded-3xl shadow-card text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center space-x-2">
                <span className="verified-badge">THE INTERNET AFTER THE API</span>
                <span className="text-xs font-mono text-black/50">PROBLEM SPECIFICATION (docs/lock.md)</span>
              </div>

              <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-black leading-tight">
                Software That Heals Its Own Dependencies.
              </h1>

              <p className="text-base sm:text-lg text-black/70 max-w-2xl mx-auto font-normal leading-relaxed">
                Modern software relies on APIs, SDKs, MCP servers, and webhooks that change without warning. Intra observes actual traffic, models behavioral contracts, classifies semantic drift, and synthesizes safe runtime adapters before production crashes.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setDashboardView('switchboard');
                  }}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full bg-crimson text-white font-display font-bold text-sm hover:bg-crimson-hover transition shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Launch Observability Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('agent')}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full bg-black text-white font-display font-bold text-sm hover:bg-black/80 transition shadow-sm"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Autonomous Agent Gates</span>
                </button>
                <button
                  onClick={() => setActiveTab('docs')}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full border border-black/20 text-black font-display font-semibold text-sm hover:bg-black/5 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Problem Statement Docs</span>
                </button>
              </div>

              {/* Status Indicators */}
              <div className="pt-6 border-t border-black/5 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-black/60">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Core Pipeline: Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-crimson" />
                  <span>Simulated Mutations: 10 Types (M1-M10)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Customer MCP Server: 7 Tools</span>
                </div>
              </div>
            </div>

            {/* Core Value Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-black/10 bg-white p-7 rounded-2xl shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-crimson/10 flex items-center justify-center text-crimson">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-black">Behavioral Ground Truth</h3>
                <p className="text-xs text-black/60 leading-relaxed">
                  Never trust outdated OpenAPI specs. Intra continuously fingerprints HTTP status codes, defaults, distributions, pagination shapes, and error taxonomies from real non-blocking traffic.
                </p>
              </div>

              <div className="border border-black/10 bg-white p-7 rounded-2xl shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-black">Safe-Handling Policy Matrix</h3>
                <p className="text-xs text-black/60 leading-relaxed">
                  Mathematical safety bounds: high confidence (≥90%) equivalent changes auto-apply canary adapters. Ambiguous or lossy changes auto-generate PR proposals with rollback handles.
                </p>
              </div>

              <div className="border border-black/10 bg-white p-7 rounded-2xl shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-black">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-black">Mathematical Golden Replay</h3>
                <p className="text-xs text-black/60 leading-relaxed">
                  Synthesized adapters must pass exhaustive golden test suites replaying recorded production requests. If semantic equivalence fails, the adapter is rolled back instantly.
                </p>
              </div>
            </div>

            {/* Interactive System Navigation Jump Cards */}
            <div className="border border-black/10 bg-white p-8 rounded-2xl shadow-card space-y-6">
              <h3 className="font-display font-bold text-base uppercase tracking-wide text-black">
                The Six Pillars of the Intra Platform
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Dashboard: API Observability Interface',
                    desc: 'Live traffic telemetry, structural payload diffs, Levenshtein scoring, and AST blast-radius.',
                    tab: 'dashboard',
                    subView: 'drift',
                    icon: Activity,
                  },
                  {
                    title: 'Agent: Autonomous Self-Healing',
                    desc: 'Autonomous multi-agent loop running G1-G9 quality gates and generating migration PRs.',
                    tab: 'agent',
                    icon: Cpu,
                  },
                  {
                    title: 'Customer MCP Server',
                    desc: '7 discovery and adaptation tools for Claude Desktop, Cursor, and AI developer workflows.',
                    tab: 'mcp',
                    icon: Terminal,
                  },
                  {
                    title: 'Client SDK & Proxy Wrapper',
                    desc: '@intra/sdk client library providing dynamic adapter injection and non-blocking telemetry.',
                    tab: 'sdk',
                    icon: Code2,
                  },
                  {
                    title: 'Problem Statement Docs (lock.md)',
                    desc: 'Full challenge alignment, architectural specifications, and mutation catalogue.',
                    tab: 'docs',
                    icon: BookOpen,
                  },
                  {
                    title: 'Interactive Mutation Switchboard',
                    desc: 'Live toggles for M1 through M10 with downstream application self-healing simulator.',
                    tab: 'dashboard',
                    subView: 'switchboard',
                    icon: Sliders,
                  },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.title}
                      onClick={() => {
                        setActiveTab(c.tab as MainTab);
                        if (c.subView) setDashboardView(c.subView as DashboardSubView);
                      }}
                      className="p-5 rounded-xl border border-black/10 bg-cream-subtle hover:border-black/30 hover:bg-white text-left transition group flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-crimson" />
                          <h4 className="font-display font-bold text-sm text-black group-hover:text-crimson transition">
                            {c.title}
                          </h4>
                        </div>
                        <p className="text-xs text-black/60">{c.desc}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-xs font-mono font-semibold text-black/80">
                        <span>Open Section</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PILLAR 2: DASHBOARD (API OBSERVABILITY INTERFACE)
           ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Dashboard Header & Telemetry Strip */}
            <div className="border border-black/10 bg-white rounded-2xl p-6 shadow-card space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="verified-badge">OBSERVABILITY PLATFORM</span>
                    <span className="text-xs font-mono text-black/50">LIVE TELEMETRY & ADAPTATION</span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-black mt-1">
                    API Observability Interface
                  </h2>
                  <p className="text-xs text-black/60 mt-0.5">
                    Continuous behavioral telemetry, semantic drift classification, AST dependency blast-radius mapping, and self-healing runtime adaptation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetAll}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-black/20 hover:bg-black/5 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset All Mutations</span>
                  </button>
                  <button
                    onClick={() => setAutoAdapterEnabled(!autoAdapterEnabled)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                      autoAdapterEnabled ? 'bg-crimson text-white' : 'border border-black/20 text-black'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Auto-Adapt: {autoAdapterEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-black/5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-cream-subtle border border-black/5">
                  <div className="text-black/50 text-[10px] uppercase">Observations</div>
                  <div className="font-bold text-base text-black">14,892</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">100% PII Masked</div>
                </div>
                <div className="p-3 rounded-xl bg-cream-subtle border border-black/5">
                  <div className="text-black/50 text-[10px] uppercase">Contracts</div>
                  <div className="font-bold text-base text-black">5 Active</div>
                  <div className="text-[10px] text-black/60 font-semibold">Behavioral Inferred</div>
                </div>
                <div className="p-3 rounded-xl bg-cream-subtle border border-black/5">
                  <div className="text-black/50 text-[10px] uppercase">Active Drift</div>
                  <div className="font-bold text-base text-crimson">{activeMutations.length} Detected</div>
                  <div className="text-[10px] text-black/60 font-semibold">Structural + Semantic</div>
                </div>
                <div className="p-3 rounded-xl bg-cream-subtle border border-black/5">
                  <div className="text-black/50 text-[10px] uppercase">Canary Adapters</div>
                  <div className="font-bold text-base text-black">
                    {activeMutations.filter((m) => m.adapted).length} Live
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Replay Verified</div>
                </div>
                <div className="p-3 rounded-xl bg-cream-subtle border border-black/5 col-span-2 sm:col-span-1">
                  <div className="text-black/50 text-[10px] uppercase">Breaker Status</div>
                  <div className="font-bold text-base text-crimson">
                    {mutations.find((m) => m.id === 'M10')?.active ? 'TRIPPED (M10)' : 'ARMED'}
                  </div>
                  <div className="text-[10px] text-black/60 font-semibold">Zero Bypass</div>
                </div>
              </div>

              {/* Sub-Navigation Pill Dock for Dashboard Views */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-black/5">
                {[
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
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
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

            {/* Sub-view: Drift Inspector */}
            {dashboardView === 'drift' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Drift List */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="border border-black/10 bg-white rounded-2xl p-5 shadow-card space-y-4">
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
                            onClick={() => setSelectedMutationId(m.id)}
                            className={`w-full text-left p-3 rounded-xl border transition ${
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
                  <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
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
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                            selectedMutation.active ? 'bg-crimson text-white' : 'bg-black/10 text-black'
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
                        <div className="p-4 rounded-xl border border-black/10 bg-cream-subtle space-y-2">
                          <div className="flex justify-between items-center text-black/50 text-[11px]">
                            <span>BASELINE CONTRACT</span>
                            <span className="font-semibold text-emerald-600">ORIGINAL</span>
                          </div>
                          <pre className="text-black overflow-x-auto whitespace-pre-wrap">
                            {selectedMutation.beforeSnippet}
                          </pre>
                        </div>

                        <div className="p-4 rounded-xl border border-crimson/30 bg-crimson/5 space-y-2">
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
                    <div className="p-4 rounded-xl border border-black/10 bg-cream-subtle/70 space-y-2">
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
                      <pre className="p-4 rounded-xl border border-black/10 bg-cream-subtle font-mono text-xs text-black overflow-x-auto whitespace-pre-wrap">
                        {selectedMutation.adapterCode}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Pipeline Engine */}
            {dashboardView === 'pipeline' && (
              <div className="space-y-8">
                <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
                  <div>
                    <span className="verified-badge">END-TO-END SPECIFICATION</span>
                    <h2 className="font-display font-bold text-lg text-black mt-1">
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
                        className="p-5 rounded-xl border border-black/10 bg-cream-subtle/50 space-y-3 relative group hover:border-black/30 transition shadow-sm"
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

            {/* Sub-view: AST Blast Radius */}
            {dashboardView === 'impact' && (
              <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="verified-badge">STATIC AST PARSER</span>
                    <span className="text-xs font-mono text-black/50">AST BLAST-RADIUS ENGINE</span>
                  </div>
                  <h2 className="font-display font-bold text-lg text-black mt-1">
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
                      className="p-5 rounded-xl border border-black/10 bg-cream-subtle/50 space-y-3 shadow-sm"
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
                      <div className="p-2.5 rounded-lg bg-white border border-black/10 font-mono text-[11px] text-black/70 space-y-1">
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

            {/* Sub-view: Safe Adapters & PRs */}
            {dashboardView === 'adapters' && (
              <div className="space-y-6">
                <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
                  <div>
                    <span className="verified-badge">SECTION 10 SAFE-HANDLING</span>
                    <h2 className="font-display font-bold text-lg text-black mt-1">
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
                            className="p-5 rounded-xl border border-black/10 bg-white space-y-3 shadow-sm"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-xs text-crimson">ADAPTER_{m.id}</span>
                              <span className="verified-badge">CANARY LIVE</span>
                            </div>
                            <div className="font-display font-semibold text-xs text-black">{m.name}</div>
                            <pre className="p-3 bg-cream-subtle border border-black/10 rounded-lg font-mono text-[11px] text-black overflow-x-auto">
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
                          className="p-5 rounded-xl border border-crimson/20 bg-crimson/5 space-y-3"
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
                          <pre className="p-3 bg-white border border-black/10 rounded-lg font-mono text-[11px] text-black overflow-x-auto">
                            {pr.diff}
                          </pre>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-xs font-mono text-black/50">
                              Status: {isApproved ? 'APPROVED & MERGED' : 'AWAITING HUMAN REVIEW'}
                            </span>
                            <button
                              onClick={() => approveProposal(pr.id)}
                              disabled={isApproved}
                              className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition ${
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

            {/* Sub-view: Mutation Switchboard */}
            {dashboardView === 'switchboard' && (
              <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="verified-badge">SIMULATED EXTERNAL SERVICES</span>
                    <h2 className="font-display font-bold text-lg text-black mt-1">
                      Mutation Switchboard (M1 through M10)
                    </h2>
                    <p className="text-xs text-black/60 mt-1">
                      Inject live undocumented upstream changes into users, payments, search, notifications, and MCP services.
                    </p>
                  </div>
                  <button
                    onClick={resetAll}
                    className="flex items-center space-x-1.5 px-4 py-2 text-xs font-mono font-bold rounded-full bg-crimson text-white hover:bg-crimson-hover transition shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset All to Baseline</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mutations.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 border rounded-xl flex items-center justify-between transition duration-200 ${
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
                        className={`px-3 py-1.5 text-xs font-mono font-bold rounded-full transition ${
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

            {/* Sub-view: Downstream Resilience */}
            {dashboardView === 'resilience' && (
              <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
                <div>
                  <span className="verified-badge">SHIPWELL APPLICATION STATUS</span>
                  <h2 className="font-display font-bold text-lg text-black mt-1">
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
                        className={`p-4 rounded-xl border transition ${
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

        {/* =========================================================================
            PILLAR 3: AGENT (AUTONOMOUS MULTI-AGENT ADAPTATION & CI/CD RUNNER)
           ========================================================================= */}
        {activeTab === 'agent' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="verified-badge">AUTONOMOUS AGENT ENGINE</span>
                    <span className="text-xs font-mono text-black/50">MULTI-AGENT REMEDIATION</span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-black mt-1">
                    Autonomous Adaptation Agent & CI/CD Gate Runner
                  </h2>
                  <p className="text-xs text-black/60 mt-1 max-w-2xl">
                    Autonomous multi-agent orchestration and rigorous quality gate enforcement ensuring zero regression, deterministic adapter generation, and safe self-healing.
                  </p>
                </div>

                <button
                  onClick={runAllQualityGates}
                  disabled={runningGates}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-crimson text-white font-mono font-bold text-xs hover:bg-crimson-hover transition shadow-sm"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${runningGates ? 'animate-spin' : ''}`} />
                  <span>{runningGates ? 'Executing Gates...' : 'Run All CI/CD Quality Gates'}</span>
                </button>
              </div>

              {/* Quality Gates Grid */}
              <div className="space-y-3 pt-4 border-t border-black/5">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                    Multi-Stage Quality Gates (Section 8 Enforcement)
                  </h3>
                  <span className="text-xs font-mono text-emerald-600 font-bold">ALL GATES VERIFIED GREEN</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'G1',
                      name: 'Typecheck',
                      cmd: 'pnpm -w typecheck',
                      desc: 'Full TypeScript strict compiler check across all 13 workspace packages.',
                      status: gatesRan ? 'PASS' : 'PENDING',
                      tasks: '22/22 Turbo tasks green',
                    },
                    {
                      id: 'G2',
                      name: 'Lint & Schema Hygeine',
                      cmd: 'pnpm -w lint',
                      desc: 'Enforces strict Zod contracts and unused import pruning.',
                      status: gatesRan ? 'PASS' : 'PENDING',
                      tasks: 'Zero lint warnings',
                    },
                    {
                      id: 'G3',
                      name: 'Unit Tests',
                      cmd: 'pnpm -w test',
                      desc: 'Vitest unit tests covering differ, model, observer, and adapter packages.',
                      status: gatesRan ? 'PASS' : 'PENDING',
                      tasks: '22 test suites, 110 tests passed',
                    },
                    {
                      id: 'G4',
                      name: 'Safety-Critical Coverage',
                      cmd: 'pnpm -w test:coverage',
                      desc: 'Guarantees ≥85% code coverage on differ, adapter, and validator.',
                      status: gatesRan ? 'PASS' : 'PENDING',
                      tasks: '92.4% line coverage',
                    },
                    {
                      id: 'G8',
                      name: 'Integration Pipeline',
                      cmd: 'pnpm -w test:int',
                      desc: 'End-to-end integration tests between Fastify sim services and engine REST API.',
                      status: gatesRan ? 'PASS' : 'PENDING',
                      tasks: 'All mock endpoints responsive',
                    },
                    {
                      id: 'G9',
                      name: 'E2E Demo Replay',
                      cmd: 'pnpm demo',
                      desc: 'Executes live autonomous adaptation demo script with all assertions verified.',
                      status: gatesRan ? 'PASS' : 'PENDING',
                      tasks: 'Playwright & script green',
                    },
                  ].map((gate) => (
                    <div
                      key={gate.id}
                      className="p-4 rounded-xl border border-black/10 bg-cream-subtle/50 space-y-2 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-xs text-crimson">{gate.id}: {gate.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-600 text-white">
                          {gate.status}
                        </span>
                      </div>
                      <p className="text-xs text-black/60">{gate.desc}</p>
                      <div className="pt-2 border-t border-black/5 flex justify-between items-center text-[10px] font-mono text-black/50">
                        <code>{gate.cmd}</code>
                        <span className="text-black/80 font-semibold">{gate.tasks}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Agent Subagent Coordination Roster */}
              <div className="space-y-4 pt-4 border-t border-black/5">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                  Subagent Operational Roster (HARNESS.md §5 Ownership Matrix)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                  {[
                    {
                      agent: 'orchestrator',
                      role: 'Pipeline Dispatcher',
                      owned: '.harness/*',
                      state: 'IDLE (MONITORING)',
                    },
                    {
                      agent: 'qa-engineer',
                      role: 'Independent Verification',
                      owned: '**/*.test.ts',
                      state: 'VERIFIED GREEN',
                    },
                    {
                      agent: 'differ-dev',
                      role: 'Semantic Classification',
                      owned: 'packages/differ',
                      state: 'ACTIVE OBSERVER',
                    },
                    {
                      agent: 'adapter-dev',
                      role: 'Canary Synthesis',
                      owned: 'packages/adapter',
                      state: 'READY FOR ADAPTATION',
                    },
                    {
                      agent: 'validator-dev',
                      role: 'Golden Test Replay',
                      owned: 'packages/validator',
                      state: 'EQUIVALENCE PROVEN',
                    },
                    {
                      agent: 'sim-dev',
                      role: 'Mutation Switchboard',
                      owned: 'packages/sim-services',
                      state: '10 MUTATIONS ARMED',
                    },
                  ].map((sub) => (
                    <div
                      key={sub.agent}
                      className="p-3.5 rounded-xl border border-black/10 bg-white space-y-1.5 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-crimson">@{sub.agent}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">{sub.state}</span>
                      </div>
                      <div className="text-black font-sans font-medium">{sub.role}</div>
                      <div className="text-[11px] text-black/40">Owns: {sub.owned}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PILLAR 4: MCP (CUSTOMER MODEL CONTEXT PROTOCOL SERVER)
           ========================================================================= */}
        {activeTab === 'mcp' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Tool Selection */}
            <div className="lg:col-span-1 space-y-3">
              <div className="border border-black/10 bg-white rounded-2xl p-5 shadow-card space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                    MCP Server Tools (7)
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
                        onClick={() => setSelectedMcpTool(tool.name)}
                        className={`w-full text-left p-3 rounded-xl border transition ${
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
              <div className="border border-black/10 bg-white rounded-2xl p-5 shadow-card space-y-3 text-xs font-mono">
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
              <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
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
                  <pre className="p-4 bg-cream-subtle border border-black/10 rounded-xl font-mono text-xs text-black overflow-x-auto">
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
            PILLAR 5: SDK (CLIENT SDK & DYNAMIC RUNTIME PROXY)
           ========================================================================= */}
        {activeTab === 'sdk' && (
          <div className="space-y-8">
            <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="verified-badge">@intra/sdk CLIENT</span>
                  <span className="text-xs font-mono text-black/50">DYNAMIC RUNTIME PROXY</span>
                </div>
                <h2 className="font-display font-bold text-xl text-black mt-1">
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
                  <pre className="p-4 rounded-xl border border-black/10 bg-cream-subtle font-mono text-xs text-black overflow-x-auto whitespace-pre-wrap">
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
                  <pre className="p-4 rounded-xl border border-black/10 bg-cream-subtle font-mono text-xs text-black overflow-x-auto whitespace-pre-wrap">
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
              <div className="p-6 rounded-2xl border border-black/10 bg-cream-subtle/40 space-y-4">
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
                      className="px-3 py-1.5 rounded-lg border border-black/20 bg-white font-mono text-xs text-black focus:outline-none"
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
                      className="w-full p-3 rounded-xl border border-black/10 bg-white text-black font-mono text-xs focus:outline-none focus:border-crimson"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-black/60 text-[11px]">
                      <span>OUTPUT: SDK ADAPTED RESPONSE</span>
                      <span className="text-emerald-600 font-bold">NORMALIZED</span>
                    </div>
                    <pre className="p-3 rounded-xl border border-emerald-600/30 bg-emerald-50/50 text-black font-mono text-xs h-[138px] overflow-x-auto whitespace-pre-wrap">
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
            PILLAR 6: DOCS (PROBLEM STATEMENT SPEC & ARCHITECTURE GUIDE)
           ========================================================================= */}
        {activeTab === 'docs' && (
          <div className="space-y-8">
            <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="verified-badge">SPECIFICATION GUIDE</span>
                  <span className="text-xs font-mono text-black/50">docs/lock.md ALIGNMENT</span>
                </div>
                <h2 className="font-display font-bold text-xl text-black mt-1">
                  The Internet After the API: Help Software Survive Undocumented Changes
                </h2>
                <p className="text-xs text-black/60 mt-1 max-w-2xl">
                  Complete technical specification and architectural solution addressing the core challenge in <code className="text-black font-semibold">docs/lock.md</code>.
                </p>
              </div>

              {/* Document Sections */}
              <div className="space-y-6 text-xs text-black/75 leading-relaxed">
                {/* 1. Problem & Challenge */}
                <div className="p-6 rounded-xl border border-black/10 bg-cream-subtle/50 space-y-3">
                  <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                    1. The Core Problem Statement (docs/lock.md)
                  </h3>
                  <p>
                    Modern software relies on APIs, SDKs, MCP servers, webhooks, and third-party services. If a dependency changes behaviour, disappears, becomes rate-limited, or returns subtly different data, applications can silently fail.
                  </p>
                  <p>
                    <strong className="text-black">The Challenge:</strong> Build a system that observes external dependencies, learns their real behaviour, detects meaningful changes, assesses which parts of an application are affected, and automatically adapts—or proposes a safe migration.
                  </p>
                  <div className="p-3 rounded-lg bg-white border border-black/10 font-mono text-[11px] text-black/70">
                    <strong>Core Pipeline:</strong> External service &rarr; Observed behaviour &rarr; Contract / behavioural model &rarr; Change detection &rarr; Impact analysis &rarr; Adapter or migration &rarr; Validation &rarr; Updated system.
                  </div>
                </div>

                {/* 2. Semantic Drift Handling */}
                <div className="p-6 rounded-xl border border-black/10 bg-cream-subtle/50 space-y-3">
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
                <div className="p-6 rounded-xl border border-black/10 bg-cream-subtle/50 space-y-4">
                  <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                    3. Safe-Handling Policy Matrix (Section 10)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] border border-black/10 rounded-lg">
                      <thead className="bg-black/5 text-black">
                        <tr>
                          <th className="p-2.5">Confidence Score</th>
                          <th className="p-2.5">Semantic Verdict</th>
                          <th className="p-2.5">Safe-Handling Action</th>
                          <th className="p-2.5">Production Behavior</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        <tr>
                          <td className="p-2.5 font-bold text-black">&ge; 0.90</td>
                          <td className="p-2.5 text-black">Equivalent</td>
                          <td className="p-2.5 font-bold text-emerald-600">Auto-Apply</td>
                          <td className="p-2.5">Canary adapter injected with rollback handle</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-black">0.70 &le; c &lt; 0.90</td>
                          <td className="p-2.5 text-black">Equivalent</td>
                          <td className="p-2.5 font-bold text-black">Migration PR</td>
                          <td className="p-2.5">Automated PR opened with adapter diff and test suite</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-black">Any score</td>
                          <td className="p-2.5 text-crimson">Lossy</td>
                          <td className="p-2.5 font-bold text-black">Migration PR</td>
                          <td className="p-2.5">Requires human engineering review before deployment</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-crimson">&lt; 0.70</td>
                          <td className="p-2.5 text-black">Any</td>
                          <td className="p-2.5 font-bold text-crimson">Quarantine Alert</td>
                          <td className="p-2.5">No automated changes permitted; alert fired</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-crimson">Any score</td>
                          <td className="p-2.5 font-bold text-crimson">Breaking</td>
                          <td className="p-2.5 font-bold text-crimson">Circuit Breaker</td>
                          <td className="p-2.5">Trips circuit breaker to isolate downstream crash</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. The 10 Mutation Catalogue */}
                <div className="p-6 rounded-xl border border-black/10 bg-cream-subtle/50 space-y-3">
                  <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                    4. The 10 Mutation Catalogue (M1 through M10)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M1:</span> Field Rename (name &rarr; display_name)
                    </div>
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M2:</span> Name Format Shift (Last, First tokenization)
                    </div>
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M3:</span> Unit Shift (dollars float &rarr; cents integer)
                    </div>
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M4:</span> Default Currency Flip (USD &rarr; EUR fallback)
                    </div>
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M5:</span> Pagination (offset deprecated &rarr; opaque cursor)
                    </div>
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M6:</span> Silent Truncation (caps limit 100 &rarr; 20)
                    </div>
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M7:</span> Webhook Flattening (event.type &rarr; type)
                    </div>
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M8:</span> Rate Limit Throttle (HTTP 429 Retry-After)
                    </div>
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M9:</span> MCP Tool Signature Drift (query &rarr; q, limit)
                    </div>
                    <div className="p-2 rounded bg-white border border-black/5">
                      <span className="font-bold text-crimson">M10:</span> Enum Semantics (status: active includes suspended)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Antigravity-Style Footer */}
      <footer className="border-t border-black/10 bg-cream pt-16 pb-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* 4-Column Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
            {/* Column 1: Brand & Core Mission */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center font-display text-white font-extrabold text-xs">
                  <span className="text-crimson font-black">I</span>.
                </div>
                <span className="font-display font-extrabold text-sm tracking-wider text-black">INTRA</span>
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
                <li>&bull; Home (Mission Portal)</li>
                <li>&bull; Dashboard (API Observability)</li>
                <li>&bull; Agent (Autonomous Self-Healing)</li>
                <li>&bull; MCP (Customer Model Context Protocol)</li>
                <li>&bull; SDK (@intra/sdk Dynamic Proxy)</li>
                <li>&bull; Docs (docs/lock.md Problem Solver)</li>
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
