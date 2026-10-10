import { useState } from 'react';
import {
  Home,
  Sparkles,
  Activity,
  Layers,
  Zap,
  Sliders,
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Code2,
  Cpu,
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'overview' | 'drift' | 'impact' | 'adapters' | 'switchboard' | 'mcp'>('home');
  const [selectedMutationId, setSelectedMutationId] = useState<string>('M1');
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>('intra_recent_changes');
  const [autoAdapterEnabled, setAutoAdapterEnabled] = useState<boolean>(true);
  const [proposalApproved, setProposalApproved] = useState<Record<string, boolean>>({});

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
            className="pointer-events-auto cursor-pointer flex items-center space-x-2 bg-white/90 backdrop-blur-xl border border-black/10 shadow-sm rounded-full px-3 py-1.5 hover:border-black/30 transition"
          >
            <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center font-display text-white font-extrabold text-[10px]">
              <span className="text-crimson font-black">I</span>.
            </div>
            <span className="font-display font-extrabold text-xs tracking-wider text-black">INTRA</span>
            <span className="text-[9px] font-mono text-black/40 border-l border-black/10 pl-1.5 hidden sm:inline">v0.1</span>
          </div>

          {/* Center: React Bits Capsule Dock */}
          <nav className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-black/10 shadow-capsule rounded-full p-1.5 flex items-center gap-1 sm:gap-1.5 transition-all">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'overview', label: 'Pipeline', icon: Sparkles },
              { id: 'drift', label: 'Drift', icon: Activity },
              { id: 'impact', label: 'Impact', icon: Layers },
              { id: 'adapters', label: 'Adapters', icon: Zap },
              { id: 'switchboard', label: 'Switchboard', icon: Sliders, badge: activeMutations.length },
              { id: 'mcp', label: 'MCP', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? tab.id === 'switchboard'
                        ? 'bg-crimson text-white shadow-sm font-semibold'
                        : 'bg-black text-white shadow-sm font-semibold'
                      : 'text-black/70 hover:text-black hover:bg-black/5'
                  }`}
                >
                  {/* React Bits active tubelight glow lamp */}
                  {isActive && (
                    <span
                      className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full ${
                        tab.id === 'switchboard' ? 'bg-crimson' : 'bg-black'
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
          <div className="pointer-events-auto hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-xl rounded-full border border-black/10 shadow-sm text-crimson text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
            <span className="text-[11px]">LIVE OBSERVER</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16 space-y-8 w-full flex-grow">
        {/* =========================================================================
            TAB 0: HOMEPAGE (LANDING & MISSION CONTROL)
           ========================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="border border-black/10 bg-white p-8 sm:p-12 rounded-3xl shadow-card text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center space-x-2">
                <span className="verified-badge">INTRODUCING INTRA v0.1.0</span>
                <span className="text-xs font-mono text-black/50">AUTONOMOUS UPSTREAM RESILIENCE</span>
              </div>

              <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-black leading-tight">
                Software That Heals Its Own Dependencies.
              </h1>

              <p className="text-base sm:text-lg text-black/70 max-w-2xl mx-auto font-normal leading-relaxed">
                When upstream APIs flip defaults, alter pagination shapes, rename fields, or throttle rate limits, Intra automatically learns, isolates blast-radius, and synthesizes backward-compatible adapters before production crashes.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setActiveTab('switchboard')}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full bg-crimson text-white font-display font-bold text-sm hover:bg-crimson-hover transition shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Launch Live Simulation</span>
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full bg-black text-white font-display font-bold text-sm hover:bg-black/80 transition shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Explore 6-Stage Pipeline</span>
                </button>
                <button
                  onClick={() => setActiveTab('drift')}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full border border-black/20 text-black font-display font-bold text-sm hover:bg-black/5 transition"
                >
                  <Activity className="w-4 h-4" />
                  <span>View Drift Feed</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-black/10 text-xs font-mono">
                <div>
                  <div className="text-black/40 uppercase text-[10px]">Observed Services</div>
                  <div className="text-xl font-bold font-display text-black">5 Services</div>
                </div>
                <div>
                  <div className="text-black/40 uppercase text-[10px]">Mutations Covered</div>
                  <div className="text-xl font-bold font-display text-crimson">10 Catalogued</div>
                </div>
                <div>
                  <div className="text-black/40 uppercase text-[10px]">Confidence Gate</div>
                  <div className="text-xl font-bold font-display text-black">&ge; 90% Auto-Apply</div>
                </div>
                <div>
                  <div className="text-black/40 uppercase text-[10px]">Verification</div>
                  <div className="text-xl font-bold font-display text-crimson">100% CI Green</div>
                </div>
              </div>
            </div>

            {/* Three Value Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-black/10 bg-white p-7 rounded-2xl shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-base text-black">Behavioral Ground Truth</h3>
                <p className="text-xs text-black/60 leading-relaxed">
                  Static OpenAPI specs and docs drift constantly. Intra observes real live HTTP payloads, discovering true distributions, nullabilities, pagination styles, and undocumented rate limits.
                </p>
              </div>

              <div className="border border-black/10 bg-white p-7 rounded-2xl shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-crimson text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-base text-black">Safe-Handling Policy Matrix</h3>
                <p className="text-xs text-black/60 leading-relaxed">
                  Never guess blindly. High confidence equivalent changes auto-apply with atomic rollback handles. Ambiguous or lossy changes generate human-reviewed Migration PR proposals.
                </p>
              </div>

              <div className="border border-black/10 bg-white p-7 rounded-2xl shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-base text-black">Mathematical Golden Replay</h3>
                <p className="text-xs text-black/60 leading-relaxed">
                  Every synthesized adapter is validated against historical golden workflow traces to guarantee semantic equivalence before code touches production.
                </p>
              </div>
            </div>

            {/* Live Interactive Navigation Jump Cards */}
            <div className="border border-black/10 bg-white p-8 rounded-2xl shadow-card space-y-6">
              <h3 className="font-display font-bold text-base uppercase tracking-wide text-black">
                Interactive System Navigation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: '6-Stage Monolith Pipeline',
                    desc: 'Observe -> Model -> Differ -> Impact -> Adapter -> Validate.',
                    tab: 'overview',
                    icon: Sparkles,
                  },
                  {
                    title: 'Drift Feed & Diff Inspector',
                    desc: 'Inspect detected renames, unit shifts, and confidence scores.',
                    tab: 'drift',
                    icon: Activity,
                  },
                  {
                    title: 'AST Blast Radius Graph',
                    desc: 'Trace upstream changes to internal codebase files & workflows.',
                    tab: 'impact',
                    icon: Layers,
                  },
                  {
                    title: 'Safe Adapters & PRs',
                    desc: 'Inspect Canary code, rollback handles, and pending migration PRs.',
                    tab: 'adapters',
                    icon: Zap,
                  },
                  {
                    title: 'Mutation Switchboard (M1-M10)',
                    desc: 'Toggle live API mutations and watch applications self-heal.',
                    tab: 'switchboard',
                    icon: Sliders,
                  },
                  {
                    title: 'Customer MCP Server (7 Tools)',
                    desc: 'Test Model Context Protocol tools for Cursor, Claude & AI agents.',
                    tab: 'mcp',
                    icon: Terminal,
                  },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.tab}
                      onClick={() => setActiveTab(c.tab as any)}
                      className="p-5 rounded-xl border border-black/10 bg-cream-subtle/50 text-left hover:border-black/30 hover:bg-cream-subtle transition flex flex-col justify-between space-y-3 group"
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
                        <span>Open View</span>
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
            TAB 1: PIPELINE & ARCHITECTURE OVERVIEW
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-black/5">
                <div>
                  <h2 className="font-display font-bold text-black text-lg uppercase tracking-wide">
                    The 6-Stage Autonomous Adaptation Engine
                  </h2>
                  <p className="text-xs text-black/60 mt-1">
                    How Intra intercepts, fingerprints, classifies, isolates, and repairs undocumented API mutations.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('switchboard')}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold bg-crimson text-white rounded-full hover:bg-crimson-hover transition shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch Live Simulation</span>
                </button>
              </div>

              {/* 6 Stage Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    num: '01',
                    title: 'Traffic Observer',
                    pkg: '@intra/observer',
                    desc: 'Non-blocking async capture of HTTP, webhook, and MCP traffic. Automatically strips and redacts PII/tokens before storage.',
                    signal: 'Deep PII Redaction & Latency Index',
                  },
                  {
                    num: '02',
                    title: 'Behavioral Modeler',
                    pkg: '@intra/model',
                    desc: 'Derives statistical ground truth contracts from real payload observations. Infers nullability, value distributions, cardinalities, and pagination styles.',
                    signal: 'Statistical Behavioral Fingerprints',
                  },
                  {
                    num: '03',
                    title: 'Semantic Differ',
                    pkg: '@intra/differ',
                    desc: 'Discovers renames, unit shifts, default flips, and enum drift. Assigns confidence scores (0.0-1.0) and 4-tier semantic verdicts.',
                    signal: 'Confidence Gated Scoring (0.0 - 1.0)',
                  },
                  {
                    num: '04',
                    title: 'AST Blast Radius',
                    pkg: '@intra/impact',
                    desc: 'Analyzes application code AST and dependency graphs to map which workflows and files touch changed fields.',
                    signal: 'Pinpoint Workflow Risk Graph',
                  },
                  {
                    num: '05',
                    title: 'Safe-Handling Policy',
                    pkg: '@intra/adapter',
                    desc: 'Synthesizes runtime compatibility adapters with atomic rollback handles. Enforces Canary auto-apply or escalates to Migration PRs.',
                    signal: 'Canary Auto-Apply & Rollback Handles',
                  },
                  {
                    num: '06',
                    title: 'Golden Replayer',
                    pkg: '@intra/validator',
                    desc: 'Executes recorded golden workflow traces through synthesized adapters to guarantee semantic equivalence before deployment.',
                    signal: 'Mathematical Equivalence Verification',
                  },
                ].map((st) => (
                  <div key={st.num} className="p-5 border border-black/10 rounded-xl bg-cream-subtle/60 hover:border-black/30 transition space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-display font-extrabold text-sm text-crimson">{st.num}</span>
                      <span className="font-mono text-[10px] text-black/50 px-2 py-0.5 rounded bg-black/5">{st.pkg}</span>
                    </div>
                    <h3 className="font-display font-bold text-sm text-black">{st.title}</h3>
                    <p className="text-xs text-black/60 leading-relaxed">{st.desc}</p>
                    <div className="pt-2 border-t border-black/5 flex items-center space-x-1.5 text-[11px] font-mono font-semibold text-black/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                      <span>{st.signal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Downstream Resilience Card */}
            <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-black text-base uppercase tracking-wide">
                    Downstream Application Health (Shipwell Logistics App)
                  </h3>
                  <p className="text-xs text-black/60 mt-1">
                    Simulates real-world application resilience when external dependencies mutate in production.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-black/60">Auto-Adapter Shield:</span>
                  <button
                    onClick={() => setAutoAdapterEnabled(!autoAdapterEnabled)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition ${
                      autoAdapterEnabled ? 'bg-black text-white' : 'bg-crimson text-white'
                    }`}
                  >
                    {autoAdapterEnabled ? 'ENABLED (SHIELD ON)' : 'DISABLED (RAW TRAFFIC)'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    name: 'UserProfile Workflow',
                    ep: 'GET /users',
                    m: mutations.find((m) => m.id === 'M1')!,
                  },
                  {
                    name: 'Checkout Workflow',
                    ep: 'POST /payments/charge',
                    m: mutations.find((m) => m.id === 'M3')!,
                  },
                  {
                    name: 'UserAudit Security Workflow',
                    ep: 'GET /users (status)',
                    m: mutations.find((m) => m.id === 'M10')!,
                  },
                ].map((item) => {
                  const isMutated = item.m.active;
                  const isShielded = autoAdapterEnabled && item.m.verdict !== 'breaking';
                  const isHealthy = !isMutated || isShielded;

                  return (
                    <div
                      key={item.name}
                      className={`p-5 border rounded-xl space-y-3 transition ${
                        isHealthy ? 'border-black/10 bg-cream-subtle' : 'border-crimson bg-crimson/5'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-xs text-black">{item.name}</span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isHealthy ? 'bg-black text-white' : 'bg-crimson text-white'
                          }`}
                        >
                          {isHealthy ? 'GREEN / OPERATIONAL' : 'RED / BROKEN'}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-black/50">{item.ep}</div>
                      <div className="text-xs">
                        {isHealthy ? (
                          <div className="text-black/70 flex items-start space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-black mt-0.5 flex-shrink-0" />
                            <span>
                              {isMutated
                                ? `Self-healed via synthesized runtime adapter (${item.m.id})`
                                : 'Consuming standard baseline upstream contract'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-crimson font-medium flex items-start space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-crimson mt-0.5 flex-shrink-0" />
                            <span>{item.m.brokenError}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: DRIFT DETECTION & CONFIDENCE SCORING
           ========================================================================= */}
        {activeTab === 'drift' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Drift List */}
            <div className="lg:col-span-1 space-y-3">
              <div className="border border-black/10 bg-white rounded-2xl p-5 shadow-card space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wide text-black">
                    Detected API Mutations
                  </h3>
                  <span className="text-[11px] font-mono text-black/50">{mutations.length} catalogued</span>
                </div>

                <div className="space-y-2">
                  {mutations.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMutationId(m.id)}
                      className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                        selectedMutationId === m.id
                          ? 'border-black bg-black text-white'
                          : m.active
                          ? 'border-crimson/30 bg-crimson/5 hover:bg-crimson/10'
                          : 'border-black/10 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono text-xs font-bold ${selectedMutationId === m.id ? 'text-white' : 'text-crimson'}`}>
                            {m.id}
                          </span>
                          <span className="text-xs font-semibold">{m.name}</span>
                        </div>
                        <div className={`text-[10px] font-mono ${selectedMutationId === m.id ? 'text-white/70' : 'text-black/50'}`}>
                          {m.endpoint}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            selectedMutationId === m.id
                              ? 'bg-white text-black'
                              : m.verdict === 'breaking'
                              ? 'bg-crimson text-white'
                              : m.verdict === 'lossy'
                              ? 'bg-black text-white'
                              : 'border border-black/20 text-black'
                          }`}
                        >
                          {m.verdict}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Detailed Inspector */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-black/5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-crimson">{selectedMutation.id}</span>
                      <h2 className="font-display font-bold text-lg text-black">{selectedMutation.name}</h2>
                      <span className="text-xs font-mono text-black/50 uppercase">[{selectedMutation.service}]</span>
                    </div>
                    <p className="text-xs text-black/60">{selectedMutation.desc}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-black/50 uppercase">Confidence Score</div>
                      <div className="text-base font-display font-extrabold text-crimson">
                        {(selectedMutation.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        selectedMutation.verdict === 'breaking'
                          ? 'bg-crimson text-white'
                          : selectedMutation.verdict === 'lossy'
                          ? 'bg-black text-white'
                          : 'border border-black/20 text-black'
                      }`}
                    >
                      {selectedMutation.verdict}
                    </span>
                  </div>
                </div>

                {/* Diff */}
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                    Live Payload Structural Diff
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-black/10 bg-cream-subtle space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-mono text-black/50">
                        <span>Baseline Ground Truth</span>
                        <span className="text-black/40">- Previous</span>
                      </div>
                      <pre className="text-xs font-mono text-black/80 overflow-x-auto whitespace-pre-wrap">
                        {selectedMutation.beforeSnippet}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl border border-crimson/20 bg-crimson/5 space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-mono text-crimson">
                        <span>Mutated Observation Window</span>
                        <span className="font-bold">+ Detected</span>
                      </div>
                      <pre className="text-xs font-mono text-crimson font-medium overflow-x-auto whitespace-pre-wrap">
                        {selectedMutation.afterSnippet}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Evidence Metrics */}
                <div className="p-4 rounded-xl border border-black/10 bg-cream-subtle/70 space-y-2">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                    Statistical Evidence & Analysis
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-black/50">Levenshtein Similarity:</span>{' '}
                      <span className="font-bold text-black">{(selectedMutation.confidence * 0.98).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-black/50">Sample Overlap:</span>{' '}
                      <span className="font-bold text-black">100% (5/5 req)</span>
                    </div>
                    <div>
                      <span className="text-black/50">Observed Window:</span>{' '}
                      <span className="font-bold text-black">Recent 10 samples</span>
                    </div>
                  </div>
                </div>

                {/* Adapter Code */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                      Synthesized Runtime Compatibility Adapter
                    </h4>
                    <span className="text-[10px] font-mono text-black/50">Strategy: {selectedMutation.kind}</span>
                  </div>
                  <pre className="p-4 bg-white border border-black/10 rounded-xl font-mono text-xs text-black overflow-x-auto">
                    {selectedMutation.adapterCode}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: BLAST RADIUS & AST GRAPH
           ========================================================================= */}
        {activeTab === 'impact' && (
          <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-black/5">
              <div>
                <h2 className="font-display font-bold text-black text-lg uppercase tracking-wide">
                  Application Workflow Blast Radius Graph
                </h2>
                <p className="text-xs text-black/60 mt-1">
                  Static AST analysis traces external API fields to internal business logic execution paths across your codebase.
                </p>
              </div>
              <span className="verified-badge">AST SCAN COMPLETE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  wf: 'userProfile',
                  file: 'apps/demo-app/src/workflows/userProfile.ts',
                  dep: 'GET /users -> name',
                  change: 'M1 Field Rename (name -> display_name)',
                  severity: 'LOW',
                  status: 'ADAPTED BY CANARY',
                  action: 'Safe-Handling applied transparent response adapter',
                  tagColor: 'bg-black text-white',
                },
                {
                  wf: 'checkout',
                  file: 'apps/demo-app/src/workflows/checkout.ts',
                  dep: 'POST /payments/charge -> amount',
                  change: 'M3 Unit Shift (dollars -> cents x100)',
                  severity: 'MEDIUM',
                  status: 'ADAPTED BY CANARY',
                  action: 'Math transform x0.01 protects financial ledger',
                  tagColor: 'bg-black text-white',
                },
                {
                  wf: 'userAudit (Security)',
                  file: 'apps/demo-app/src/workflows/audit.ts',
                  dep: 'GET /users -> status',
                  change: 'M10 Enum Semantic Drift (active includes suspended)',
                  severity: 'CRITICAL',
                  status: 'CIRCUIT BREAKER TRIPPED',
                  action: 'Quarantined to prevent privilege escalation to suspended users',
                  tagColor: 'bg-crimson text-white',
                },
                {
                  wf: 'searchBrowse',
                  file: 'apps/demo-app/src/workflows/searchBrowse.ts',
                  dep: 'GET /search -> offset',
                  change: 'M5 Pagination Offset to Cursor',
                  severity: 'MEDIUM',
                  status: 'ADAPTED BY CANARY',
                  action: 'Request adapter normalizes legacy offset to base64 cursor',
                  tagColor: 'bg-black text-white',
                },
                {
                  wf: 'notificationAck',
                  file: 'apps/demo-app/src/workflows/notifications.ts',
                  dep: 'POST /notifications/webhook -> event.type',
                  change: 'M7 Webhook Payload Flattening',
                  severity: 'LOW',
                  status: 'ADAPTED BY CANARY',
                  action: 'Webhook wrapper restores nested event.type shape',
                  tagColor: 'bg-black text-white',
                },
                {
                  wf: 'mcpAssistantCall',
                  file: 'apps/demo-app/src/workflows/mcpAssistant.ts',
                  dep: 'POST /mcp-tool/execute -> query',
                  change: 'M9 Tool Signature Argument Drift',
                  severity: 'LOW',
                  status: 'ADAPTED BY CANARY',
                  action: 'SDK transparently remaps query to q + injects limit',
                  tagColor: 'bg-black text-white',
                },
              ].map((b) => (
                <div key={b.wf} className="p-5 border border-black/10 rounded-xl bg-cream-subtle/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-xs uppercase tracking-wider text-black">{b.wf}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${b.tagColor}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-black/50 truncate">{b.file}</div>
                  <div className="p-2.5 rounded bg-white border border-black/5 text-xs space-y-1">
                    <div className="font-semibold text-black">{b.change}</div>
                    <div className="text-[11px] text-black/60">{b.action}</div>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-black/60 pt-2 border-t border-black/5">
                    <span>Severity: <strong className={b.severity === 'CRITICAL' ? 'text-crimson' : 'text-black'}>{b.severity}</strong></span>
                    <span>Field: {b.dep.split('->')[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: SAFE ADAPTERS & MIGRATION PROPOSALS
           ========================================================================= */}
        {activeTab === 'adapters' && (
          <div className="space-y-6">
            <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-black/5">
                <div>
                  <h2 className="font-display font-bold text-black text-lg uppercase tracking-wide">
                    Safe-Handling Policy Matrix (§10) & Canary Adapters
                  </h2>
                  <p className="text-xs text-black/60 mt-1">
                    Auto-applies canary middleware only when confidence &ge; 90% and equivalent; requires human-in-the-loop review otherwise.
                  </p>
                </div>
                <div className="text-xs font-mono text-black/60">
                  Canaries Active: <strong className="text-black">4</strong> &bull; Pending PRs: <strong className="text-crimson">2</strong>
                </div>
              </div>

              {/* Active Canaries */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                  Auto-Applied Canary Adapters (Confidence &ge; 90%)
                </h3>

                {[
                  {
                    id: 'adp_users_rename_v1',
                    service: 'users',
                    change: 'M1 Field Rename (name -> display_name)',
                    code: 'export function adaptResponse(data) {\n  return data.map(item => ({ ...item, name: item.display_name ?? item.name }));\n}',
                    rollback: 'rollback_users_m1_172856',
                    replays: '5/5 passed',
                  },
                  {
                    id: 'adp_payments_unit_v1',
                    service: 'payments',
                    change: 'M3 Unit Shift (dollars -> cents)',
                    code: 'export function adaptResponse(data) {\n  return { ...data, amount: typeof data.amount === "number" ? data.amount * 0.01 : data.amount };\n}',
                    rollback: 'rollback_payments_m3_849201',
                    replays: '5/5 passed',
                  },
                ].map((canary) => (
                  <div key={canary.id} className="p-5 border border-black/10 rounded-xl bg-cream-subtle space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-black">{canary.id}</span>
                        <span className="px-2 py-0.5 bg-black text-white text-[9px] font-mono rounded-full font-bold">
                          CANARY ACTIVE
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-black/50">Replay: {canary.replays}</span>
                        <button
                          onClick={() => alert(`Atomic rollback initiated for ${canary.rollback}. Baseline restored.`)}
                          className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono border border-black/20 hover:bg-black hover:text-white transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rollback Handle</span>
                        </button>
                      </div>
                    </div>
                    <pre className="p-3 bg-white border border-black/10 rounded-lg font-mono text-xs text-black overflow-x-auto">
                      {canary.code}
                    </pre>
                  </div>
                ))}
              </div>

              {/* Pending PRs */}
              <div className="space-y-4 pt-4 border-t border-black/5">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-crimson">
                  Pending Human Review Migration Proposals (Lossy or Breaking)
                </h3>

                {[
                  {
                    id: 'prop_users_m10',
                    service: 'users',
                    kind: 'M10 Enum Semantic Drift',
                    desc: 'Upstream vendor now includes suspended users inside status="active". Automated fix prohibited.',
                    risk: 'HIGH: Security breach risk. Downstream admin authorization could grant suspended accounts access.',
                    diff: '--- status check relies on "active"\n+++ Requires upstream query param: GET /users?exclude_suspended=true',
                  },
                  {
                    id: 'prop_users_m2',
                    service: 'users',
                    kind: 'M2 Name Format Shift',
                    desc: 'Format shifted to "Last, First". Automated splitting works for two-word names, but risks corruption on hyphenated or multi-word surnames.',
                    risk: 'MEDIUM: Lossy semantic format transformation.',
                    diff: '+++ Split by ", " and invert order to "First Last"',
                  },
                ].map((prop) => {
                  const isApproved = proposalApproved[prop.id];
                  return (
                    <div key={prop.id} className="p-5 border border-crimson/20 rounded-xl bg-crimson/5 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-crimson">{prop.id}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-mono rounded-full font-bold ${isApproved ? 'bg-black text-white' : 'bg-crimson text-white'}`}>
                            {isApproved ? 'APPROVED & DEPLOYED' : 'REQUIRES HUMAN SIGN-OFF'}
                          </span>
                        </div>
                        {!isApproved ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => approveProposal(prop.id)}
                              className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black text-white hover:bg-black/80 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Approve & Apply Proposal</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-semibold text-black">Migration PR merged into branch main</span>
                        )}
                      </div>
                      <p className="text-xs text-black/70">{prop.desc}</p>
                      <div className="p-3 bg-white border border-black/10 rounded font-mono text-[11px] text-crimson font-medium">
                        Risk Assessment: {prop.risk}
                      </div>
                      <pre className="p-3 bg-cream-subtle border border-black/10 rounded font-mono text-xs text-black overflow-x-auto">
                        {prop.diff}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: MUTATION SWITCHBOARD (M1 - M10)
           ========================================================================= */}
        {activeTab === 'switchboard' && (
          <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/5">
              <div>
                <h2 className="font-display font-bold text-black text-lg uppercase tracking-wide">
                  Undocumented Mutation Switchboard (M1 - M10)
                </h2>
                <p className="text-xs text-black/60 mt-1">
                  Inject live API mutations into simulated external dependencies to watch Intra autonomously heal applications.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={resetAll}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium border border-black/20 rounded-full hover:bg-black/5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All to Baseline</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mutations.map((m) => (
                <div
                  key={m.id}
                  className={`p-5 border rounded-xl flex flex-col justify-between space-y-3 transition duration-200 ${
                    m.active ? 'border-crimson bg-crimson/5 shadow-sm' : 'border-black/10 bg-white hover:border-black/20'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-crimson">{m.id}</span>
                        <span className="font-semibold text-xs text-black">{m.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-black/40 uppercase">[{m.service}]</span>
                    </div>
                    <div className="text-xs text-black/60">{m.desc}</div>
                    <div className="text-[11px] font-mono text-black/50">{m.endpoint}</div>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-black/50">
                      Confidence: <strong>{(m.confidence * 100).toFixed(0)}%</strong> ({m.verdict})
                    </span>
                    <button
                      onClick={() => toggleMutation(m.id)}
                      className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-full transition ${
                        m.active
                          ? 'bg-crimson text-white shadow-sm'
                          : 'border border-black/20 text-black hover:bg-black/5'
                      }`}
                    >
                      {m.active ? 'MUTATION ACTIVE' : 'INJECT MUTATION'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: CUSTOMER MCP SERVER PLAYGROUND
           ========================================================================= */}
        {activeTab === 'mcp' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 border border-black/10 bg-white rounded-2xl p-5 shadow-card space-y-4">
              <div className="pb-2 border-b border-black/5">
                <h3 className="font-display font-bold text-xs uppercase tracking-wide text-black">
                  Customer MCP Tools (7 Tools)
                </h3>
                <p className="text-[11px] text-black/50 mt-0.5">Exposed to AI coding agents via Streamable HTTP</p>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'intra_list_dependencies', desc: 'Lists all observed third-party services' },
                  { name: 'intra_get_contract', desc: 'Queries learned contract for a service endpoint' },
                  { name: 'intra_recent_changes', desc: 'Fetches recent semantic and structural drift' },
                  { name: 'intra_impact', desc: 'Calculates blast-radius on application workflows' },
                  { name: 'intra_propose_adapter', desc: 'Generates compatibility adapter diff & plan' },
                  { name: 'intra_apply_adapter', desc: 'Applies human-reviewed adapter proposal' },
                  { name: 'intra_health', desc: 'Checks upstream dependency health & rate limits' },
                ].map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => setSelectedMcpTool(tool.name)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      selectedMcpTool === tool.name
                        ? 'border-black bg-black text-white'
                        : 'border-black/10 bg-white hover:border-black/20'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold">{tool.name}</div>
                    <div className={`text-[10px] truncate ${selectedMcpTool === tool.name ? 'text-white/70' : 'text-black/50'}`}>
                      {tool.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
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
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                  Tool Response JSON
                </h4>
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
        )}
      </main>

      {/* 3. Antigravity-Style Footer */}
      <footer className="border-t border-black/10 bg-cream pt-16 pb-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* 4-Column Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
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

            <div className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-black text-[11px]">
                Monolith Pipeline
              </h4>
              <ul className="space-y-1.5 text-black/60 font-mono text-[11px]">
                <li>1. Non-blocking Traffic Observer</li>
                <li>2. Statistical Contract Fingerprint</li>
                <li>3. Semantic & Structural Differ</li>
                <li>4. AST Blast Radius Mapper</li>
                <li>5. Safe-Handling Policy Engine</li>
                <li>6. Golden Workflow Replay Engine</li>
              </ul>
            </div>

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
              </ul>
            </div>

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

          {/* Giant Antigravity Headline */}
          <div className="relative overflow-hidden pt-6 pb-2 text-center select-none pointer-events-none">
            <span className="font-display font-black text-6xl sm:text-8xl md:text-[11rem] lg:text-[14rem] xl:text-[16rem] leading-none tracking-tighter antigravity-hero-text block">
              Intra.
            </span>
          </div>

          <div className="text-center font-mono text-[11px] text-black/40">
            &copy; {new Date().getFullYear()} Intra Monorepo. Autonomous Upstream Resilience Platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
