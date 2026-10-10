import { useState } from 'react';
import {
  Activity,
  Layers,
  Sliders,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface MutationToggle {
  id: string;
  name: string;
  service: string;
  desc: string;
  active: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'drift' | 'impact' | 'adapters' | 'switchboard'>('drift');

  const [mutations, setMutations] = useState<MutationToggle[]>([
    { id: 'M1', name: 'Field Rename', service: 'users', desc: 'name -> display_name', active: false },
    { id: 'M2', name: 'Format Shift', service: 'users', desc: '"Last, First" naming order', active: false },
    { id: 'M3', name: 'Unit Shift', service: 'payments', desc: 'dollars (float) -> cents (int)', active: false },
    { id: 'M4', name: 'Default Flip', service: 'payments', desc: 'Default currency USD -> EUR', active: false },
    { id: 'M5', name: 'Pagination Drift', service: 'search', desc: 'offset -> opaque cursor', active: false },
    { id: 'M6', name: 'Silent Truncation', service: 'search', desc: 'Caps page limit 100 -> 20', active: false },
    { id: 'M7', name: 'Webhook Flattening', service: 'notifications', desc: 'event.type -> type', active: false },
    { id: 'M8', name: 'Rate Limit Throttle', service: 'payments', desc: '429 at 5 rps with Retry-After', active: false },
    { id: 'M9', name: 'Signature Drift', service: 'mcp-tool', desc: 'arg query -> q with limit', active: false },
    { id: 'M10', name: 'Enum Drift', service: 'users', desc: 'status active includes suspended', active: false },
  ]);

  const toggleMutation = (id: string) => {
    setMutations((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const resetAllMutations = () => {
    setMutations((prev) => prev.map((m) => ({ ...m, active: false })));
  };

  const activeCount = mutations.filter((m) => m.active).length;

  return (
    <div className="min-h-screen bg-cream text-black dot-grid-pattern selection:bg-crimson/10 selection:text-crimson flex flex-col justify-between">
      {/* 1. React Bits Style Capsule Navbar (Floating Pill Dock) */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <header className="pointer-events-auto bg-white/85 backdrop-blur-xl border border-black/10 shadow-capsule rounded-full px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-4 max-w-4xl w-full transition-all">
          {/* Brand Mark */}
          <div className="flex items-center space-x-2 pl-2">
            <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center font-display text-white font-extrabold text-xs tracking-tighter shadow-sm">
              <span className="text-crimson font-black">I</span>.
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-display font-extrabold text-sm tracking-wider text-black">INTRA</span>
              <span className="hidden md:inline-block verified-badge text-[9px]">ENGINE</span>
            </div>
          </div>

          {/* Capsule Navigation Tabs (Pill style) */}
          <nav className="flex items-center gap-1 p-1 bg-cream-subtle/80 rounded-full border border-black/5">
            <button
              onClick={() => setActiveTab('drift')}
              className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'drift'
                  ? 'bg-black text-white shadow-sm font-semibold'
                  : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Drift Feed</span>
            </button>

            <button
              onClick={() => setActiveTab('impact')}
              className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'impact'
                  ? 'bg-black text-white shadow-sm font-semibold'
                  : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Blast Radius</span>
            </button>

            <button
              onClick={() => setActiveTab('adapters')}
              className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'adapters'
                  ? 'bg-black text-white shadow-sm font-semibold'
                  : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Adapters</span>
            </button>

            <button
              onClick={() => setActiveTab('switchboard')}
              className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'switchboard'
                  ? 'bg-crimson text-white shadow-sm font-semibold'
                  : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Switchboard</span>
              {activeCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-crimson text-[10px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Live Status Indicator */}
          <div className="flex items-center space-x-2 pr-1">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-crimson/10 rounded-full text-crimson text-[11px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-crimson animate-pulse"></span>
              <span className="hidden md:inline">LIVE OBSERVER</span>
            </div>
          </div>
        </header>
      </div>

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16 space-y-8 w-full flex-grow">
        {/* Hero Banner Section */}
        <div className="border border-black/10 bg-white p-7 rounded-2xl shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="verified-badge">AUTONOMOUS UPSTREAM RESILIENCE</span>
              <span className="text-xs font-mono text-black/50">WCAG AA COMPLIANT</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-black">
              Autonomous External Dependency Adaptation
            </h1>
            <p className="text-sm text-black/60 max-w-2xl font-normal leading-relaxed">
              Continuously learning real API behavior from live traffic, detecting semantic drift, and
              auto-synthesizing backward-compatible runtime adapters before production breaks.
            </p>
          </div>

          <div className="flex items-center space-x-6 text-xs font-mono bg-cream-subtle p-3.5 rounded-xl border border-black/5">
            <div className="text-center">
              <div className="text-black/50 uppercase text-[10px] tracking-wider">Observed</div>
              <div className="text-lg font-bold text-black font-display">5 Services</div>
            </div>
            <div className="text-center border-l border-black/10 pl-6">
              <div className="text-black/50 uppercase text-[10px] tracking-wider">Confidence Gate</div>
              <div className="text-lg font-bold text-crimson font-display">≥ 90%</div>
            </div>
            <div className="text-center border-l border-black/10 pl-6">
              <div className="text-black/50 uppercase text-[10px] tracking-wider">Canary Guard</div>
              <div className="text-lg font-bold text-black font-display">Active</div>
            </div>
          </div>
        </div>

        {/* Tab 1: Drift Feed & Change Detection */}
        {activeTab === 'drift' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="border border-black/10 bg-white rounded-2xl p-6 shadow-card">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-black/5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-crimson"></span>
                    <h2 className="font-display font-bold text-black text-sm uppercase tracking-wide">
                      Detected Semantic & Structural Drift
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-black/50">3 active events in window</span>
                </div>

                <div className="space-y-4">
                  {/* Event 1: M1 Rename */}
                  <div className="p-4 border border-crimson/20 bg-crimson/5 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-crimson text-white rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                          RENAME
                        </span>
                        <span className="font-mono text-xs font-semibold text-black">GET /users</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-crimson">CONFIDENCE 95%</div>
                    </div>
                    <p className="text-xs text-black/70">
                      Structural rename detected from traffic overlap. Target field <code className="text-crimson font-semibold">display_name</code> replaces <code className="text-black font-semibold">name</code>.
                    </p>
                    <div className="p-2.5 bg-white rounded-lg border border-black/10 font-mono text-[11px] flex justify-between">
                      <span className="text-black/40 line-through">- name: "Alice Walker"</span>
                      <span className="text-crimson font-bold">+ display_name: "Alice Walker"</span>
                    </div>
                  </div>

                  {/* Event 2: M3 Unit Shift */}
                  <div className="p-4 border border-black/10 bg-white rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-black text-white rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                          UNIT_SHIFT
                        </span>
                        <span className="font-mono text-xs font-semibold text-black">POST /payments/charge</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-black">CONFIDENCE 92%</div>
                    </div>
                    <p className="text-xs text-black/70">
                      Numerical scale shift detected. Float dollars transformed to integer cents multiplier (×100).
                    </p>
                    <div className="p-2.5 bg-cream-subtle rounded-lg border border-black/10 font-mono text-[11px] flex justify-between">
                      <span className="text-black/40 line-through">- amount: 25.0 (dollars)</span>
                      <span className="text-black font-bold">+ amount: 2500 (cents)</span>
                    </div>
                  </div>

                  {/* Event 3: M10 Breaking Enum */}
                  <div className="p-4 border border-crimson/30 bg-crimson/5 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-crimson text-white rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                          BREAKING
                        </span>
                        <span className="font-mono text-xs font-semibold text-black">GET /users (status)</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-crimson">CONFIDENCE 78%</div>
                    </div>
                    <p className="text-xs text-black/70">
                      Enum semantic meaning drift. Value <code className="text-crimson font-semibold">status="active"</code> now includes suspended users. Circuit breaker tripped; auto-apply prohibited.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Monitored Services */}
            <div className="space-y-4">
              <div className="border border-black/10 bg-white rounded-2xl p-6 shadow-card">
                <h3 className="font-display font-bold text-black text-sm uppercase tracking-wide mb-4 pb-2 border-b border-black/5">
                  Observed Dependencies
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Users API', status: 'mutated', endpoints: '/users' },
                    { name: 'Payments API', status: 'mutated', endpoints: '/payments/charge' },
                    { name: 'Search API', status: 'healthy', endpoints: '/search' },
                    { name: 'Notifications', status: 'healthy', endpoints: '/notifications/webhook' },
                    { name: 'MCP Tool Service', status: 'healthy', endpoints: '/mcp-tool/execute' },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-cream-subtle text-xs border border-black/5">
                      <div>
                        <div className="font-semibold text-black">{s.name}</div>
                        <div className="font-mono text-[11px] text-black/50">{s.endpoints}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider ${
                          s.status === 'mutated'
                            ? 'bg-crimson text-white'
                            : 'bg-black text-white'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Workflow Blast Radius */}
        {activeTab === 'impact' && (
          <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
            <div>
              <h2 className="font-display font-bold text-black text-base uppercase tracking-wide">
                Application Workflow Dependency Graph
              </h2>
              <p className="text-xs text-black/60 mt-1">
                Static AST analysis correlates external API contract drift with internal business logic execution paths.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  wf: 'userProfile',
                  file: 'apps/demo-app/src/workflows/userProfile.ts',
                  dep: 'GET /users -> name',
                  status: 'ADAPTED',
                  color: 'border-black/20 bg-cream-subtle',
                  tagColor: 'bg-black text-white',
                },
                {
                  wf: 'checkout',
                  file: 'apps/demo-app/src/workflows/checkout.ts',
                  dep: 'POST /payments/charge -> amount',
                  status: 'ADAPTED',
                  color: 'border-black/20 bg-cream-subtle',
                  tagColor: 'bg-black text-white',
                },
                {
                  wf: 'userAudit',
                  file: 'apps/demo-app/src/workflows/audit.ts',
                  dep: 'GET /users -> status',
                  status: 'QUARANTINED',
                  color: 'border-crimson/30 bg-crimson/5',
                  tagColor: 'bg-crimson text-white',
                },
              ].map((w) => (
                <div key={w.wf} className={`p-5 border rounded-xl space-y-3 ${w.color}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-xs uppercase tracking-wider">{w.wf}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${w.tagColor}`}>
                      {w.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-black/50 truncate">{w.file}</div>
                  <div className="text-xs text-black font-medium">Bound Field: <code className="font-bold">{w.dep}</code></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Adapters & Safe-Handling */}
        {activeTab === 'adapters' && (
          <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
            <div>
              <h2 className="font-display font-bold text-black text-base uppercase tracking-wide">
                Generated Adapters & Safe-Handling Actions
              </h2>
              <p className="text-xs text-black/60 mt-1">
                Auto-applies canary middleware only when confidence ≥ 90% and equivalent; opens migration proposals otherwise.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 border border-black/10 rounded-xl bg-cream-subtle space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-mono text-xs font-bold text-black">
                    ADAPTER: adp_users_rename_v1 (Strategy: rename)
                  </div>
                  <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-mono rounded-full font-bold">
                    AUTO-APPLIED CANARY
                  </span>
                </div>
                <pre className="p-3.5 bg-white border border-black/10 rounded-lg font-mono text-xs text-black overflow-x-auto">
{`export function adaptResponse(data) {
  return data.map(item => ({
    ...item,
    name: item.display_name ?? item.name
  }));
}`}
                </pre>
                <div className="text-xs font-mono text-black/60 flex justify-between">
                  <span>Golden replay tests: 1/1 passed</span>
                  <span className="text-crimson font-medium">Rollback Handle: rollback_users_m1_172856</span>
                </div>
              </div>

              <div className="p-5 border border-crimson/20 rounded-xl bg-crimson/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-mono text-xs font-bold text-crimson">
                    MIGRATION PROPOSAL: prop_users_m10 (Breaking drift)
                  </div>
                  <span className="px-2.5 py-0.5 bg-crimson text-white text-[10px] font-mono rounded-full font-bold">
                    QUARANTINE / AWAITING REVIEW
                  </span>
                </div>
                <p className="text-xs text-black/70">
                  Auto-application rejected: semantic ambiguity cannot be resolved automatically without human engineering intent.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Mutation Switchboard */}
        {activeTab === 'switchboard' && (
          <div className="border border-black/10 bg-white rounded-2xl p-7 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/5">
              <div>
                <h2 className="font-display font-bold text-black text-base uppercase tracking-wide">
                  Undocumented Mutation Catalogue (M1-M10)
                </h2>
                <p className="text-xs text-black/60 mt-1">
                  Toggle live mutations in simulated external dependencies to observe Intra autonomous detection and adaptation.
                </p>
              </div>
              <button
                onClick={resetAllMutations}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium border border-black/20 rounded-full hover:bg-black/5 transition"
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
                    m.active ? 'border-crimson bg-crimson/5 shadow-sm' : 'border-black/10 bg-white hover:border-black/20'
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
      </main>

      {/* 3. Antigravity-Style Footer with Giant Gradient Red "Intra." */}
      <footer className="border-t border-black/10 bg-cream pt-16 pb-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Top 4-Column Layout */}
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

            {/* Column 2: Pipeline Architecture */}
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
              </ul>
            </div>

            {/* Column 4: Safe Handling Policy */}
            <div className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-black text-[11px]">
                Safe-Handling Policy
              </h4>
              <div className="space-y-1.5 text-black/60">
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Confidence ≥ 90%:</span>
                  <span className="font-bold text-black">Auto-Apply</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span>70% ≤ Conf &lt; 90%:</span>
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
            &copy; {new Date().getFullYear()} Intra Monorepo. Autonomous Upstream Resilience Platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
