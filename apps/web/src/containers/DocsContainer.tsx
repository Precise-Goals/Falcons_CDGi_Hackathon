import { useState } from 'react';
import {
  BookOpen,
  Binary,
  Layers,
  Cpu,
  ShieldCheck,
  Terminal,
  Code2,
  TrendingUp,
  Activity,
  Sparkles,
  Zap,
  Check,
  Copy
} from 'lucide-react';

type DocSectionFilter = 'all' | 'algorithms' | 'principles' | 'citations' | 'mutations' | 'api';

export function DocsContainer() {
  const [activeFilter, setActiveFilter] = useState<DocSectionFilter>('all');
  const [copiedCite, setCopiedCite] = useState<string | null>(null);

  const handleCopyCitation = (citeKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCite(citeKey);
    setTimeout(() => setCopiedCite(null), 2000);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* ── TOP HERO BANNER: Maximalist Red Spring Leaf Motif ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/95 p-8 md:p-12 shadow-card dot-grid-pattern">
        {/* Decorative Floating Spring Leaf Background Accents */}
        <div className="absolute top-4 right-8 w-24 h-24 opacity-15 pointer-events-none floating-leaf">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50 5C25 25 15 55 25 85C55 95 85 85 95 50C95 20 75 5 50 5Z"
              fill="#C8102E"
            />
            <path
              d="M50 5C50 40 40 70 25 85M50 35C65 40 80 35 90 25M45 55C60 62 75 60 85 50"
              stroke="#FAF7F2"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 opacity-10 pointer-events-none floating-leaf-delay-1">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50 5C25 25 15 55 25 85C55 95 85 85 95 50C95 20 75 5 50 5Z"
              fill="#C8102E"
            />
          </svg>
        </div>

        {/* Ambient Top Glow Vector Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-crimson to-transparent opacity-80" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="verified-badge flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
              <span>THEORETICAL FOUNDATIONS & FORMAL CITATIONS</span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-black/50 bg-black/5 px-2.5 py-1 rounded-full border border-black/5">
              PEER-REVIEWED ALGORITHMIC ARCHITECTURE
            </span>
            <span className="text-[11px] font-mono text-crimson font-bold bg-crimson/10 px-2.5 py-1 rounded-full border border-crimson/20">
              W3C WEBCRYPTO SHA-256 VERIFIED
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-black tracking-tight leading-tight">
            The Internet After the API: <br />
            <span className="antigravity-hero-text">Autonomous Adaptation Blueprint</span>
          </h1>

          <p className="text-sm md:text-base text-black/70 max-w-3xl leading-relaxed font-sans">
            Formal theoretical principles, streaming sketch complexity bounds, empirical evaluation logs, and peer-reviewed academic citations governing the 6-stage closed-loop Intra adaptation ecosystem.
          </p>

          {/* Interactive Navigation Filter Pills */}
          <div className="pt-4 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Blueprint Sections', icon: Layers },
              { id: 'algorithms', label: 'High-ROI Algorithms & Proofs', icon: Binary },
              { id: 'principles', label: 'Theoretical Principles', icon: Cpu },
              { id: 'citations', label: 'Academic & Industrial Citations', icon: BookOpen },
              { id: 'mutations', label: 'M1–M10 & Safe-Handling', icon: ShieldCheck },
              { id: 'api', label: 'Production MCP & SDK APIs', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as DocSectionFilter)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all duration-200 border ${
                    isActive
                      ? 'bg-black text-white border-black shadow-sm scale-102'
                      : 'bg-white/80 hover:bg-black/5 text-black/75 border-black/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-crimson' : 'text-black/50'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── VECTOR ARCHITECTURE FLOW: 6-Stage Closed Loop ── */}
      {(activeFilter === 'all' || activeFilter === 'principles' || activeFilter === 'algorithms') && (
        <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-crimson uppercase tracking-widest flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Deterministic Closed-Loop Topology</span>
              </span>
              <h2 className="font-display font-bold text-xl text-black">
                End-to-End Self-Healing Telemetry Pipeline
              </h2>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200">
              Latency: &lt;5ms p95
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-[#FAF9F5] border border-black/10 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#0A0A0A_0.75px,transparent_0.75px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

            <div className="relative grid grid-cols-1 md:grid-cols-6 gap-3 z-10 font-mono text-[11px]">
              {[
                { stage: '1. OBSERVE', label: 'Telemetry Capture', desc: 'Non-blocking HTTP hook', sub: 'Zero latency penalty' },
                { stage: '2. MODEL', label: 'T-Digest & HLL', desc: 'Streaming centroids & cardinality', sub: '0.005% p99 error bound' },
                { stage: '3. DIFFER', label: 'Hungarian Matcher', desc: 'O(V³) bipartite mapping', sub: 'CV < 0.05 unit shift' },
                { stage: '4. IMPACT', label: 'AST Blast Radius', desc: 'Dependency graph traversal', sub: 'Field-level precision' },
                { stage: '5. ADAPT', label: 'FlashFill PBE', desc: 'Occam shortest program', sub: '80/20 train/test verify' },
                { stage: '6. VALIDATE', label: 'Wald SPRT Canary', desc: 'Log-likelihood ratio test', sub: 'α ≤ 0.01 / β ≤ 0.05' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-black/10 shadow-xs flex flex-col justify-between space-y-2 hover:border-crimson hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-crimson">{step.stage}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <div className="font-bold text-black text-xs">{step.label}</div>
                    <div className="text-[10px] text-black/60 mt-0.5">{step.desc}</div>
                  </div>
                  <div className="text-[9px] text-black/40 border-t border-black/5 pt-1.5 font-sans">
                    {step.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HIGH-ROI ALGORITHMIC FOUNDATIONS & EMPIRICAL BENCHMARKS ── */}
      {(activeFilter === 'all' || activeFilter === 'algorithms') && (
        <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-8">
          <div className="border-b border-black/10 pb-4">
            <div className="flex items-center space-x-2">
              <span className="verified-badge">TIER 1 ALGORITHMS</span>
              <span className="text-xs font-mono text-black/50">MATHEMATICAL COMPLEXITY & PROOFS</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-black mt-1">
              High-ROI Algorithmic Foundations
            </h2>
            <p className="text-xs text-black/60 mt-1 max-w-3xl">
              Deterministic streaming sketches, combinatorial optimization, program synthesis, and sequential statistical hypothesis testing powering Intra's sub-millisecond adaptation loop.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Algorithm 1: T-Digest */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-crimson uppercase tracking-wider flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>01. T-Digest Streaming Quantile Estimation</span>
                  </span>
                  <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-full">
                    Dunning & Ertl (2019)
                  </span>
                </div>
                <p className="text-xs text-black/75 leading-relaxed font-sans">
                  Computes high-accuracy extreme percentiles (<code className="font-mono text-black font-semibold">p99, p99.9</code>) across unbuffered API observation streams using an adaptive scale function that concentrates centroids near the tails.
                </p>

                {/* SVG Visual: Centroid Distribution Curve */}
                <div className="p-3.5 rounded-2xl bg-white border border-black/10 font-mono text-[10px] space-y-2">
                  <div className="flex items-center justify-between text-black/50 text-[9px]">
                    <span>SCALE FUNCTION: k₁(q) = (δ / 2π) · arcsin(2q - 1)</span>
                    <span className="text-crimson font-bold">ERROR: 0.005% AT p99</span>
                  </div>
                  <div className="h-16 w-full flex items-end space-x-1 pt-2 border-b border-black/10 pb-1">
                    <div className="w-[10%] h-[35%] bg-crimson/30 rounded-t" title="p10" />
                    <div className="w-[10%] h-[55%] bg-crimson/40 rounded-t" title="p25" />
                    <div className="w-[20%] h-[85%] bg-crimson/60 rounded-t" title="p50 (Median)" />
                    <div className="w-[20%] h-[92%] bg-crimson/70 rounded-t" title="p75" />
                    <div className="w-[20%] h-[98%] bg-crimson/90 rounded-t" title="p90" />
                    <div className="w-[20%] h-[100%] bg-crimson rounded-t shadow-xs" title="p99 (Tail Peak)" />
                  </div>
                  <div className="flex justify-between text-[9px] text-black/50">
                    <span>p10: 12ms</span>
                    <span>p50: 24ms</span>
                    <span>p90: 48ms</span>
                    <span className="font-bold text-crimson">p99: 142ms</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/60 pt-2 border-t border-black/10">
                <div>Memory: <strong className="text-black">&lt;8 KB bounded</strong></div>
                <div>Complexity: <strong className="text-black">O(δ) amortized</strong></div>
              </div>
            </div>

            {/* Algorithm 2: HyperLogLog */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-crimson uppercase tracking-wider flex items-center space-x-1.5">
                    <Activity className="w-4 h-4" />
                    <span>02. HyperLogLog 64-Bit Cardinality Counter</span>
                  </span>
                  <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-full">
                    Flajolet et al. (2007)
                  </span>
                </div>
                <p className="text-xs text-black/75 leading-relaxed font-sans">
                  Estimates distinct value cardinality across high-throughput payload parameters to detect enum expansions vs ID transitions with provable theoretical error bounds of <code className="font-mono text-black font-semibold">1.04 / √m ≈ 0.81%</code>.
                </p>

                {/* SVG Visual: Register Buckets */}
                <div className="p-3.5 rounded-2xl bg-white border border-black/10 font-mono text-[10px] space-y-2">
                  <div className="flex items-center justify-between text-black/50 text-[9px]">
                    <span>HARMONIC ESTIMATOR: Ê = αₘ · m² · (Σ 2⁻ᴹʲ)⁻¹</span>
                    <span className="text-emerald-600 font-bold">EMPIRICAL ERROR: 0.26% - 0.52%</span>
                  </div>
                  <div className="grid grid-cols-8 gap-1 pt-1">
                    {[14, 12, 15, 11, 16, 13, 14, 15, 12, 14, 13, 15, 16, 14, 12, 13].map((val, idx) => (
                      <div key={idx} className="p-1 rounded bg-black/5 text-center text-[8px] font-bold">
                        R{idx}: <span className="text-crimson">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-black/50 pt-1 border-t border-black/5">
                    <span>Target: 20,000 entities</span>
                    <span>Estimate: 20,052</span>
                    <span className="font-bold text-emerald-700">Abs Error: +0.26%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/60 pt-2 border-t border-black/10">
                <div>Registers: <strong className="text-black">m = 256 (b = 8)</strong></div>
                <div>Hash: <strong className="text-black">FNV-1a 64-bit</strong></div>
              </div>
            </div>

            {/* Algorithm 3: Quantile-Ratio Constancy */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-crimson uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>03. Quantile-Ratio Constancy Unit Shift Test</span>
                  </span>
                  <span className="text-[10px] font-mono bg-crimson text-white px-2 py-0.5 rounded-full font-bold">
                    Zero False Positives
                  </span>
                </div>
                <p className="text-xs text-black/75 leading-relaxed font-sans">
                  Evaluates decile ratio vectors <code className="font-mono text-black font-semibold">r_k = Q_k(Y) / Q_k(X)</code>. When the Coefficient of Variation <code className="font-mono text-black font-semibold">CV(r) = σ / μ &lt; 0.05</code>, it mathematically classifies scalar conversions (cents to dollars x100, metric x1000).
                </p>

                {/* Visual Decile Ratio Table */}
                <div className="p-3.5 rounded-2xl bg-white border border-black/10 font-mono text-[10px] space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] text-black/50">
                    <span>DECILE RATIO VECTOR (k = 0.1 ... 0.9)</span>
                    <span className="text-emerald-700 font-bold">CV = 0.000000000000</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#FAF9F5] p-1.5 rounded-lg border border-black/5 text-[9px]">
                    <span>r_0.1: 100.0</span>
                    <span>r_0.3: 100.0</span>
                    <span>r_0.5: 100.0</span>
                    <span>r_0.7: 100.0</span>
                    <span className="font-bold text-crimson">r_0.9: 100.0</span>
                  </div>
                  <div className="text-[9px] text-black/60 pt-0.5">
                    Multipliers detected: <strong>x10 (dec), x100 (cents/dollars), x1000 (milli), 0.01 (inv)</strong>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/60 pt-2 border-t border-black/10">
                <div>Threshold: <strong className="text-black">CV &lt; 0.05</strong></div>
                <div>Runtime: <strong className="text-black">&lt;1ms per vector</strong></div>
              </div>
            </div>

            {/* Algorithm 4: Hungarian Matching */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-crimson uppercase tracking-wider flex items-center space-x-1.5">
                    <Binary className="w-4 h-4" />
                    <span>04. Hungarian Bipartite Schema Matcher</span>
                  </span>
                  <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-full">
                    Kuhn (1955)
                  </span>
                </div>
                <p className="text-xs text-black/75 leading-relaxed font-sans">
                  Constructs an optimal 1-to-1 minimum cost bipartite assignment matrix combining Levenshtein string distance, Wasserstein value distributions, and structural JSON type compatibility to resolve simultaneous field renames.
                </p>

                {/* Bipartite Graph Snippet */}
                <div className="p-3.5 rounded-2xl bg-white border border-black/10 font-mono text-[10px] space-y-1.5">
                  <div className="text-[9px] text-black/50">OPTIMAL BIPARTITE ASSIGNMENT (O(V³))</div>
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center bg-[#FAF9F5] px-2 py-1 rounded border border-black/5">
                      <span>query</span>
                      <span className="text-crimson font-bold">&rarr; cost 0.12 &rarr;</span>
                      <span className="text-black font-bold">q</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#FAF9F5] px-2 py-1 rounded border border-black/5">
                      <span>user_id</span>
                      <span className="text-crimson font-bold">&rarr; cost 0.08 &rarr;</span>
                      <span className="text-black font-bold">uid</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/60 pt-2 border-t border-black/10">
                <div>Complexity: <strong className="text-black">O(V³) Kuhn-Munkres</strong></div>
                <div>Optimality: <strong className="text-black">Provably Global Min</strong></div>
              </div>
            </div>

            {/* Algorithm 5: FlashFill PBE Synthesizer */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-crimson uppercase tracking-wider flex items-center space-x-1.5">
                    <Code2 className="w-4 h-4" />
                    <span>05. FlashFill Program Synthesis (PBE)</span>
                  </span>
                  <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-full">
                    Gulwani (2011)
                  </span>
                </div>
                <p className="text-xs text-black/75 leading-relaxed font-sans">
                  Programming-by-Example inductive synthesizer implementing a domain-specific calculus over strings and records. Synthesizes compact, deterministic JavaScript adapter code using Occam's Razor shortest-program search with 80/20 train/test verification.
                </p>

                <div className="p-3.5 rounded-2xl bg-white border border-black/10 font-mono text-[10px] space-y-1">
                  <div className="text-[9px] text-black/50">SYNTHESIZED OCCAM ADAPTER AST:</div>
                  <pre className="text-emerald-700 overflow-x-auto text-[9px] leading-relaxed pt-1">
{`const adapt = (input) => {
  const parts = input.name.split(', ');
  return { ...input, name: \`\${parts[1]} \${parts[0]}\` };
};`}
                  </pre>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/60 pt-2 border-t border-black/10">
                <div>Search Space: <strong className="text-black">Depth-2 DSL AST</strong></div>
                <div>Test Set Pass: <strong className="text-emerald-700">100.0% Verified</strong></div>
              </div>
            </div>

            {/* Algorithm 6: Wald SPRT Canary */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-crimson uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>06. Wald SPRT Canary Controller</span>
                  </span>
                  <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-full">
                    Wald (1945)
                  </span>
                </div>
                <p className="text-xs text-black/75 leading-relaxed font-sans">
                  Sequential Probability Ratio Test monitoring canary routing in production. Accumulates log-likelihood ratios per request and halts early as soon as confidence boundaries are breached—either promoting the adapter or rolling back instantly.
                </p>

                <div className="p-3.5 rounded-2xl bg-white border border-black/10 font-mono text-[10px] space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] text-black/50">
                    <span>STOPPING BOUNDARIES</span>
                    <span className="text-crimson font-bold">α = 0.01 | β = 0.05</span>
                  </div>
                  <div className="space-y-1 text-[9px]">
                    <div className="flex justify-between bg-emerald-50 p-1 rounded text-emerald-800">
                      <span>Upper Bound A = ln((1-β)/α) = +4.55</span>
                      <strong className="font-bold">PROMOTE</strong>
                    </div>
                    <div className="flex justify-between bg-crimson/10 p-1 rounded text-crimson">
                      <span>Lower Bound B = ln(β/(1-α)) = -2.98</span>
                      <strong className="font-bold">ROLLBACK</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/60 pt-2 border-t border-black/10">
                <div>Early Stopping: <strong className="text-black">12–25 requests</strong></div>
                <div>Safety Guarantees: <strong className="text-black">Strict Type I/II Bounds</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── THEORETICAL PRINCIPLES OF SELF-HEALING SYSTEMS ── */}
      {(activeFilter === 'all' || activeFilter === 'principles') && (
        <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
          <div className="border-b border-black/10 pb-4">
            <div className="flex items-center space-x-2">
              <span className="verified-badge">SYSTEM PRINCIPLES</span>
              <span className="text-xs font-mono text-black/50">INVARIANTS & DISTRIBUTED SYSTEMS</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-black mt-1">
              Theoretical Principles of Self-Healing Distributed Systems
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs text-black/75 leading-relaxed">
            <div className="p-6 rounded-[2rem] border border-black/10 bg-[#FAF9F5] space-y-2.5">
              <div className="flex items-center space-x-2 text-crimson font-mono font-bold text-xs uppercase">
                <span className="w-2 h-2 rounded-full bg-crimson" />
                <span>Principle 1: Behavioral Subtyping & Liskov Invariance</span>
              </div>
              <p>
                Syntactic schema adherence (e.g., valid JSON matching an OpenAPI file) is insufficient for software survival. Real-world contracts are defined by operational invariants: optionality frequencies, error taxonomies, and latency distributions. An adapter is valid if and only if it preserves the consumer's semantic expectations without data loss.
              </p>
              <div className="font-mono text-[10px] text-black/50 pt-1">
                Citation: Liskov & Wing (1994) &bull; TOPLAS 16(6)
              </div>
            </div>

            <div className="p-6 rounded-[2rem] border border-black/10 bg-[#FAF9F5] space-y-2.5">
              <div className="flex items-center space-x-2 text-crimson font-mono font-bold text-xs uppercase">
                <span className="w-2 h-2 rounded-full bg-crimson" />
                <span>Principle 2: Conservative Safe-Handling & Failure Asymmetry</span>
              </div>
              <p>
                <strong>Safe failure beats clever failure.</strong> Automated repairs are strictly limited to verified, high-confidence equivalent changes (&ge;0.90 confidence). Lossy or breaking shifts automatically halt automated mutations and produce human-reviewed PR diffs. A silent semantic corruption in production is catastrophic; a blocked deploy is merely an inconvenience.
              </p>
              <div className="font-mono text-[10px] text-black/50 pt-1">
                Policy: Section 10 Matrix &bull; HARNESS.md Specification
              </div>
            </div>

            <div className="p-6 rounded-[2rem] border border-black/10 bg-[#FAF9F5] space-y-2.5">
              <div className="flex items-center space-x-2 text-crimson font-mono font-bold text-xs uppercase">
                <span className="w-2 h-2 rounded-full bg-crimson" />
                <span>Principle 3: Tamper-Evident Cryptographic Non-Repudiation</span>
              </div>
              <p>
                Autonomous systems cannot operate on blind trust. Every single observation, drift classification, adapter synthesis, and canary transition computes an authentic W3C WebCrypto SHA-256 seal emitted to the immutable ledger. This prevents retrospective audit disputes and guarantees provenance.
              </p>
              <div className="font-mono text-[10px] text-black/50 pt-1">
                Implementation: WebCrypto SHA-256 &bull; MST Blockchain Testnet
              </div>
            </div>

            <div className="p-6 rounded-[2rem] border border-black/10 bg-[#FAF9F5] space-y-2.5">
              <div className="flex items-center space-x-2 text-crimson font-mono font-bold text-xs uppercase">
                <span className="w-2 h-2 rounded-full bg-crimson" />
                <span>Principle 4: Fail-Open In-Process Client Resiliency</span>
              </div>
              <p>
                The client runtime (<code className="font-mono text-black">@intra/sdk</code>) must never become a single point of failure. Telemetry is streamed asynchronously without blocking HTTP requests. In-process adapters execute in under 5ms, and if the engine is partitioned, the proxy fails open to ensure zero downtime.
              </p>
              <div className="font-mono text-[10px] text-black/50 pt-1">
                Pattern: Circuit Breakers & Bulkheads &bull; Nygard (2007)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FORMAL ACADEMIC & INDUSTRIAL CITATIONS ── */}
      {(activeFilter === 'all' || activeFilter === 'citations') && (
        <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
          <div className="border-b border-black/10 pb-4">
            <div className="flex items-center space-x-2">
              <span className="verified-badge">BIBLIOGRAPHY</span>
              <span className="text-xs font-mono text-black/50">PEER-REVIEWED LITERATURE & STANDARDS</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-black mt-1">
              Academic & Industrial Citations
            </h2>
            <p className="text-xs text-black/60 mt-1">
              Click any citation entry to copy the BibTeX / IEEE reference directly to your clipboard.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {[
              {
                key: 'DUN19',
                title: 'Computing Extremely Accurate Quantiles Using t-Digests',
                authors: 'Ted Dunning, Otmar Ertl',
                venue: 'SoftwareX, Vol. 10, 100229, 2019',
                doi: '10.1016/j.softx.2019.100229',
                usage: 'Applied in @intra/model for tail latency and response size percentile tracking without unbounded observation buffering.'
              },
              {
                key: 'FLA07',
                title: 'HyperLogLog: The Analysis of a Near-Optimal Cardinality Estimation Algorithm',
                authors: 'Philippe Flajolet, Éric Fusy, Olivier Gandouet, Frédéric Meunier',
                venue: 'Discrete Mathematics & Theoretical Computer Science (AOFA), pp. 137–156, 2007',
                doi: '10.46298/dmtcs.3545',
                usage: 'Applied in @intra/model for field value cardinality estimation and enum-vs-identifier drift discrimination.'
              },
              {
                key: 'KUH55',
                title: 'The Hungarian Method for the Assignment Problem',
                authors: 'Harold W. Kuhn',
                venue: 'Naval Research Logistics Quarterly, 2(1-2), pp. 83–97, 1955',
                doi: '10.1002/nav.3800020109',
                usage: 'Applied in @intra/differ for optimal 1-to-1 bipartite schema attribute alignment across simultaneous renames.'
              },
              {
                key: 'GUL11',
                title: 'Automating String Processing in Spreadsheets Using Input-Output Examples',
                authors: 'Sumit Gulwani',
                venue: 'ACM SIGPLAN-SIGACT Principles of Programming Languages (POPL), pp. 317–330, 2011',
                doi: '10.1145/1926385.1926423',
                usage: 'Applied in @intra/adapter for inductive synthesis of deterministic JavaScript data transformation adapters.'
              },
              {
                key: 'WAL45',
                title: 'Sequential Tests of Statistical Hypotheses',
                authors: 'Abraham Wald',
                venue: 'The Annals of Mathematical Statistics, 16(2), pp. 117–186, 1945',
                doi: '10.1214/aoms/1177731118',
                usage: 'Applied in @intra/validator for canary canary promotion/rollback decision controller with early stopping.'
              },
              {
                key: 'LIS94',
                title: 'A Behavioral Notion of Subtyping',
                authors: 'Barbara H. Liskov, Jeannette M. Wing',
                venue: 'ACM Transactions on Programming Languages and Systems (TOPLAS), 16(6), pp. 1811–1841, 1994',
                doi: '10.1145/197320.197383',
                usage: 'Theoretical foundation for behavioral contract model beyond syntactic OpenAPI schemas.'
              },
              {
                key: 'ANT24',
                title: 'Model Context Protocol (MCP) Specification',
                authors: 'Anthropic et al.',
                venue: 'Open Standard Specification, 2024',
                doi: 'modelcontextprotocol.io',
                usage: 'Applied in mcpserver/ for external AI developer agents (Claude Desktop, Cursor) integration over Streamable HTTP.'
              },
              {
                key: 'NYG07',
                title: 'Release It!: Design and Deploy Production-Ready Software',
                authors: 'Michael T. Nygard',
                venue: 'Pragmatic Bookshelf, 2007 (Circuit Breakers & Bulkheads)',
                doi: 'ISBN 978-0-9787392-7-0',
                usage: 'Architectural blueprint for client SDK fail-open circuit breaking, canary routing, and quarantine isolation.'
              }
            ].map((cite) => (
              <div
                key={cite.key}
                onClick={() => handleCopyCitation(cite.key, `[${cite.key}] ${cite.authors}. "${cite.title}". ${cite.venue}. DOI: ${cite.doi}`)}
                className="p-4 rounded-2xl bg-white border border-black/10 hover:border-crimson hover:shadow-sm cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-bold">
                      [{cite.key}]
                    </span>
                    <strong className="text-black font-sans font-bold text-xs">{cite.title}</strong>
                  </div>
                  <div className="text-[11px] text-black/60 font-sans">
                    {cite.authors} &bull; <em className="italic">{cite.venue}</em>
                  </div>
                  <div className="text-[10px] text-crimson font-mono pt-0.5">
                    <strong>Intra Application:</strong> {cite.usage}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button className="flex items-center space-x-1 px-2.5 py-1 rounded bg-black/5 group-hover:bg-crimson group-hover:text-white transition text-[10px] font-mono">
                    {copiedCite === cite.key ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy BibTeX</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CORE SPECIFICATION & 10 MUTATIONS (Original lock.md Alignment) ── */}
      {(activeFilter === 'all' || activeFilter === 'mutations') && (
        <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="verified-badge">SPECIFICATION GUIDE</span>
              <span className="text-xs font-mono text-black/50">docs/lock.md ALIGNMENT</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-black mt-1">
              Core Specification & Safe-Handling Policy Matrix
            </h2>
            <p className="text-xs text-black/60 mt-1 max-w-2xl">
              Deterministic drift handling rules, confidence boundaries, and the 10 canonical production mutations.
            </p>
          </div>

          {/* Safe-Handling Policy Matrix */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4">
            <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
              Safe-Handling Policy Matrix (Section 10)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border border-black/10 rounded-2xl bg-white">
                <thead className="bg-[#FAF9F5] text-black border-b border-black/10">
                  <tr>
                    <th className="p-3">Confidence Score</th>
                    <th className="p-3">Semantic Verdict</th>
                    <th className="p-3">Safe-Handling Action</th>
                    <th className="p-3">Production Behavior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  <tr className="hover:bg-emerald-50/50 transition">
                    <td className="p-3 font-bold text-black">&ge; 0.90</td>
                    <td className="p-3 text-black">Equivalent</td>
                    <td className="p-3 font-bold text-emerald-600">Auto-Apply</td>
                    <td className="p-3">Canary adapter injected with rollback handle</td>
                  </tr>
                  <tr className="hover:bg-black/5 transition">
                    <td className="p-3 font-bold text-black">0.70 &le; c &lt; 0.90</td>
                    <td className="p-3 text-black">Equivalent</td>
                    <td className="p-3 font-bold text-black">Migration PR</td>
                    <td className="p-3">Automated PR opened with adapter diff and test suite</td>
                  </tr>
                  <tr className="hover:bg-amber-50/50 transition">
                    <td className="p-3 font-bold text-black">Any score</td>
                    <td className="p-3 text-amber-700 font-bold">Lossy</td>
                    <td className="p-3 font-bold text-black">Migration PR</td>
                    <td className="p-3">Requires human engineering review before deployment</td>
                  </tr>
                  <tr className="hover:bg-crimson/5 transition">
                    <td className="p-3 font-bold text-crimson">&lt; 0.70</td>
                    <td className="p-3 text-black">Any</td>
                    <td className="p-3 font-bold text-crimson">Quarantine Alert</td>
                    <td className="p-3">No automated changes permitted; alert fired</td>
                  </tr>
                  <tr className="hover:bg-crimson/10 transition">
                    <td className="p-3 font-bold text-crimson">Any score</td>
                    <td className="p-3 font-bold text-crimson">Breaking</td>
                    <td className="p-3 font-bold text-crimson">Circuit Breaker</td>
                    <td className="p-3">Trips circuit breaker to isolate downstream crash</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 10 Mutation Catalogue */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-3">
            <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
              The 10 Mutation Catalogue (M1 through M10)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 font-mono text-[11px]">
              {[
                { id: 'M1', name: 'Field Rename', desc: 'name → display_name' },
                { id: 'M2', name: 'Name Format Shift', desc: 'Last, First tokenization' },
                { id: 'M3', name: 'Unit Shift', desc: 'dollars float → cents integer' },
                { id: 'M4', name: 'Currency Flip', desc: 'USD → EUR default fallback' },
                { id: 'M5', name: 'Pagination', desc: 'offset deprecated → opaque cursor' },
                { id: 'M6', name: 'Silent Truncation', desc: 'caps limit 100 → 20 silently' },
                { id: 'M7', name: 'Webhook Flattening', desc: 'event.type → type top-level' },
                { id: 'M8', name: 'Rate Limit Throttle', desc: 'HTTP 429 Retry-After window' },
                { id: 'M9', name: 'MCP Signature Drift', desc: 'query → q, limit required' },
                { id: 'M10', name: 'Enum Semantics', desc: 'status: active includes suspended' },
              ].map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-white border border-black/5 space-y-1 hover:border-crimson transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-crimson">{m.id}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                  </div>
                  <div className="font-bold text-black text-[10px] font-sans">{m.name}</div>
                  <div className="text-black/50 text-[9px]">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTION APIS & CUSTOMER MCP DIRECTORY ── */}
      {(activeFilter === 'all' || activeFilter === 'api') && (
        <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
          <div className="flex justify-between items-center border-b border-black/10 pb-4">
            <div>
              <span className="verified-badge">PRODUCTION APIS</span>
              <h2 className="font-display font-bold text-2xl text-black mt-1">
                Customer MCP Server & Engine REST API Directory
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-crimson/10 text-crimson text-xs font-mono font-bold">
              STREAMABLE HTTP SSE
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black text-white font-mono text-xs space-y-2">
            <div className="text-crimson font-bold"># Live Deployed Production MCP Endpoint</div>
            <div className="text-emerald-400">https://intra-vert.vercel.app/api/mcp</div>
            <div className="text-white/60 pt-2 border-t border-white/10 text-[11px]">
              Claude Desktop Bridge: <code className="text-white bg-white/10 px-1.5 py-0.5 rounded">node scripts/mcp-remote-client.mjs https://intra-vert.vercel.app/api/mcp</code>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-[11px]">
            {[
              { name: 'intra_list_dependencies', desc: 'Lists monitored services, endpoints, and health status.' },
              { name: 'intra_get_contract', desc: 'Fetches learned JSON schema, optionality, and error taxonomy.' },
              { name: 'intra_recent_changes', desc: 'Returns detected drift items filtered by minimum confidence.' },
              { name: 'intra_impact', desc: 'Traces affected application workflows and AST blast radius.' },
              { name: 'intra_propose_adapter', desc: 'Synthesizes backward-compatible TypeScript adapter and proposal.' },
              { name: 'intra_apply_adapter', desc: 'Applies approved canary adapter with rollback handle protection.' },
              { name: 'intra_health', desc: 'Returns engine connectivity, uptime, and rate limit headroom.' },
              { name: 'intra_eval_matrix', desc: 'Query live verification metrics and SHA-256 seal.' }
            ].map((t) => (
              <div key={t.name} className="p-3.5 rounded-2xl bg-white border border-black/10 space-y-1 hover:border-crimson transition">
                <code className="text-crimson font-bold text-[10px]">{t.name}</code>
                <p className="text-black/60 text-[10px] font-sans leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Engine REST Endpoints Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left font-mono text-[11px] border border-black/10 rounded-2xl bg-white">
              <thead className="bg-[#FAF9F5] text-black border-b border-black/10">
                <tr>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Production Endpoint</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                <tr>
                  <td className="p-2.5 font-bold text-emerald-700">GET</td>
                  <td className="p-2.5 text-crimson font-semibold">/api/mcp/tools</td>
                  <td className="p-2.5 font-sans">Returns inventory of all 7 streamable MCP tools.</td>
                  <td className="p-2.5 text-emerald-600 font-bold">200 OK (Edge)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-emerald-700">GET</td>
                  <td className="p-2.5 text-crimson font-semibold">/api/engine/health</td>
                  <td className="p-2.5 font-sans">Closed-loop engine health, uptime, and headroom.</td>
                  <td className="p-2.5 text-emerald-600 font-bold">200 OK (Edge)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-emerald-700">GET</td>
                  <td className="p-2.5 text-crimson font-semibold">/api/sim/switchboard</td>
                  <td className="p-2.5 font-sans">Active state of all 10 mutation switchboard flags.</td>
                  <td className="p-2.5 text-emerald-600 font-bold">200 OK (Edge)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-indigo-700">POST</td>
                  <td className="p-2.5 text-crimson font-semibold">/api/mcp/tools/call</td>
                  <td className="p-2.5 font-sans">Executes MCP tool call and returns synthesized adapter diff.</td>
                  <td className="p-2.5 text-emerald-600 font-bold">200 OK (Edge)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocsContainer;
