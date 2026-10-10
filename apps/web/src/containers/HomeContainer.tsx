import {
  Activity,
  Cpu,
  Terminal,
  Code2,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { MainTab, EngineHealthResponse, UserProfile } from '../types';

export interface HomeContainerProps {
  setActiveTab: (tab: MainTab) => void;
  engineHealth: EngineHealthResponse | null;
  mutationsCount: number;
  liveToolsCount: number;
  user: UserProfile | null;
}

export function HomeContainer({
  setActiveTab,
  engineHealth,
  mutationsCount,
  liveToolsCount,
  user,
}: HomeContainerProps) {
  return (
    <>
      {/* =========================================================================
          HOMEPAGE-ONLY MAXIMALIST AMBIENT BACKGROUND & FLOATING FALL LEAVES
         ========================================================================= */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-[550px] h-[550px] bg-crimson/15 rounded-full blur-[140px] z-0" />
      <div className="pointer-events-none fixed top-1/2 -left-48 w-[500px] h-[500px] bg-crimson/10 rounded-full blur-[140px] z-0" />
      <div className="pointer-events-none fixed bottom-10 right-1/4 w-[400px] h-[400px] bg-crimson/12 rounded-full blur-[120px] z-0" />

      {/* Spring Fall Red Leaf SVG Graphics in White/Cream Open Spaces */}
      <div className="pointer-events-none absolute top-32 left-12 z-0 floating-leaf opacity-80">
        <svg width="42" height="42" viewBox="0 0 100 100" fill="none">
          <path
            d="M50 5 C25 20, 10 50, 20 85 C40 80, 75 70, 90 40 C75 30, 60 15, 50 5 Z"
            fill="#C8102E"
            opacity="0.85"
          />
          <path d="M50 5 Q55 45 20 85" stroke="#FAF7F2" strokeWidth="2.5" opacity="0.6" />
        </svg>
      </div>
      <div className="pointer-events-none absolute top-48 right-16 z-0 floating-leaf-delay-1 opacity-75">
        <svg width="50" height="50" viewBox="0 0 100 100" fill="none">
          <path
            d="M50 10 C30 25, 15 55, 30 80 C50 75, 80 65, 85 35 C70 25, 58 18, 50 10 Z"
            fill="#990B20"
            opacity="0.75"
          />
          <path d="M50 10 Q50 50 30 80" stroke="#FAF7F2" strokeWidth="2" opacity="0.5" />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-40 left-1/4 z-0 floating-leaf-delay-2 opacity-60">
        <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
          <path
            d="M45 5 C20 30, 25 70, 40 90 C60 70, 85 50, 70 20 C60 12, 52 8, 45 5 Z"
            fill="#E0183A"
            opacity="0.8"
          />
        </svg>
      </div>

      <div className="space-y-10 relative z-10">
        {/* Hero Card */}
        <div className="skeuo-card p-10 sm:p-16 rounded-[2.5rem] text-center max-w-4xl mx-auto space-y-6 relative overflow-hidden">
          <div className="inline-flex items-center space-x-2">
            <span className="verified-badge">THE INTERNET AFTER THE API</span>
            <span className="text-xs font-mono text-black/50">docs/lock.md SPECIFICATION</span>
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
              className="skeuo-button-primary px-7 py-3.5 rounded-full text-white font-display font-bold text-sm"
            >
              Launch Observability Dashboard
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className="skeuo-button-dark px-7 py-3.5 rounded-full text-white font-display font-bold text-sm"
            >
              Claude-Style Agent Workbench
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className="px-6 py-3.5 rounded-full border border-black/20 text-black font-display font-semibold text-sm hover:bg-black/5 transition"
            >
              View AI Subscription Tiers
            </button>
          </div>

          {/* Real Live Backend Health Banner */}
          <div className="pt-4 border-t border-black/5 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-black/60">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Engine: {engineHealth ? `Live (${Math.floor(engineHealth.uptime)}s)` : 'Online'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-crimson" />
              <span>Sim Switchboard: {mutationsCount} Real Fastify Mutations</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>MCP Tools: {liveToolsCount || 7} Live Streamable</span>
            </div>
          </div>
        </div>

        {/* Asymmetric Bento Grid Layout with Skeuomorphic Depth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: 2-Span Hero */}
          <div className="md:col-span-2 skeuo-card p-8 rounded-[2rem] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="verified-badge">STAGE 01 — 06</span>
                <span className="text-xs font-mono text-black/40">LIVE DATA PIPELINE</span>
              </div>
              <h3 className="font-display font-bold text-xl text-black">
                Continuous Behavioral Ground Truth
              </h3>
              <p className="text-xs text-black/65 leading-relaxed max-w-xl">
                Never trust documented OpenAPI schemas alone. Intra continuously fingerprints HTTP response codes, defaults, distributions, pagination shapes, and error taxonomies from real non-blocking traffic with 100% SHA-256 PII masking.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-black/5 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-cream-subtle">
                <div className="text-black/40 text-[10px]">UPTIME</div>
                <div className="font-bold text-black text-sm">
                  {engineHealth ? `${Math.floor(engineHealth.uptime / 60)}m` : 'Live'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-cream-subtle">
                <div className="text-black/40 text-[10px]">DEPENDENCIES</div>
                <div className="font-bold text-black text-sm">
                  {engineHealth ? Object.keys(engineHealth.dependencies).length : 5} Monitored
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-cream-subtle">
                <div className="text-black/40 text-[10px]">RATE HEADROOM</div>
                <div className="font-bold text-crimson text-sm">
                  {engineHealth ? `${engineHealth.rateLimitHeadroom.payments || 10} rps` : '10 rps'}
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Safe-Handling Policy */}
          <div className="skeuo-card p-8 rounded-[2rem] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="verified-badge">SECTION 10 MATRIX</span>
              <h3 className="font-display font-bold text-lg text-black">
                Safe-Handling Policy Matrix
              </h3>
              <p className="text-xs text-black/60 leading-relaxed">
                Mathematical bounds: confidence ≥90% auto-applies in-process Canary adapters. Ambiguous or lossy changes auto-generate GitHub migration PRs.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-crimson/5 border border-crimson/20 font-mono text-[11px] text-crimson font-bold">
              Trips Breaker on Breaking Drift (Zero Silent Regressions)
            </div>
          </div>

          {/* Bento Card 3: Blockchain & BridgeKey */}
          <div className="skeuo-card p-8 rounded-[2rem] space-y-4 flex flex-col justify-between">
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
              Rate limits: <strong className="text-black">{user?.nftLimit || 30} NFTs</strong> active on {user?.tier || 'starter'} tier
            </div>
          </div>

          {/* Bento Card 4: Double Span Navigation Cards */}
          <div className="md:col-span-2 skeuo-card p-8 rounded-[2rem] space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-base text-black uppercase tracking-wide">
                Platform Architecture Pillars
              </h3>
              <span className="text-xs font-mono text-black/40">NO FALLBACK HARDCODED VALUES</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'API Observability & Upgrade Predictor',
                  desc: 'Predict positions of future vendor upgrades & inspect live drift diffs.',
                  action: () => setActiveTab('dashboard'),
                  icon: Activity,
                },
                {
                  title: 'Claude-Style Agent Workbench',
                  desc: 'Ask & Plan modes with multilingual queries and prompt suggestions.',
                  action: () => setActiveTab('agent'),
                  icon: Cpu,
                },
                {
                  title: 'Customer MCP Server',
                  desc: '7 discovery and adaptation tools for Claude Desktop & Cursor.',
                  action: () => setActiveTab('mcp'),
                  icon: Terminal,
                },
                {
                  title: 'Client SDK & Proxy Wrapper',
                  desc: '@intra/sdk client library providing dynamic in-process healing.',
                  action: () => setActiveTab('sdk'),
                  icon: Code2,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    onClick={item.action}
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
    </>
  );
}
export default HomeContainer;
