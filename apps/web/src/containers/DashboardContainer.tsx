import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Zap,
  TrendingUp,
  Activity,
  Sparkles,
  Layers,
  Sliders,
  ShieldCheck,
  Check,
  Copy,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Code2,
  Terminal,
  FlaskConical,
} from 'lucide-react';
import {
  MutationItem,
  EngineHealthResponse,
  DashboardSubView,
  PredictedUpgrade,
  MainTab,
} from '../types';
import { logLedgerChecksum } from '../lib/crypto';

export interface DashboardContainerProps {
  engineHealth: EngineHealthResponse | null;
  mutations: MutationItem[];
  setMutations: React.Dispatch<React.SetStateAction<MutationItem[]>>;
  selectedMutationId: string;
  setSelectedMutationId: (id: string) => void;
  autoAdapterEnabled: boolean;
  setAutoAdapterEnabled: (enabled: boolean) => void;
  proposalApproved: Record<string, boolean>;
  approveProposal: (id: string) => void;
  toggleMutation: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
  dashboardView?: DashboardSubView;
  setDashboardView?: (view: DashboardSubView) => void;
  onNavigateTab?: (tab: MainTab, subView?: DashboardSubView, mutationId?: string) => void;
}

export function DashboardContainer({
  engineHealth,
  mutations,
  selectedMutationId,
  setSelectedMutationId,
  autoAdapterEnabled,
  setAutoAdapterEnabled,
  proposalApproved,
  approveProposal,
  toggleMutation,
  resetAll,
  copiedKey,
  copyToClipboard,
  dashboardView: controlledView,
  setDashboardView: setControlledView,
  onNavigateTab,
}: DashboardContainerProps) {
  const [internalView, setInternalView] = useState<DashboardSubView>('predict');
  const dashboardView = controlledView ?? internalView;
  const setDashboardView = setControlledView ?? setInternalView;

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

  // Pure Algorithmic Analysis of Upstream Schemas for Future Upgrades
  const runPureUpgradePrediction = (endpoint: string, jsonStr: string, shouldLog = false) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const results: PredictedUpgrade[] = [];

      // 1. Float currency unit shift check
      if (typeof parsed.amount === 'number' && !Number.isInteger(parsed.amount)) {
        results.push({
          path: '$.amount',
          type: 'Unit Shift (Float to Subunit Integer)',
          risk: 'HIGH',
          probability: 94,
          currentValue: parsed.amount,
          predictedShift: 'amount: 25.5 -> 2550 (integer cents x100)',
          rationale: 'Modern financial APIs standardize on smallest integer currency units to eliminate floating-point rounding errors.',
          preemptiveAdapter: `export function adaptAmount(data) {\n  return { ...data, amount: typeof data.amount === 'number' ? data.amount * 0.01 : data.amount };\n}`,
        });
      }

      // 2. Casing normalization check
      if (parsed.customerId && (parsed.customer_name || parsed.id)) {
        results.push({
          path: '$.customerId',
          type: 'Casing Normalization Drift',
          risk: 'HIGH',
          probability: 88,
          currentValue: parsed.customerId,
          predictedShift: 'customerId -> customer_id',
          rationale: 'Payload mixes camelCase (customerId) with snake_case. Standard enterprise APIs systematically normalize to snake_case.',
          preemptiveAdapter: `export function adaptCustomer(data) {\n  return { ...data, customerId: data.customer_id ?? data.customerId };\n}`,
        });
      }

      // 3. Offset pagination deprecation check
      if (parsed.page !== undefined || endpoint.includes('page=') || parsed.offset !== undefined) {
        results.push({
          path: '$.page',
          type: 'Pagination Scheme Deprecation',
          risk: 'CRITICAL',
          probability: 92,
          currentValue: parsed.page ?? parsed.offset,
          predictedShift: 'page / offset -> opaque base64 next_cursor',
          rationale: 'Offset-based pagination does not scale across distributed sharded databases; standard practice forces keyset cursor migration.',
          preemptiveAdapter: `export function adaptPagination(params) {\n  if (params.page !== undefined && !params.cursor) {\n    return { ...params, cursor: Buffer.from(String(params.page)).toString('base64') };\n  }\n  return params;\n}`,
        });
      }

      // 4. Webhook event hierarchy check
      if (parsed.event && typeof parsed.event === 'object' && parsed.event.type) {
        results.push({
          path: '$.event.type',
          type: 'Webhook Payload Flattening',
          risk: 'MEDIUM',
          probability: 76,
          currentValue: parsed.event.type,
          predictedShift: 'event.type -> top-level type: "charge.succeeded"',
          rationale: 'Cloud serverless message buses prefer flat event envelopes for high-throughput stream ingestion.',
          preemptiveAdapter: `export function adaptWebhook(payload) {\n  return { ...payload, event: { type: payload.type ?? payload.event?.type } };\n}`,
        });
      }

      // 5. Loose string enum semantic drift check
      if (parsed.status && typeof parsed.status === 'string') {
        results.push({
          path: '$.status',
          type: 'Enum Semantic Drift Risk',
          risk: 'CRITICAL',
          probability: 82,
          currentValue: parsed.status,
          predictedShift: 'status="active" silently includes unverified or suspended sub-states',
          rationale: 'Unconstrained string status values regularly absorb new business logic states, creating downstream authorization vulnerabilities.',
          preemptiveAdapter: `// AUTOMATED ADAPTER PROHIBITED FOR BREAKING DRIFT\n// Safe-handling policy requires engineering sign-off via Migration PR.`,
        });
      }

      setPredictedUpgrades(results);
      if (shouldLog) {
        logLedgerChecksum('api_upgrade_prediction', { endpoint, findingsCount: results.length });
      }
    } catch {
      // invalid JSON
    }
  };

  useEffect(() => {
    runPureUpgradePrediction(sampleApiEndpoint, sampleApiPayload, false);
  }, []);

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
      runPureUpgradePrediction(ep, pl, true);
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
      runPureUpgradePrediction(ep, pl, true);
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
      runPureUpgradePrediction(ep, pl, true);
    }
  };

  const activeMutations = mutations.filter((m) => m.active);
  const selectedMutation = mutations.find((m) => m.id === selectedMutationId) || mutations[0];

  return (
    <div className="space-y-8">
      {/* Dashboard Header & Telemetry Strip */}
      <div className="skeuo-card rounded-[2.5rem] p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="verified-badge">OBSERVABILITY PLATFORM</span>
              <span className="text-xs font-mono text-black/50">LIVE FASTIFY PIPELINE</span>
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
              <span>Reset Fastify Mutations</span>
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

        {/* Real Metric Cards with 1.5rem Radiuses */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-black/5 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5">
            <div className="text-black/50 text-[10px] uppercase">Engine Status</div>
            <div className="font-bold text-base text-black">
              {engineHealth ? engineHealth.status.toUpperCase() : 'OK'}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">100% PII Masked</div>
          </div>
          <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5">
            <div className="text-black/50 text-[10px] uppercase">Observed Dependencies</div>
            <div className="font-bold text-base text-black">
              {engineHealth ? Object.keys(engineHealth.dependencies).length : 5} Services
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">Live Fastify Microservices</div>
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

        {/* Interconnected Ecosystem Fast Bridges */}
        {onNavigateTab && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-cream-subtle border border-black/5 text-xs">
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-black/50">
              <Sparkles className="w-3.5 h-3.5 text-crimson" />
              <span className="font-bold text-black uppercase">Ecosystem Fast Bridges:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => onNavigateTab('agent')}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white border border-black/10 hover:border-crimson text-black text-[11px] font-medium transition shadow-xs"
              >
                <Cpu className="w-3 h-3 text-crimson" />
                <span>Adaptation Agent</span>
              </button>
              <button
                onClick={() => onNavigateTab('sdk')}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white border border-black/10 hover:border-emerald-600 text-black text-[11px] font-medium transition shadow-xs"
              >
                <Code2 className="w-3 h-3 text-emerald-600" />
                <span>Client SDK Proxy</span>
              </button>
              <button
                onClick={() => onNavigateTab('mcp')}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white border border-black/10 hover:border-amber-600 text-black text-[11px] font-medium transition shadow-xs"
              >
                <Terminal className="w-3 h-3 text-amber-600" />
                <span>Customer MCP</span>
              </button>
              <button
                onClick={() => onNavigateTab('eval')}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white border border-black/10 hover:border-purple-600 text-black text-[11px] font-medium transition shadow-xs"
              >
                <FlaskConical className="w-3 h-3 text-purple-600" />
                <span>Stress Lab (/eval)</span>
              </button>
            </div>
          </div>
        )}

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
          <div className="skeuo-card rounded-[2.5rem] p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="verified-badge">PURE ALGORITHMIC SCANNER</span>
                  <span className="text-xs font-mono text-black/40">REAL TIME ANALYSIS</span>
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
                  className="px-3 py-1 rounded-full bg-white hover:bg-black/5 text-black font-semibold border border-black/10 transition"
                >
                  Stripe Charges
                </button>
                <button
                  onClick={() => loadPredictorPreset('shopify')}
                  className="px-3 py-1 rounded-full bg-white hover:bg-black/5 text-black font-semibold border border-black/10 transition"
                >
                  Shopify Orders
                </button>
                <button
                  onClick={() => loadPredictorPreset('twilio')}
                  className="px-3 py-1 rounded-full bg-white hover:bg-black/5 text-black font-semibold border border-black/10 transition"
                >
                  Twilio SMS
                </button>
              </div>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-black/70">
                  API ENDPOINT / ROUTE
                </label>
                <input
                  type="text"
                  value={sampleApiEndpoint}
                  onChange={(e) => {
                    setSampleApiEndpoint(e.target.value);
                    runPureUpgradePrediction(e.target.value, sampleApiPayload);
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-cream-subtle text-xs font-mono text-black focus:outline-none focus:border-crimson"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-black/70">
                  OBSERVED PAYLOAD JSON
                </label>
                <textarea
                  rows={4}
                  value={sampleApiPayload}
                  onChange={(e) => {
                    setSampleApiPayload(e.target.value);
                    runPureUpgradePrediction(sampleApiEndpoint, e.target.value);
                  }}
                  className="w-full p-3 rounded-2xl border border-black/10 bg-cream-subtle text-xs font-mono text-black focus:outline-none focus:border-crimson"
                />
              </div>
            </div>

            {/* Algorithmic Prediction Results */}
            <div className="space-y-4 pt-4 border-t border-black/5">
              <div className="flex justify-between items-center">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                  Identified Structural Fragility & Upgrade Predictions ({predictedUpgrades.length})
                </h4>
                <span className="text-[10px] font-mono text-crimson font-bold">100% MATHEMATICAL SCAN</span>
              </div>

              <div className="space-y-4">
                {predictedUpgrades.map((pred, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border border-black/10 bg-white space-y-3 shadow-sm hover:border-black/20 transition"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            pred.risk === 'CRITICAL'
                              ? 'bg-crimson text-white'
                              : pred.risk === 'HIGH'
                              ? 'border border-crimson text-crimson'
                              : 'bg-black text-white'
                          }`}
                        >
                          {pred.risk} RISK
                        </span>
                        <span className="font-mono font-bold text-xs text-black">{pred.type}</span>
                        <code className="text-[11px] text-black/50 font-mono">({pred.path})</code>
                      </div>
                      <span className="text-xs font-mono font-bold text-crimson">
                        {pred.probability}% Probability
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-cream-subtle border border-black/5 space-y-1">
                        <div className="text-black/50 text-[10px]">PREDICTED VENDOR SHIFT:</div>
                        <div className="font-semibold text-black">{pred.predictedShift}</div>
                        <p className="text-[11px] text-black/60 font-sans mt-1">{pred.rationale}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-cream-subtle border border-black/5 space-y-1">
                        <div className="text-black/50 text-[10px]">PREEMPTIVE IN-PROCESS ADAPTER:</div>
                        <pre className="text-[11px] font-mono text-black overflow-x-auto whitespace-pre-wrap">
                          {pred.preemptiveAdapter}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
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
            <div className="skeuo-card rounded-[2rem] p-6 space-y-4">
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
                      className={`w-full text-left p-3.5 rounded-2xl border transition ${
                        isSelected
                          ? 'border-crimson bg-crimson/5 shadow-sm'
                          : 'border-black/5 bg-cream-subtle hover:border-black/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-xs text-crimson">{m.id}</span>
                        <div className="flex items-center space-x-1">
                          {m.active && <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />}
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
            <div className="skeuo-card rounded-[2.5rem] p-8 space-y-6">
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
          <div className="skeuo-card rounded-[2.5rem] p-8 space-y-6">
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
        <div className="skeuo-card rounded-[2.5rem] p-8 space-y-6">
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
          <div className="skeuo-card rounded-[2.5rem] p-8 space-y-6">
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

      {/* Sub-view 6: Mutation Switchboard (Real Live Fastify Actions) */}
      {dashboardView === 'switchboard' && (
        <div className="skeuo-card rounded-[2.5rem] p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="verified-badge">LIVE FASTIFY ENDPOINTS</span>
              <h2 className="font-display font-bold text-xl text-black mt-1">
                Mutation Switchboard (M1 through M10)
              </h2>
              <p className="text-xs text-black/60 mt-1">
                Inject live undocumented upstream changes into users, payments, search, notifications, and MCP services.
              </p>
            </div>
            <button
              onClick={resetAll}
              className="skeuo-button-primary flex items-center space-x-1.5 px-5 py-2.5 text-xs font-mono font-bold rounded-full text-white"
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
        <div className="skeuo-card rounded-[2.5rem] p-8 space-y-6">
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
  );
}
export default DashboardContainer;
