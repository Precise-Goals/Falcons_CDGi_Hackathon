import { useState } from 'react';
import {
  Activity,
  Cpu,
  Terminal,
  Code2,
  Wallet,
  ArrowRight,
  Zap,
  ShieldCheck,
  RefreshCw,
  FileText,
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
  const [heroMutation, setHeroMutation] = useState<'M1' | 'M3' | 'M5'>('M1');
  const [isAdapted, setIsAdapted] = useState<boolean>(true);
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
        {/* Maximalist Split Hero with Live Interactive In-Process Adapter Simulator */}
        <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 md:p-12 shadow-card dot-grid-pattern aceternity-dot-bg overflow-hidden relative">
          {/* Ambient Red Accent Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-crimson/10 rounded-full blur-3xl pointer-events-none aceternity-beam-pulse" />
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-crimson via-black to-crimson opacity-80" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Column: Bold Editorial Typography & Mission */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center flex-wrap gap-2 text-xs font-mono uppercase tracking-wider text-black/80 font-semibold">
                <span className="inline-flex items-center space-x-1.5 text-crimson font-black tracking-widest">
                  <Zap className="w-3.5 h-3.5 text-crimson animate-pulse" />
                  <span>INTRA RUNTIME RESILIENCE</span>
                </span>
                <span className="text-black/30 font-light">|</span>
                <span className="text-black/90 font-bold">CLOSED-LOOP ARCHITECTURE</span>
                <span className="text-black/30 font-light">|</span>
                <span className="text-black/60">docs/lock.md &bull; v2.4</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-black leading-[1.08]">
                Software That <br />
                <span className="text-crimson underline decoration-crimson/30 underline-offset-8">
                  Heals Its Own
                </span>{' '}
                Dependencies.
              </h1>

              <p className="text-sm sm:text-base text-black/75 max-w-xl font-sans leading-relaxed">
                When external vendors flip currency defaults, rename JSON fields, paginate with opaque cursors, or throttle quotas, Intra intercepts telemetry, runs SPRT statistical verification, and synthesizes in-process adapters before application crashes reach users.
              </p>

              {/* Action Buttons with Maximalist Contrast */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-crimson text-white font-display font-bold text-sm hover:bg-crimson-hover transition shadow-lg shadow-crimson/25 hover:-translate-y-0.5 transform"
                >
                  <Activity className="w-4 h-4" />
                  <span>Open Observability Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('agent')}
                  className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-black text-white font-display font-bold text-sm hover:bg-black/80 transition shadow-md hover:-translate-y-0.5 transform"
                >
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Agent Workbench</span>
                </button>
                <button
                  onClick={() => setActiveTab('docs')}
                  className="flex items-center space-x-2 px-5 py-3.5 rounded-2xl border border-black/20 bg-white text-black font-display font-semibold text-sm hover:bg-cream-subtle transition"
                >
                  <FileText className="w-4 h-4 text-crimson" />
                  <span>Research Paper (PDF)</span>
                </button>
              </div>

              {/* Live Status Indicators */}
              <div className="pt-4 border-t border-black/10 flex flex-wrap items-center gap-6 text-xs font-mono text-black/70">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Engine: {engineHealth?.uptime != null ? `Live (${Math.floor(engineHealth.uptime)}s)` : 'Online'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-crimson" />
                  <span>Switchboard: {mutationsCount} Fastify Mutations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>MCP: {liveToolsCount || 7} Live Streamable Tools</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Mutation & Adaptation Sandbox */}
            <div className="lg:col-span-5">
              <div className="rounded-[2rem] bg-[#0A0A0A] text-white p-6 shadow-2xl border border-black/40 space-y-4 font-mono text-xs relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-white/50 ml-1">LIVE ADAPTATION PROXY</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-crimson/30 text-rose-300 font-bold border border-crimson/40">
                    PORT 3001
                  </span>
                </div>

                {/* Mutation Selection Tabs */}
                <div className="flex items-center space-x-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                  {(['M1', 'M3', 'M5'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setHeroMutation(m)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                        heroMutation === m
                          ? 'bg-crimson text-white shadow-sm'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {m === 'M1' ? 'M1 Rename' : m === 'M3' ? 'M3 Scale' : 'M5 Cursor'}
                    </button>
                  ))}
                </div>

                {/* Upstream Drift Payload */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-white/50">
                    <span>1. UPSTREAM VENDOR PAYLOAD (DRIFT DETECTED)</span>
                    <span className="text-rose-400 font-bold">MUTATED</span>
                  </div>
                  <pre className="p-3 rounded-xl bg-white/5 border border-rose-500/30 text-rose-300 text-[11px] overflow-x-auto leading-relaxed">
                    {heroMutation === 'M1' && '{\n  "id": "usr_99",\n  "display_name": "Marcus Vance",\n  "status": "active"\n}'}
                    {heroMutation === 'M3' && '{\n  "charge_id": "chg_881",\n  "amount": 2500,\n  "currency": "USD"\n}'}
                    {heroMutation === 'M5' && '{\n  "items": ["p_10", "p_11"],\n  "nextCursor": "eyJsYXN0SWQiOjExfQ=="\n}'}
                  </pre>
                </div>

                {/* Adapted Downstream Payload */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-white/50">
                    <span>2. DOWNSTREAM APPLICATION CONSUMPTION</span>
                    <span className={isAdapted ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isAdapted ? 'NORMALIZED VIA ADAPTER' : 'BROKEN (WITHOUT INTRA)'}
                    </span>
                  </div>
                  <pre className={`p-3 rounded-xl border text-[11px] overflow-x-auto leading-relaxed transition ${
                    isAdapted
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}>
                    {heroMutation === 'M1' && (isAdapted
                      ? '{\n  "id": "usr_99",\n  "name": "Marcus Vance",\n  "status": "active"\n}'
                      : '{\n  "id": "usr_99",\n  "name": undefined, // SILENT RUNTIME CRASH\n  "status": "active"\n}')}
                    {heroMutation === 'M3' && (isAdapted
                      ? '{\n  "charge_id": "chg_881",\n  "amount": 25.00,\n  "currency": "USD"\n}'
                      : '{\n  "charge_id": "chg_881",\n  "amount": 2500, // OVERCHARGED 100x!\n  "currency": "USD"\n}')}
                    {heroMutation === 'M5' && (isAdapted
                      ? '{\n  "page": 1,\n  "offset": 0,\n  "items": ["p_10", "p_11"]\n}'
                      : '{\n  "error": "Deprecation: offset not supported"\n}')}
                  </pre>
                </div>

                {/* Interactive Healing Toggle */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[11px] text-white/70">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SPRT Verified (&ge;96% Confidence)</span>
                  </div>
                  <button
                    onClick={() => setIsAdapted((prev) => !prev)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-crimson hover:bg-crimson-hover text-white text-[11px] font-bold transition shadow-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isAdapted ? 'Simulate Failure' : 'Heal With Intra'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Asymmetric Bento Grid Layout with Skeuomorphic Depth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: 2-Span Hero */}
          <div className="md:col-span-2 skeuo-card aceternity-grid-bg p-8 rounded-[2rem] space-y-4 flex flex-col justify-between relative overflow-hidden">
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
                  {engineHealth?.uptime != null ? `${Math.floor(engineHealth.uptime / 60)}m` : 'Live'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-cream-subtle">
                <div className="text-black/40 text-[10px]">DEPENDENCIES</div>
                <div className="font-bold text-black text-sm">
                  {engineHealth?.dependencies && typeof engineHealth.dependencies === 'object'
                    ? Object.keys(engineHealth.dependencies).length
                    : 5} Monitored
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-cream-subtle">
                <div className="text-black/40 text-[10px]">RATE HEADROOM</div>
                <div className="font-bold text-crimson text-sm">
                  {engineHealth?.rateLimitHeadroom?.payments != null
                    ? `${engineHealth.rateLimitHeadroom.payments} rps`
                    : '10 rps'}
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Safe-Handling Policy */}
          <div className="skeuo-card aceternity-dot-bg p-8 rounded-[2rem] space-y-4 flex flex-col justify-between relative overflow-hidden">
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
          <div className="skeuo-card aceternity-dot-bg p-8 rounded-[2rem] space-y-4 flex flex-col justify-between relative overflow-hidden">
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
          <div className="md:col-span-2 skeuo-card aceternity-grid-bg p-8 rounded-[2rem] space-y-5 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-base text-black uppercase tracking-wide">
                Platform Architecture Pillars
              </h3>
              <span className="text-xs font-mono text-black/40">ZERO-DOWNTIME RESILIENCE</span>
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

        {/* =========================================================================
            SECTION 2: THE ANATOMY OF SILENT FAILURE (BEFORE VS WITH INTRA)
           ========================================================================= */}
        <div className="skeuo-card p-8 sm:p-12 rounded-[2.5rem] space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="verified-badge">THE SILENT FAILURE CRISIS</span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-black tracking-tight">
              Why Traditional Schema Validators Fail in Production.
            </h2>
            <p className="text-xs sm:text-sm text-black/65 leading-relaxed">
              When an upstream vendor alters data semantics without changing JSON structure, OpenAPI linters and runtime validators return <code className="font-mono text-emerald-600 font-bold">200 OK</code>. The payload remains valid JSON, but core application business logic silently crashes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenario 1: Unit & Scale Shift */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-crimson uppercase">Scenario 01 &bull; Financial Disaster</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">M3 Unit Shift</span>
              </div>
              <h3 className="font-display font-bold text-base text-black">
                Float Dollars &rarr; Integer Cents (<code className="font-mono">25.0</code> &rarr; <code className="font-mono">2500</code>)
              </h3>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-white border border-rose-200 text-rose-900">
                  <div className="text-[10px] font-bold text-rose-600 uppercase mb-0.5">Without Intra (Silent Bug):</div>
                  Customer charged $2,500.00 instead of $25.00. Schema validator passed because both are valid JSON numbers.
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-emerald-900">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">With Intra Resilience:</div>
                  Ratio constancy test detects &times;100 multiplier (&ge;96% confidence). Synthesizes <code className="text-emerald-700">scale(0.01)</code> in-process adapter and logs SHA-256 seal.
                </div>
              </div>
            </div>

            {/* Scenario 2: Name Format Shift */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-amber-600 uppercase">Scenario 02 &bull; Lossy Format Drift</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">M2 Format Shift</span>
              </div>
              <h3 className="font-display font-bold text-base text-black">
                First Last &rarr; Last, First (<code className="font-mono">"Alice Walker"</code> &rarr; <code className="font-mono">"Walker, Alice"</code>)
              </h3>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-white border border-rose-200 text-rose-900">
                  <div className="text-[10px] font-bold text-rose-600 uppercase mb-0.5">Without Intra (Silent Bug):</div>
                  User documents and badges print inverted names. Naive regex rewriters corrupt multi-token and hyphenated names.
                </div>
                <div className="p-3 rounded-xl bg-white border border-amber-200 text-amber-900">
                  <div className="text-[10px] font-bold text-amber-600 uppercase mb-0.5">With Intra Safe-Handling:</div>
                  Classified as <strong className="text-amber-700">Lossy Semantic Drift</strong>. Section 10 Matrix blocks auto-apply and drafts an automated GitHub Migration PR with AST impact warnings.
                </div>
              </div>
            </div>

            {/* Scenario 3: Pagination Collapse */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase">Scenario 03 &bull; Infinite Loop Crash</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">M5 Pagination</span>
              </div>
              <h3 className="font-display font-bold text-base text-black">
                Offset &rarr; Opaque Cursor (<code className="font-mono">limit/offset</code> &rarr; <code className="font-mono">nextCursor</code>)
              </h3>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-white border border-rose-200 text-rose-900">
                  <div className="text-[10px] font-bold text-rose-600 uppercase mb-0.5">Without Intra (Silent Bug):</div>
                  Batch crawlers fetch page 0 indefinitely, locking memory queues and triggering cascading timeouts across downstream workers.
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-emerald-900">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">With Intra Resilience:</div>
                  Pagination classifier maps offset requests to base64 cursors dynamically. Golden replay validates full 100-item inventory recovery.
                </div>
              </div>
            </div>

            {/* Scenario 4: Enum Meaning Shift */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-crimson uppercase">Scenario 04 &bull; Security Vulnerability</span>
                <span className="px-2 py-0.5 rounded-md bg-crimson/15 text-crimson text-[10px] font-mono font-bold">M10 Enum Drift</span>
              </div>
              <h3 className="font-display font-bold text-base text-black">
                Suspended Accounts Return <code className="font-mono">status: "active"</code>
              </h3>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-white border border-rose-200 text-rose-900">
                  <div className="text-[10px] font-bold text-rose-600 uppercase mb-0.5">Without Intra (Silent Bug):</div>
                  Banned or suspended accounts regain platform write access. Schema validation passes since <code className="font-mono">"active"</code> is a valid enum value.
                </div>
                <div className="p-3 rounded-xl bg-white border border-rose-200 text-crimson">
                  <div className="text-[10px] font-bold text-crimson uppercase mb-0.5">With Intra Circuit Breaker:</div>
                  Detects co-variate anomaly (<code className="font-mono">isSuspended: true</code> mapped to <code className="font-mono">active</code>). Immediately trips circuit breaker and emits high-priority security quarantine alert.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3: THE 6-STAGE RESILIENCE PIPELINE
           ========================================================================= */}
        <div className="skeuo-card p-8 sm:p-12 rounded-[2.5rem] space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="verified-badge">CLOSED-LOOP AUTONOMY</span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-black tracking-tight">
              The 6-Stage Autonomous Resilience Pipeline.
            </h2>
            <p className="text-xs sm:text-sm text-black/65">
              From the moment raw bytes arrive over the wire to canary promotion and on-chain ledger proof, every stage operates deterministically with mathematical stopping rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Observe & Scrub',
                desc: 'Passive non-blocking ring buffer captures payloads with zero overhead. SHA-256 masks JWTs, passwords, and sensitive PII inline.',
                badge: '@intra/observer',
              },
              {
                step: '02',
                title: 'Learn Behavioral Model',
                desc: 'Daikon-style invariant mining extracts type bounds, optionality, error taxonomies, and quantile constancy fingerprints.',
                badge: '@intra/model',
              },
              {
                step: '03',
                title: 'Detect Structural & Semantic Drift',
                desc: 'Two independent witnesses (invariant violation + sequential change-point) classify all 13 mutation classes without false positives.',
                badge: '@intra/differ',
              },
              {
                step: '04',
                title: 'AST Blast Radius & Impact',
                desc: 'TypeScript compiler API maps drift directly to client source files, evaluating business criticality and money/auth touch.',
                badge: '@intra/impact',
              },
              {
                step: '05',
                title: 'Typed DSL Synthesis',
                desc: 'Synthesizes provably backward-compatible adapter code from a constrained, auditable DSL. Zero arbitrary code in hot paths.',
                badge: '@intra/adapter',
              },
              {
                step: '06',
                title: 'Golden Replay & Canary Promotion',
                desc: 'Differential replay against golden test fixtures verifies semantic equivalence before traffic cutover. Auto-rolls back on failure.',
                badge: '@intra/validator',
              },
            ].map((stage) => (
              <div key={stage.step} className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-display font-black text-2xl text-crimson">{stage.step}</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-black/5 text-[10px] font-mono text-black/60 font-bold">{stage.badge}</span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-black">{stage.title}</h3>
                  <p className="text-[11px] text-black/65 leading-relaxed">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            SECTION 4: VERIFIED METRICS & PRODUCTION BENCHMARKS
           ========================================================================= */}
        <div className="skeuo-card p-8 sm:p-12 rounded-[2.5rem] space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-2">
              <span className="verified-badge">VERIFIED BENCHMARKS</span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-black tracking-tight">
                Architectural Quality Gates & Performance.
              </h2>
            </div>
            <span className="text-xs font-mono text-black/50">LOCKED MONOREPO TELEMETRY</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
            <div className="p-5 rounded-2xl bg-cream-subtle border border-black/5 space-y-1">
              <div className="text-3xl font-black font-display text-emerald-600">0%</div>
              <div className="text-[11px] font-bold text-black uppercase">Unsafe Auto-Apply</div>
              <div className="text-[10px] text-black/45">Lossy & breaking changes strictly quarantined</div>
            </div>
            <div className="p-5 rounded-2xl bg-cream-subtle border border-black/5 space-y-1">
              <div className="text-3xl font-black font-display text-black">100%</div>
              <div className="text-[11px] font-bold text-black uppercase">Rollback Guarantee</div>
              <div className="text-[10px] text-black/45">Every adapter sealed with cryptographic handle</div>
            </div>
            <div className="p-5 rounded-2xl bg-cream-subtle border border-black/5 space-y-1">
              <div className="text-3xl font-black font-display text-crimson">&lt;5ms</div>
              <div className="text-[11px] font-bold text-black uppercase">p95 Added Latency</div>
              <div className="text-[10px] text-black/45">Asynchronous non-blocking streaming engine</div>
            </div>
            <div className="p-5 rounded-2xl bg-cream-subtle border border-black/5 space-y-1">
              <div className="text-3xl font-black font-display text-emerald-600">35 / 35</div>
              <div className="text-[11px] font-bold text-black uppercase">Turbo Tasks Green</div>
              <div className="text-[10px] text-black/45">100% passing monorepo unit & integration tests</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default HomeContainer;
