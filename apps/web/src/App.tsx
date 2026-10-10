import { useState } from 'react';
import {
  Activity,
  Layers,
  Sliders,
  Zap,
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

  return (
    <div className="min-h-screen washi-pattern pb-16">
      {/* Top Navigation */}
      <header className="border-b border-sumi/10 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Japanese Enso motif circle */}
            <div className="w-8 h-8 rounded-full border-2 border-crimson flex items-center justify-center font-display text-crimson font-bold text-sm">
              円
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-wide text-sumi">INTRA</span>
              <span className="ml-2 text-xs font-mono text-ash uppercase">自律型適応基盤</span>
            </div>
            <div className="hanko-badge text-[10px] ml-2">VERIFIED</div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-crimson-tint rounded text-crimson text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-crimson animate-pulse"></span>
              <span>LIVE OBSERVER ACTIVE</span>
            </div>
            <button
              onClick={() => setActiveTab('switchboard')}
              className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 border border-sumi/20 rounded hover:bg-sumi/5 transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Switchboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Hero Section */}
        <div className="border border-sumi/10 bg-white p-6 rounded shadow-washi flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-sumi">
              Autonomous External Dependency Adaptation
            </h1>
            <p className="text-sm text-ash max-w-2xl">
              Continuously learning real API behaviour from live traffic, detecting semantic drift, and
              auto-synthesizing backward-compatible adapters before production breaks.
            </p>
          </div>
          <div className="flex items-center space-x-6 text-xs font-mono">
            <div className="text-center">
              <div className="text-ash uppercase">Observed</div>
              <div className="text-lg font-bold text-sumi">5 Services</div>
            </div>
            <div className="text-center border-l border-sumi/10 pl-6">
              <div className="text-ash uppercase">Confidence Gate</div>
              <div className="text-lg font-bold text-crimson">≥ 90%</div>
            </div>
            <div className="text-center border-l border-sumi/10 pl-6">
              <div className="text-ash uppercase">Auto-Repair</div>
              <div className="text-lg font-bold text-sumi">Canary Active</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-sumi/10 space-x-8 text-sm font-medium">
          <button
            onClick={() => setActiveTab('drift')}
            className={`pb-3 flex items-center space-x-2 transition ${
              activeTab === 'drift'
                ? 'border-b-2 border-crimson text-crimson font-semibold'
                : 'text-ash hover:text-sumi'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Drift Feed & Change Detection</span>
          </button>
          <button
            onClick={() => setActiveTab('impact')}
            className={`pb-3 flex items-center space-x-2 transition ${
              activeTab === 'impact'
                ? 'border-b-2 border-crimson text-crimson font-semibold'
                : 'text-ash hover:text-sumi'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Workflow Blast Radius</span>
          </button>
          <button
            onClick={() => setActiveTab('adapters')}
            className={`pb-3 flex items-center space-x-2 transition ${
              activeTab === 'adapters'
                ? 'border-b-2 border-crimson text-crimson font-semibold'
                : 'text-ash hover:text-sumi'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Adapters & Safe-Handling</span>
          </button>
          <button
            onClick={() => setActiveTab('switchboard')}
            className={`pb-3 flex items-center space-x-2 transition ${
              activeTab === 'switchboard'
                ? 'border-b-2 border-crimson text-crimson font-semibold'
                : 'text-ash hover:text-sumi'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Mutation Switchboard (M1-M10)</span>
          </button>
        </div>

        {/* Tab 1: Drift Feed */}
        {activeTab === 'drift' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="border border-sumi/10 bg-white rounded p-5 shadow-washi">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-crimson"></span>
                    <h2 className="font-semibold text-sumi text-sm">Detected Semantic & Structural Drift</h2>
                  </div>
                  <span className="text-xs font-mono text-ash">Showing 3 active events</span>
                </div>

                <div className="space-y-4">
                  {/* Event 1 */}
                  <div className="p-4 border border-crimson/20 bg-crimson-tint/40 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-crimson text-white rounded text-[11px] font-mono font-semibold">
                          RENAME
                        </span>
                        <span className="font-mono text-xs font-medium text-sumi">GET /users</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-crimson">CONFIDENCE 95%</div>
                    </div>
                    <p className="text-xs text-ash">
                      Structural rename detected from traffic overlap. Target field <code className="text-crimson">display_name</code> replaces <code className="text-sumi">name</code>.
                    </p>
                    <div className="p-2 bg-white rounded border border-sumi/10 font-mono text-[11px] flex justify-between">
                      <span className="text-ash line-through">- name: "Alice Walker"</span>
                      <span className="text-crimson font-bold">+ display_name: "Alice Walker"</span>
                    </div>
                  </div>

                  {/* Event 2 */}
                  <div className="p-4 border border-sumi/10 bg-white rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 border border-sumi text-sumi rounded text-[11px] font-mono font-semibold">
                          UNIT_SHIFT
                        </span>
                        <span className="font-mono text-xs font-medium text-sumi">POST /payments/charge</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-sumi">CONFIDENCE 92%</div>
                    </div>
                    <p className="text-xs text-ash">
                      Numerical scale shift detected. Float dollars transformed to integer cents multiplier (×100).
                    </p>
                    <div className="p-2 bg-washi rounded border border-sumi/10 font-mono text-[11px] flex justify-between">
                      <span className="text-ash line-through">- amount: 25.0 (dollars)</span>
                      <span className="text-sumi font-bold">+ amount: 2500 (cents)</span>
                    </div>
                  </div>

                  {/* Event 3 */}
                  <div className="p-4 border border-crimson/30 bg-crimson-tint/20 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-crimson text-white rounded text-[11px] font-mono font-semibold">
                          BREAKING
                        </span>
                        <span className="font-mono text-xs font-medium text-sumi">GET /users (status)</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-crimson">CONFIDENCE 78%</div>
                    </div>
                    <p className="text-xs text-ash">
                      Enum semantic meaning drift. <code className="text-crimson">status="active"</code> now includes suspended users. Auto-apply prohibited.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Monitored Services */}
            <div className="space-y-4">
              <div className="border border-sumi/10 bg-white rounded p-5 shadow-washi">
                <h3 className="font-semibold text-sumi text-sm mb-3">Observed Dependencies</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Users API', status: 'mutated', endpoints: '/users' },
                    { name: 'Payments API', status: 'mutated', endpoints: '/payments/charge' },
                    { name: 'Search API', status: 'healthy', endpoints: '/search' },
                    { name: 'Notifications', status: 'healthy', endpoints: '/notifications/webhook' },
                    { name: 'MCP Tool Service', status: 'healthy', endpoints: '/mcp-tool/execute' },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center justify-between p-2.5 rounded bg-washi text-xs">
                      <div>
                        <div className="font-medium text-sumi">{s.name}</div>
                        <div className="font-mono text-[11px] text-ash">{s.endpoints}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          s.status === 'mutated'
                            ? 'bg-crimson text-white'
                            : 'border border-sumi/20 text-sumi'
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
          <div className="border border-sumi/10 bg-white rounded p-6 shadow-washi space-y-6">
            <div>
              <h2 className="font-semibold text-sumi text-base">Application Workflow Dependency Graph</h2>
              <p className="text-xs text-ash">
                AST analysis correlates external API contract drift with internal business logic execution paths.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  wf: 'userProfile',
                  file: 'apps/demo-app/src/workflows/userProfile.ts',
                  dep: 'GET /users -> name',
                  status: 'ADAPTED',
                  color: 'text-sumi border-sumi',
                },
                {
                  wf: 'checkout',
                  file: 'apps/demo-app/src/workflows/checkout.ts',
                  dep: 'POST /payments/charge -> amount',
                  status: 'ADAPTED',
                  color: 'text-sumi border-sumi',
                },
                {
                  wf: 'userAudit',
                  file: 'apps/demo-app/src/workflows/audit.ts',
                  dep: 'GET /users -> status',
                  status: 'QUARANTINED',
                  color: 'text-crimson border-crimson bg-crimson-tint/30',
                },
              ].map((w) => (
                <div key={w.wf} className={`p-4 border rounded space-y-3 ${w.color}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-xs uppercase">{w.wf}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-current font-bold">
                      {w.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-ash truncate">{w.file}</div>
                  <div className="text-xs text-sumi font-medium">Bound Field: {w.dep}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Adapters & Safe-Handling */}
        {activeTab === 'adapters' && (
          <div className="border border-sumi/10 bg-white rounded p-6 shadow-washi space-y-6">
            <div>
              <h2 className="font-semibold text-sumi text-base">Generated Adapters & Safe-Handling Actions</h2>
              <p className="text-xs text-ash">
                Auto-applies canary middleware only when confidence ≥ 90% and equivalent; opens migration PRs otherwise.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-sumi/10 rounded bg-washi space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-mono text-xs font-bold text-sumi">
                    ADAPTER: adp_users_rename_v1 (Strategy: rename)
                  </div>
                  <span className="px-2 py-0.5 bg-sumi text-white text-[10px] font-mono rounded font-semibold">
                    AUTO-APPLIED CANARY
                  </span>
                </div>
                <pre className="p-3 bg-white border border-sumi/10 rounded font-mono text-xs text-sumi overflow-x-auto">
{`export function adaptResponse(data) {
  return data.map(item => ({
    ...item,
    name: item.display_name ?? item.name
  }));
}`}
                </pre>
                <div className="text-xs font-mono text-ash flex justify-between">
                  <span>Golden tests: 1/1 passed</span>
                  <span className="text-crimson font-medium">Rollback Handle: rollback_users_m1_172856</span>
                </div>
              </div>

              <div className="p-4 border border-crimson/20 rounded bg-crimson-tint/20 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-mono text-xs font-bold text-crimson">
                    MIGRATION PROPOSAL: prop_users_m10 (Breaking drift)
                  </div>
                  <span className="px-2 py-0.5 bg-crimson text-white text-[10px] font-mono rounded font-semibold">
                    QUARANTINE / AWAITING REVIEW
                  </span>
                </div>
                <p className="text-xs text-ash">
                  Auto-application rejected: semantic ambiguity cannot be resolved automatically without human engineering intent.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Mutation Switchboard */}
        {activeTab === 'switchboard' && (
          <div className="border border-sumi/10 bg-white rounded p-6 shadow-washi space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-sumi text-base">Undocumented Mutation Catalogue (M1-M10)</h2>
                <p className="text-xs text-ash">
                  Toggle live mutations in simulated external dependencies to observe Intra autonomous detection and adaptation.
                </p>
              </div>
              <button
                onClick={() => setMutations((prev) => prev.map((m) => ({ ...m, active: false })))}
                className="px-3 py-1.5 text-xs font-medium border border-sumi/20 rounded hover:bg-sumi/5 transition"
              >
                Reset All to Baseline
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mutations.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 border rounded flex items-center justify-between transition ${
                    m.active ? 'border-crimson bg-crimson-tint/30' : 'border-sumi/10 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-crimson">{m.id}</span>
                      <span className="font-medium text-xs text-sumi">{m.name}</span>
                      <span className="text-[10px] font-mono text-ash uppercase">[{m.service}]</span>
                    </div>
                    <div className="text-xs text-ash">{m.desc}</div>
                  </div>
                  <button
                    onClick={() => toggleMutation(m.id)}
                    className={`px-3 py-1 text-xs font-mono font-semibold rounded transition ${
                      m.active
                        ? 'bg-crimson text-white'
                        : 'border border-sumi/20 text-sumi hover:bg-sumi/5'
                    }`}
                  >
                    {m.active ? 'ACTIVE' : 'BASELINE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
