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
  Copy,
  FileText,
  Download,
  Scale,
  Lock,
  FileCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { DocsCategory } from '../types';
import { ResearchPaperViewer } from '../components/ResearchPaperViewer';

export interface DocsContainerProps {
  docsCategory?: DocsCategory;
  setDocsCategory?: (category: DocsCategory) => void;
}

type DocSectionFilter = 'all' | 'algorithms' | 'principles' | 'citations' | 'mutations' | 'api';

export function DocsContainer({
  docsCategory = 'docs',
  setDocsCategory
}: DocsContainerProps) {
  const [activeFilter, setActiveFilter] = useState<DocSectionFilter>('all');
  const [copiedCite, setCopiedCite] = useState<string | null>(null);
  const [researchViewMode, setResearchViewMode] = useState<'pdf' | 'article'>('pdf');

  const handleCopyCitation = (citeKey: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedCite(citeKey);
    setTimeout(() => setCopiedCite(null), 2000);
  };

  const handleCategorySwitch = (cat: DocsCategory) => {
    if (setDocsCategory) {
      setDocsCategory(cat);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* ── TOP CATEGORY NAVIGATOR (Docs Blueprint | Terms & Policies | Research & Patent) ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-black/10 shadow-xs">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => handleCategorySwitch('docs')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              docsCategory === 'docs'
                ? 'bg-black text-white shadow-sm'
                : 'text-black/70 hover:text-black hover:bg-black/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-crimson" />
            <span>Docs (Blueprint)</span>
          </button>

          <button
            onClick={() => handleCategorySwitch('terms')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              docsCategory === 'terms'
                ? 'bg-black text-white shadow-sm'
                : 'text-black/70 hover:text-black hover:bg-black/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-crimson" />
            <span>Terms & Policies</span>
          </button>

          <button
            onClick={() => handleCategorySwitch('research')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              docsCategory === 'research'
                ? 'bg-black text-white shadow-sm'
                : 'text-black/70 hover:text-black hover:bg-black/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-crimson" />
            <span>Research & Patent Paper</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-black/50 pr-2">
          <span className="hidden sm:inline">Active Category:</span>
          <span className="font-bold text-crimson uppercase tracking-wider">
            {docsCategory === 'research' ? 'Academic Paper' : docsCategory === 'terms' ? 'Governance & SLA' : 'Architecture'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY 1: BORDERLESS NATIVE RESEARCH PAPER (docsCategory === 'research') */}
      {/* ========================================================================= */}
      {docsCategory === 'research' && (
        <div className="w-full mx-auto max-w-5xl space-y-6">
          {/* View Mode Switcher Pill */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-cream-subtle rounded-2xl border border-black/10">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setResearchViewMode('pdf')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  researchViewMode === 'pdf'
                    ? 'bg-crimson text-white shadow-xs'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Original Research Paper Pages (Vector PDF)</span>
              </button>
              <button
                onClick={() => setResearchViewMode('article')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  researchViewMode === 'article'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Article Reader Mode</span>
              </button>
            </div>
            <div className="text-[11px] font-mono text-black/50 pr-2 hidden sm:block">
              Zero Iframe &bull; Native High-DPI Vector &bull; Selectable Text &bull; Interactive Hyperlinks
            </div>
          </div>

          {researchViewMode === 'pdf' ? (
            <ResearchPaperViewer />
          ) : (
            <article className="w-full mx-auto max-w-4xl px-2 sm:px-4 py-8 space-y-12 text-[#111111] leading-relaxed selection:bg-crimson/15 selection:text-crimson">
          {/* Subtle Publication Header & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-black/10 font-mono text-xs text-black/60">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-crimson/10 text-crimson font-bold uppercase tracking-wider text-[11px]">
                TECHNICAL RESEARCH PAPER
              </span>
              <span>&bull;</span>
              <span>October 2026 Edition</span>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/research.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-black font-semibold hover:text-crimson transition underline underline-offset-4"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Original PDF (306 KB)</span>
              </a>
              <a
                href="/research.docx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-black/70 hover:text-crimson transition underline underline-offset-4"
              >
                <span>DOCX (304 KB)</span>
              </a>
            </div>
          </div>

          {/* Paper Title & Metadata */}
          <header className="space-y-6 pt-2">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-widest text-crimson font-bold">
                Invention Disclosure & Empirical Assessment
              </p>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-black leading-tight tracking-tight">
                Intra: Autonomous API Resilience through Behavioural Observation, Drift Detection, and Policy-Gated Adaptation
              </h1>
              <p className="font-sans text-lg sm:text-xl text-black/70 italic font-normal pt-1">
                Architecture, Prior-Art Analysis and Patentability Assessment in Support of an Invention Disclosure
              </p>
            </div>

            <div className="pt-2 pb-4 border-b border-black/10 space-y-2 font-sans text-sm">
              <div className="flex flex-wrap items-center gap-x-2 text-black font-semibold">
                <span>Sarthak Patil,</span>
                <span>Karan Verma,</span>
                <span>Sneha Sharma,</span>
                <span>Sneha Patidar</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 text-xs font-mono text-black/60">
                <span>Independent Research / Technical Assessment</span>
                <span>&bull;</span>
                <a
                  href="https://github.com/Precise-Goals/Intra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-crimson hover:underline"
                >
                  Repository: github.com/Precise-Goals/Intra
                </a>
              </div>
            </div>
          </header>

          {/* Abstract */}
          <section className="space-y-3 bg-[#FAF8F5] p-6 sm:p-8 rounded-2xl border-l-4 border-crimson font-sans text-sm sm:text-base leading-relaxed text-black/85">
            <h2 className="font-display font-bold text-xs uppercase tracking-widest text-crimson">
              Abstract
            </h2>
            <p>
              Modern applications depend on third-party APIs, SDKs, webhooks and MCP servers whose behaviour can change without notice. Schema validators and static OpenAPI diffs miss semantic drift—renames, unit/scale shifts, default flips, pagination style changes and enum meaning shifts that still produce valid JSON and HTTP 200 responses. This paper analyses <strong>Intra</strong>, a TypeScript monorepo that implements a closed-loop, behaviour-first adaptation pipeline: live traffic observation, contract and behavioural-fingerprint modelling, structural plus semantic differencing with confidence scores, AST- and trace-based impact analysis, typed adapter synthesis under a policy engine, and golden-replay validation. We reconstruct the implemented system from the public repository, map each stage to code, survey academic and commercial prior art on API contract drift, behavioural fingerprinting and automated remediation, and examine issued patents and technical disclosures that address related mechanisms. Our conclusion is measured. Individual mechanisms (schema inference from traffic, structural diff, impact graphs, adapter generation, approval gates) are established. What may remain distinguishable is the specific closed-loop combination: behavioural fingerprints used for semantic rename and unit-shift detection, confidence-and-verdict-gated auto-apply versus PR/quarantine policy, and golden-workflow equivalence validation before promotion. We identify a Technical Disclosure Commons publication on silent backward-incompatible API contract drift using structural-semantic fingerprints as particularly close prior art. The paper closes with novelty-boundary classification, IP market positioning, security considerations, limitations of the prototype, and a practical next-steps roadmap. <em>Nothing herein is legal advice.</em>
            </p>
            <div className="pt-2 text-xs font-mono text-black/70">
              <strong>Keywords:</strong> API drift detection, behavioural fingerprint, semantic change detection, adapter synthesis, impact analysis, autonomous adaptation, policy-gated remediation, prior art, patentability, FlashFill PBE, Wald SPRT, Hungarian matching
            </div>
          </section>

          {/* 1. Introduction */}
          <section className="space-y-6 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              1. Introduction
            </h2>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">1.1 Background</h3>
              <p>
                Production software is coupled to services it does not control. When an upstream provider renames a field, switches amounts from floating-point dollars to integer cents, changes pagination from offset to opaque cursor, flips a default, or alters enum semantics, downstream workflows fail often silently, because the response remains syntactically valid. Static contracts and OpenAPI diffs catch many structural breaks but systematically miss behavioural and semantic drift that schema validators treat as legal. Intra’s authoritative problem statement formalises this as “the Internet after the API”: help software survive undocumented changes in systems it does not control.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">1.2 The 80% Blind Spot and Failure Taxonomy</h3>
              <p>
                Traditional validators (JSON Schema, Zod, OpenAPI) only check structural syntax. A payload that shifts amount from 25.00 (dollars) to 2500 (cents) still satisfies <code className="bg-black/5 px-1 py-0.5 rounded font-mono text-xs">z.number()</code>. Intra enumerates eleven failure classes (M1–M11): field rename, format shift, unit/scale shift, default flip, pagination shift, silent truncation, webhook flattening, rate-limit drift, MCP/tool drift, enum semantics, and gradual/mixed-version rollout. Eight of these pass schema validation while corrupting business logic.
              </p>

              {/* Taxonomy Table */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left font-mono text-xs border border-black/15 bg-white">
                  <thead className="bg-[#FAF8F5] border-b border-black/15 text-black">
                    <tr>
                      <th className="p-2.5">Mutation</th>
                      <th className="p-2.5">Failure Description</th>
                      <th className="p-2.5">Schema Validity</th>
                      <th className="p-2.5">Intra Remediation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M1: Field Rename</td>
                      <td className="p-2.5">name &rarr; display_name</td>
                      <td className="p-2.5 text-amber-700">Optional passes</td>
                      <td className="p-2.5">Hungarian bipartite matching + alias adapter</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M2: Format Shift</td>
                      <td className="p-2.5">First Last &rarr; Last, First</td>
                      <td className="p-2.5 text-emerald-700">Valid string</td>
                      <td className="p-2.5">FlashFill PBE inductive token re-ordering</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M3: Unit Shift</td>
                      <td className="p-2.5">Dollars ($25.00) &rarr; Cents (2500)</td>
                      <td className="p-2.5 text-emerald-700">Valid number</td>
                      <td className="p-2.5">Quantile-Ratio Constancy test (x100)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M4: Default Flip</td>
                      <td className="p-2.5">Default currency USD &rarr; EUR</td>
                      <td className="p-2.5 text-emerald-700">Valid payload</td>
                      <td className="p-2.5">Explicit default parameter injection</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M5: Pagination Shift</td>
                      <td className="p-2.5">Offset integer &rarr; Opaque cursor</td>
                      <td className="p-2.5 text-crimson">400 Bad Request</td>
                      <td className="p-2.5">Query param rewrite + cursor extraction</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M6: Silent Truncation</td>
                      <td className="p-2.5">Limit 100 capped at 20 items</td>
                      <td className="p-2.5 text-emerald-700">Valid JSON list</td>
                      <td className="p-2.5">HyperLogLog cardinality alert + pagination loop</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M7: Webhook Flatten</td>
                      <td className="p-2.5">event.type &rarr; type top-level</td>
                      <td className="p-2.5 text-amber-700">Structural delta</td>
                      <td className="p-2.5">JSON un-nesting object transformer</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M8: Rate Limit Drift</td>
                      <td className="p-2.5">Quota reduction + HTTP 429 Retry-After</td>
                      <td className="p-2.5 text-crimson">HTTP 429</td>
                      <td className="p-2.5">Dynamic client-side token bucket throttling</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M9: MCP Tool Drift</td>
                      <td className="p-2.5">Tool parameter schema modification</td>
                      <td className="p-2.5 text-crimson">Agent tool error</td>
                      <td className="p-2.5">MCP proxy signature wrapper</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">M10: Enum Semantics</td>
                      <td className="p-2.5">status: active includes suspended</td>
                      <td className="p-2.5 text-emerald-700">Valid enum item</td>
                      <td className="p-2.5">Distribution shift warning + PR proposal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">1.3 Objective and Scope</h3>
              <p>
                Intra implements a closed loop: continuous observation of live traffic, inference of contracts and behavioural fingerprints (T-Digest quantiles, HyperLogLog cardinality), multi-layer change detection with Kuhn-Munkres Hungarian bipartite matching for renames and Quantile-Ratio Constancy for unit shifts, AST blast-radius mapping, FlashFill Programming-by-Example adapter synthesis under a Safe-Handling Policy Matrix, and Wald SPRT + golden-replay validation before promotion. The research question is whether this closed-loop, behaviour-first, policy-gated control flow is a distinguishable technical contribution.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">1.4 Approach</h3>
              <p>
                We inspected the public repository Precise-Goals/Intra, mapped features to <code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">packages/observer</code>, <code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">model</code>, <code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">differ</code>, <code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">impact</code>, <code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">adapter</code>, <code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">validator</code> and <code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">apps/engine</code>, incorporated project documentation (explain.md, guide.md, metricsandlogs.md, Pitch.md), surveyed academic literature, commercial products and patent databases, and treated the supplied architecture diagrams as authoritative. We do not assert patentability. This document is a technical research assessment, not legal advice.
              </p>
            </div>
          </section>

          {/* 2. Technical Field */}
          <section className="space-y-4 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              2. Technical Field
            </h2>
            <p>
              The invention belongs to software infrastructure management: autonomous detection of and adaptation to undocumented behavioural changes in external service dependencies (REST APIs, SDKs, webhooks, MCP tool servers), using live observation, streaming sketches, bipartite schema matching, inductive program synthesis, and sequential hypothesis testing for canary promotion.
            </p>
          </section>

          {/* 3. System Architecture and Implemented Workflow */}
          <section className="space-y-6 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              3. System Architecture and Implemented Workflow
            </h2>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">3.1 High-Level Component View</h3>
              <p>
                Intra is a pnpm/turbo monorepo. The core engine is a Fastify monolith hosting the six-stage pipeline. A React 18 + Vite dashboard streams telemetry. A customer MCP server exposes seven discovery and adaptation tools. A TypeScript client SDK intercepts and adapts production traffic. Simulated services support controlled M1–M10 mutations.
              </p>

              {/* Ascii Architectural Diagram */}
              <div className="p-4 rounded-xl bg-black text-emerald-400 font-mono text-xs overflow-x-auto leading-tight space-y-1">
                <div>+---------------------------------------------------------------------------------+</div>
                <div>|                              INTRA 6-STAGE ENGINE                              |</div>
                <div>|                                                                                 |</div>
                <div>|  [1. OBSERVER] ----&gt; [2. MODEL] ----&gt; [3. DIFFER] ----&gt; [4. IMPACT]           |</div>
                <div>|    SHA-256 PII        T-Digest &amp;       Hungarian Match    AST Blast-Radius      |</div>
                <div>|    Redaction           HLL Sketches     Quantile-Ratio     Dependency Graph     |</div>
                <div>|                                                                                 |</div>
                <div>|  [6. VALIDATOR] &lt;------------------ [5. ADAPTER] &lt;------------------------------+ |</div>
                <div>|    Wald SPRT Canary Test             FlashFill PBE Synthesizer                  |</div>
                <div>|    Golden Replay &amp; Rollback          Safe-Handling Policy Matrix                |</div>
                <div>+---------------------------------------------------------------------------------+</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">3.2 Six-Stage Adaptation Loop</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Observer:</strong> non-blocking HTTP/SDK/webhook capture with SHA-256 PII redaction.</li>
                <li><strong>Model:</strong> T-Digest quantiles and HyperLogLog cardinality for behavioural fingerprints.</li>
                <li><strong>Differ:</strong> Hungarian bipartite matching for renames; Quantile-Ratio Constancy for unit shifts; confidence and semantic verdict.</li>
                <li><strong>Impact:</strong> TypeScript AST dependency graph mapping fields to workflows and source lines.</li>
                <li><strong>Adapter:</strong> FlashFill PBE typed-DSL synthesis + Safe-Handling Policy Matrix (auto-apply / migration PR / circuit-break).</li>
                <li><strong>Validator:</strong> golden-replay equivalence + Wald Sequential Probability Ratio Test for canary promote/rollback.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">3.3 Implementation Evidence</h3>
              <p>
                Repository cloned October 2026. Empirical evaluation (<code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">metricsandlogs.md</code>): 551/551 tests across 31 suites, 0 failures. 50-sample multi-domain batch: average detection confidence 88%, equivalence replay pass rate 90%, auto-apply 31, migration PR 14, circuit-break 5.
              </p>

              {/* Table 1 */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left font-mono text-xs border border-black/15 bg-white">
                  <thead className="bg-[#FAF8F5] border-b border-black/15 text-black">
                    <tr>
                      <th className="p-2.5">Feature Component</th>
                      <th className="p-2.5">Package Location</th>
                      <th className="p-2.5">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    <tr>
                      <td className="p-2.5 font-bold">T-Digest &amp; HLL sketches</td>
                      <td className="p-2.5">packages/model/src/sketches.ts</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Implemented &amp; Tested</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Hungarian rename matching</td>
                      <td className="p-2.5">packages/differ (hungarian.ts)</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Implemented &amp; Tested</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Quantile-Ratio unit shift</td>
                      <td className="p-2.5">packages/differ (unitShift.ts)</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Implemented &amp; Tested</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">FlashFill PBE synthesizer</td>
                      <td className="p-2.5">packages/adapter (pbe.ts)</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Implemented &amp; Tested</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Safe-Handling Policy Matrix</td>
                      <td className="p-2.5">packages/adapter/src/policy.ts</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Implemented &amp; Tested</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Wald SPRT Canary Controller</td>
                      <td className="p-2.5">packages/validator (sprt.ts)</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Implemented &amp; Tested</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">AST Blast Radius Traversal</td>
                      <td className="p-2.5">packages/impact/src/analyzer.ts</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Implemented &amp; Tested</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Customer MCP Server (7 Tools)</td>
                      <td className="p-2.5">mcpserver/src/server.ts</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Implemented &amp; Live</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">SHA-256 Audit Ledger</td>
                      <td className="p-2.5">WebCrypto + MST Blockchain Testnet</td>
                      <td className="p-2.5 text-emerald-700 font-bold">Implemented &amp; Verified</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[11px] font-mono text-black/50 mt-1 italic">
                  Table 1. Feature-to-Implementation Evidence Matrix (updated with algorithmic modules).
                </p>
              </div>
            </div>
          </section>

          {/* 4. Background and Prior Art */}
          <section className="space-y-6 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              4. Background and Prior Art
            </h2>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">4.1 Academic and Algorithmic Foundations</h3>
              <p>
                Intra deliberately reuses peer-reviewed primitives rather than inventing new mathematics: T-Digest (Dunning & Ertl), HyperLogLog (Flajolet et al.), Kuhn-Munkres Hungarian assignment (1955), FlashFill inductive program synthesis (Gulwani, POPL 2011 / CACM 2012), and Wald’s Sequential Probability Ratio Test (1945). The contribution, if any, lies in the closed-loop composition for live third-party API/MCP behavioural drift.
              </p>
              <p>
                A 2026 Technical Disclosure Commons publication (Agrawal & Shinde, VISA) on silent backward-incompatible API contract drift using runtime structural-semantic fingerprints remains the closest single disclosure to the model + differ stages. Commercial monitors (FlareCanary, DriftGuard, DiffMon, Beeceptor) provide baseline or OpenAPI response-shape drift with alerting; most stop short of confidence-gated auto-apply, AST impact, PBE adapter synthesis and SPRT canary control.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">4.2 Patent and Commercial Landscape</h3>
              <p>
                Patents on API-integration remediation, impact analysis of third-party components, and software change analysis cover overlapping elements. FlashFill-style PBE is widely published and productised (Excel, PROSE SDK); SPRT has been applied to canary and progressive delivery (recent sequential progressive delivery papers). No single identified patent claims the exact Intra combination of streaming behavioural fingerprints + Hungarian semantic rename + Quantile-Ratio unit shift + FlashFill DSL adapters + Safe-Handling Matrix + Wald SPRT promotion for third-party HTTP/MCP dependencies.
              </p>

              {/* Table 2 */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left font-mono text-xs border border-black/15 bg-white">
                  <thead className="bg-[#FAF8F5] border-b border-black/15 text-black">
                    <tr>
                      <th className="p-2.5">Source / Prior Art</th>
                      <th className="p-2.5">Core Mechanism</th>
                      <th className="p-2.5">Similarity (1–5)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    <tr>
                      <td className="p-2.5 font-bold">TDCommons Fingerprints (VISA 2026)</td>
                      <td className="p-2.5">Runtime fingerprints + invariants</td>
                      <td className="p-2.5 font-bold text-crimson">5 / 5 (Extremely High)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Commercial Drift Monitors</td>
                      <td className="p-2.5">Baseline / OpenAPI shape alerts</td>
                      <td className="p-2.5 text-amber-700">4 / 5</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">API Remediation Patents</td>
                      <td className="p-2.5">Monitor + adapter adjustments</td>
                      <td className="p-2.5 text-amber-700">4 / 5</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">FlashFill / PROSE (Gulwani 2011)</td>
                      <td className="p-2.5">PBE string/data transforms</td>
                      <td className="p-2.5 text-black/60">3 / 5 (Adapter only)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">SPRT Canary Literature (Wald 1945)</td>
                      <td className="p-2.5">Sequential promote/rollback</td>
                      <td className="p-2.5 text-black/60">3 / 5 (Validator only)</td>
                    </tr>
                    <tr className="bg-cream-subtle font-bold">
                      <td className="p-2.5 text-crimson">Intra (This Work)</td>
                      <td className="p-2.5">Full closed loop + policy matrix + golden SPRT</td>
                      <td className="p-2.5">Self (N/A)</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[11px] font-mono text-black/50 mt-1 italic">
                  Table 2. Prior-art comparison (1=low, 5=extremely similar).
                </p>
              </div>
            </div>
          </section>

          {/* 5. Problem Statement and Research Questions */}
          <section className="space-y-4 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              5. Problem Statement and Research Questions
            </h2>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-black/10 text-xs sm:text-sm font-mono space-y-2">
              <strong className="text-crimson block font-bold text-sm">
                RQ1 (Central Hypothesis):
              </strong>
              <p>
                Can a system that maintains live behavioural models (T-Digest/HLL), detects structural and semantic drift via Hungarian matching and Quantile-Ratio tests with confidence/verdict, maps AST blast radius, synthesises FlashFill adapters under a deterministic Safe-Handling Policy, and validates with golden-replay + Wald SPRT measurably reduce integration MTTR and silent semantic failures versus static monitoring and manual remediation?
              </p>
            </div>
            <p>
              Supporting questions cover rename/unit detection precision, detection-to-action latency, success versus static baselines, mixed-version rollout behaviour under SPRT, and whether the closed-loop control flow is distinguishable from the closest fingerprint and remediation prior art.
            </p>
          </section>

          {/* 6. Summary of the Invention */}
          <section className="space-y-4 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              6. Summary of the Invention
            </h2>
            <p>
              Intra is a computer-implemented system and method for recovering consumer-side integrations after undocumented upstream behavioural change. It observes live traffic; builds contracts and behavioural fingerprints with space-bounded sketches; detects structural and semantic changes (including optimal bipartite rename assignment and unit-scale constancy); computes affected workflows via AST; synthesises adapters via inductive program synthesis under a policy that auto-applies only high-confidence equivalent changes, opens migration PRs for lossy/medium-confidence cases, and circuit-breaks breaking/unknown cases; validates by golden replay and sequential probability ratio testing; and records tamper-evident cryptographic audit seals. The operator retains control over low-confidence and breaking changes.
            </p>
          </section>

          {/* 7. Novelty Analysis */}
          <section className="space-y-6 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              7. Novelty Analysis
            </h2>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">7.1 Mechanism Decomposition</h3>
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left font-mono text-xs border border-black/15 bg-white">
                  <thead className="bg-[#FAF8F5] border-b border-black/15 text-black">
                    <tr>
                      <th className="p-2.5">Mechanism</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Novelty Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    <tr>
                      <td className="p-2.5 font-bold">A</td>
                      <td className="p-2.5">Live observation + SHA-256 PII redaction</td>
                      <td className="p-2.5 text-black/50">Low</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">B</td>
                      <td className="p-2.5">T-Digest / HLL behavioural fingerprints</td>
                      <td className="p-2.5 text-black/50">Low (known sketches)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">C</td>
                      <td className="p-2.5">Hungarian rename + Quantile-Ratio unit shift</td>
                      <td className="p-2.5 text-amber-700 font-bold">Moderate (application domain)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">D</td>
                      <td className="p-2.5">AST blast-radius mapping</td>
                      <td className="p-2.5 text-black/50">Low</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">E</td>
                      <td className="p-2.5">FlashFill PBE adapter synthesis</td>
                      <td className="p-2.5 text-black/70">Low–Moderate (known PBE)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">F</td>
                      <td className="p-2.5">Safe-Handling Policy Matrix</td>
                      <td className="p-2.5 text-crimson font-bold">Possible (novel control logic)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">G</td>
                      <td className="p-2.5">Golden replay + Wald SPRT canary</td>
                      <td className="p-2.5 text-crimson font-bold">Possible (closed-loop composition)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-crimson">H</td>
                      <td className="p-2.5">Closed-loop full pipeline + ledger</td>
                      <td className="p-2.5 text-crimson font-bold">Possible (system method)</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[11px] font-mono text-black/50 mt-1 italic">
                  Table 3. Novelty assessment by mechanism (updated).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-lg text-black">7.2 Three Levels of Novelty</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Level 1 (Components):</strong> Low. Observation, sketches, Hungarian assignment, FlashFill, SPRT, AST analysis and approval gates are each established.
                </li>
                <li>
                  <strong>Level 2 (Combination):</strong> Moderate and contested by the TDCommons fingerprint disclosure and commercial drift monitors.
                </li>
                <li>
                  <strong>Level 3 (Specific Control Logic):</strong> The narrowest candidate remains the confidence-and-verdict Safe-Handling Policy together with mandatory golden-replay + SPRT promotion and atomic rollback, applied to live third-party API/MCP behavioural drift. Residual novelty depends on implementation detail and measured technical effect not disclosed in the closest prior art.
                </li>
              </ul>
            </div>
          </section>

          {/* 8. Patentability Assessment */}
          <section className="space-y-4 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              8. Patentability Assessment (Technical, Non-Legal)
            </h2>
            <p>
              Broad claims of “detecting API schema drift from traffic and generating adapters” face high risk from commercial monitors, the TDCommons disclosure, and API-remediation patents. Narrower claims around (1) the closed-loop control method that uses behavioural-fingerprint similarity, Hungarian assignment and Quantile-Ratio tests for semantic classification, (2) the dual-path Safe-Handling Matrix (auto-apply vs PR vs circuit-break), and (3) mandatory golden-replay + Wald SPRT before promotion with atomic rollback may retain a residual argument subject to full file-wrapper and non-patent literature review by counsel. A skilled SRE/API engineer would likely view aggregation of known primitives as obvious unless a surprising technical effect is demonstrated. Enablement is supported by the public repository and 551 passing tests. Framing as a technical improvement to reliability of distributed integrations is preferable for eligibility analysis.
            </p>
          </section>

          {/* 9. IP Market Boundaries and Competitive Positioning */}
          <section className="space-y-4 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              9. IP Market Boundaries and Competitive Positioning
            </h2>
            <p>
              Primary market: API observability and autonomous remediation for third-party and MCP dependencies. Direct competitors: drift monitors and AIOps platforms. Differentiation: closed loop from behavioural model &rarr; semantic verdict &rarr; policy-gated FlashFill adapter &rarr; SPRT/golden validation; pure monitors stop at alert. Protection boundary: copyright/trade secret for the codebase; patent focus, if any, on the narrow control logic rather than broad “API drift detection”. Commercial boundary: adoption depends on false-positive rate, mixed-version handling, and SDK integration cost. The prototype’s empirical batch results (88% confidence, 90% equivalence) are supportive but not yet enterprise-scale evidence.
            </p>
          </section>

          {/* 10. Security and Failure-Safe Design */}
          <section className="space-y-4 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              10. Security and Failure-Safe Design
            </h2>
            <p>
              Risks include observation-channel compromise, fingerprint poisoning, adapter injection, approval bypass, and recovery-loop attacks. Controls include least-privilege identities, signed adapters, SHA-256 tamper-evident ledger, optional MST blockchain approval signatures, and circuit-breakers. Failure modes under incomplete fingerprints, mixed-version rollouts (mitigated by SPRT indecision bounds), and partial adapter application require explicit safe-abort paths partially demonstrated in tests.
            </p>
          </section>

          {/* 11. Experimental Status */}
          <section className="space-y-4 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              11. Experimental Status
            </h2>
            <p>
              <code className="font-mono text-xs bg-black/5 px-1 py-0.5 rounded">metricsandlogs.md</code> reports 551/551 tests, 0 failures; T-Digest relative error ~0.005% on 10k samples; HyperLogLog relative error &lt;1% on 20k entities; Hungarian optimal assignment under 4 ms for 100&times;100; Quantile-Ratio CV=0.0000 on pure unit shifts and correct rejection of quadratic/additive noise; FlashFill 100% train/test accuracy with sub-millisecond synthesis; SPRT promote/rollback at designed &alpha;/&beta;. 50-sample multi-domain batch: 88% avg confidence, 90% equivalence, safe-handling distribution 31/14/5. No independent third-party statistical validation against production baselines was located.
            </p>
          </section>

          {/* 12. Potential Claim Concepts */}
          <section className="space-y-4 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              12. Potential Claim Concepts (Non-Legal)
            </h2>
            <p>
              <strong>Independent method concept:</strong> observing live traffic; inferring structural contracts and behavioural fingerprints via streaming sketches; detecting structural and semantic changes including bipartite rename assignment and unit-scale constancy with confidence and semantic verdict; computing AST impact; synthesising adapters via inductive program synthesis under a policy that auto-applies only high-confidence equivalent changes and otherwise opens a migration proposal or circuit-breaks; validating by golden-workflow replay and sequential probability ratio testing; promoting or rolling back; recording cryptographic audit seals.
            </p>
            <p>
              <strong>Dependent concepts:</strong> mixed-version SPRT indecision; Quantile-Ratio decision rule; FlashFill depth-bounded Occam search; atomic rollback handles; MCP observation path; mid-loop re-modelling on validation failure.
            </p>
          </section>

          {/* 13. IPR Roadmap */}
          <section className="space-y-4 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              13. IPR Roadmap
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>1.</strong> Freeze architecture, commit hash, inventor contributions and metrics ledger hash.</li>
              <li><strong>2.</strong> Expanded prior-art search focused on TDCommons fingerprint family, API-remediation patents, and combinations of PBE + SPRT in canary contexts.</li>
              <li><strong>3.</strong> Written counsel opinion on residual novelty for the narrow Safe-Handling + SPRT + golden-replay control claims.</li>
              <li><strong>4.</strong> Provisional only if residual novelty is supported, stressing behavioural-fingerprint semantic classification, policy matrix and SPRT promotion.</li>
              <li><strong>5.</strong> Attach controlled experimental data and audit ledger evidence to the complete specification.</li>
              <li><strong>6.</strong> Open-source licence and third-party IP review before commercial release.</li>
            </ol>
          </section>

          {/* 14. Conclusion and Verdict */}
          <section className="space-y-6 pt-4 font-sans text-sm sm:text-base text-black/85">
            <h2 className="font-display font-bold text-2xl text-black border-b border-black/10 pb-2">
              14. Conclusion and Verdict
            </h2>
            <p>
              Intra is a coherent, working prototype of behaviour-first, policy-gated autonomous adaptation for third-party API and MCP dependencies. The engineering is real: streaming sketches, Hungarian matching, Quantile-Ratio tests, FlashFill synthesis, Safe-Handling Matrix, AST impact, golden replay and Wald SPRT exist in code with 551 passing tests and published batch metrics. Against the strongest prior art the research contribution is narrower than product messaging might suggest. The combination of behavioural-fingerprint-driven semantic classification, mandatory confidence/verdict gates and golden-replay/SPRT promotion remains the most defensible technical ground and even that is contested.
            </p>
            <p>
              <strong>What is strong:</strong> deterministic, inspectable control path; separation of deterministic synthesis from optional LLM assistance; empirical batch results and cryptographic auditability.
            </p>
            <p>
              <strong>What is known:</strong> traffic-based inference, structural/behavioural drift detection, impact graphs, PBE adapters, sequential canary testing, approval gates.
            </p>

            {/* Table 4 */}
            <div className="overflow-x-auto my-4">
              <table className="w-full text-left font-mono text-xs border border-black/15 bg-white">
                <thead className="bg-[#FAF8F5] border-b border-black/15 text-black">
                  <tr>
                    <th className="p-2.5">Assessment Dimension</th>
                    <th className="p-2.5">Empirical Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  <tr>
                    <td className="p-2.5 font-bold">Overall technical differentiation</td>
                    <td className="p-2.5 font-bold text-black">6 / 10</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Novelty potential (narrow claims)</td>
                    <td className="p-2.5 text-amber-700 font-bold">4–5 / 10</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Patentability risk</td>
                    <td className="p-2.5 text-crimson font-bold">High (broad); Medium (narrow control)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Implementation readiness</td>
                    <td className="p-2.5 text-emerald-700 font-bold">8 / 10 (551 tests, verified metrics)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Enterprise potential (with hardening)</td>
                    <td className="p-2.5 text-black">7 / 10</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Demo / technical impact</td>
                    <td className="p-2.5 text-emerald-700 font-bold">9 / 10</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[11px] font-mono text-black/50 mt-1 italic">
                Table 4. Overall assessment (technical research view only). Patent counsel must review this paper before any filing decision. Nothing herein is legal advice.
              </p>
            </div>
          </section>

          {/* References */}
          <section className="space-y-4 pt-6 border-t border-black/15 font-sans text-xs sm:text-sm text-black/80">
            <h2 className="font-display font-bold text-xl text-black">
              References
            </h2>
            <ol className="list-none space-y-2.5 font-mono text-xs">
              <li className="p-2 rounded hover:bg-black/5 transition flex items-start space-x-2">
                <span className="font-bold text-crimson">[1]</span>
                <span>Precise-Goals/Intra source, docs/lock.md, explain.md, guide.md, metricsandlogs.md, Pitch.md, inspected October 2026.</span>
              </li>
              <li className="p-2 rounded hover:bg-black/5 transition flex items-start space-x-2">
                <span className="font-bold text-crimson">[2]</span>
                <span>Article - Agrawal & Shinde, “Systems and Methods for Detecting Silent Backward-Incompatible API Contract Drift Using Runtime Structural-Semantic Fingerprints,” Technical Disclosure Commons, 2026.</span>
              </li>
              <li className="p-2 rounded hover:bg-black/5 transition flex items-start space-x-2">
                <span className="font-bold text-crimson">[3]</span>
                <span>Dunning & Ertl, “Computing Extremely Accurate Quantiles Using t-Digests,” arXiv:1902.04023.</span>
              </li>
              <li className="p-2 rounded hover:bg-black/5 transition flex items-start space-x-2">
                <span className="font-bold text-crimson">[4]</span>
                <span>Flajolet et al., “HyperLogLog: near-optimal cardinality estimation,” AOFA 2007.</span>
              </li>
              <li className="p-2 rounded hover:bg-black/5 transition flex items-start space-x-2">
                <span className="font-bold text-crimson">[5]</span>
                <span>Kuhn, “The Hungarian Method for the Assignment Problem,” Naval Research Logistics, 1955.</span>
              </li>
              <li className="p-2 rounded hover:bg-black/5 transition flex items-start space-x-2">
                <span className="font-bold text-crimson">[6]</span>
                <span>Gulwani, “Automating String Processing in Spreadsheets using Input-Output Examples,” POPL 2011; FlashFill / PROSE literature.</span>
              </li>
              <li className="p-2 rounded hover:bg-black/5 transition flex items-start space-x-2">
                <span className="font-bold text-crimson">[7]</span>
                <span>Wald, “Sequential Tests of Statistical Hypotheses,” Ann. Math. Stat. 1945; recent SPRT canary / progressive-delivery applications.</span>
              </li>
              <li className="p-2 rounded hover:bg-black/5 transition flex items-start space-x-2">
                <span className="font-bold text-crimson">[8]</span>
                <span>Commercial API drift monitors (FlareCanary, DriftGuard, DiffMon, Beeceptor et al.) and API-remediation / impact-analysis patents, 2017–2026.</span>
              </li>
            </ol>
          </section>
            </article>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY 2: TERMS AND POLICIES (docsCategory === 'terms')                */}
      {/* ========================================================================= */}
      {docsCategory === 'terms' && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="p-8 sm:p-10 rounded-[2.5rem] border border-black/10 bg-white/95 shadow-card space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="verified-badge flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-crimson" />
                <span>LEGAL & COMPLIANCE SPECIFICATION</span>
              </span>
              <span className="text-[11px] font-mono text-black/50 bg-black/5 px-2.5 py-0.5 rounded-full border border-black/5">
                SECTION 10 SAFE-HANDLING & ZERO-EGRESS PII
              </span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-black tracking-tight">
              Terms of Service, Safe-Handling Matrix & Governance Policies
            </h1>
            <p className="text-sm sm:text-base text-black/70 leading-relaxed font-sans max-w-3xl">
              Binding operational boundaries, automated adapter promotion gates, privacy protections, service level commitments, and intellectual property terms governing Intra and its associated software components.
            </p>
            <div className="pt-2 text-xs font-mono text-black/50">
              Effective Date: October 2026 &bull; Version 2.4.0-Production &bull; MIT Licensed Core
            </div>
          </div>

          {/* Policy 1: Safe-Handling Policy Matrix §10 */}
          <div className="p-8 rounded-[2.5rem] border border-black/10 bg-white shadow-card space-y-6">
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-crimson" />
              <h2 className="font-display font-bold text-xl text-black">
                1. Safe-Handling Policy Matrix (Section 10 Operational Policy)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-sans leading-relaxed">
              Intra strictly partitions automated actions versus human engineering intervention using a deterministic two-dimensional matrix of Empirical Confidence Score ($c$) and Semantic Verdict ($V$). No machine-synthesized adapter is permitted to mutate production traffic outside these certified thresholds.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-black/10 rounded-2xl bg-white">
                <thead className="bg-[#FAF9F5] text-black border-b border-black/10">
                  <tr>
                    <th className="p-3">Confidence Score</th>
                    <th className="p-3">Semantic Verdict</th>
                    <th className="p-3">Safe-Handling Action</th>
                    <th className="p-3">Operational Constraint &amp; SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  <tr className="hover:bg-emerald-50/50 transition">
                    <td className="p-3 font-bold text-black">&ge; 0.90</td>
                    <td className="p-3 text-black">Equivalent</td>
                    <td className="p-3 font-bold text-emerald-600">Auto-Apply</td>
                    <td className="p-3">In-process canary injected with mandatory atomic rollback handle. Wald SPRT early stopping within 25 calls.</td>
                  </tr>
                  <tr className="hover:bg-black/5 transition">
                    <td className="p-3 font-bold text-black">0.70 &le; c &lt; 0.90</td>
                    <td className="p-3 text-black">Equivalent</td>
                    <td className="p-3 font-bold text-black">Migration PR</td>
                    <td className="p-3">Automated Git PR opened with synthetic adapter diff, AST blast radius, and Jest test suite.</td>
                  </tr>
                  <tr className="hover:bg-amber-50/50 transition">
                    <td className="p-3 font-bold text-black">Any score</td>
                    <td className="p-3 text-amber-700 font-bold">Lossy</td>
                    <td className="p-3 font-bold text-black">Migration PR</td>
                    <td className="p-3">Data precision reduction detected (e.g., float truncation). Explicit human sign-off mandatory.</td>
                  </tr>
                  <tr className="hover:bg-crimson/5 transition">
                    <td className="p-3 font-bold text-crimson">&lt; 0.70</td>
                    <td className="p-3 text-black">Any</td>
                    <td className="p-3 font-bold text-crimson">Quarantine Alert</td>
                    <td className="p-3">Zero automated changes permitted. PagerDuty/Slack incident dispatched with evidence sample dump.</td>
                  </tr>
                  <tr className="hover:bg-crimson/10 transition">
                    <td className="p-3 font-bold text-crimson">Any score</td>
                    <td className="p-3 font-bold text-crimson">Breaking</td>
                    <td className="p-3 font-bold text-crimson">Circuit Breaker</td>
                    <td className="p-3">Trips fail-open or circuit breaker immediately to prevent cascading upstream errors.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Policy 2: Zero-Egress PII Redaction & Data Protection */}
          <div className="p-8 rounded-[2.5rem] border border-black/10 bg-white shadow-card space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-crimson" />
              <h2 className="font-display font-bold text-xl text-black">
                2. Zero-Egress Privacy & PII Redaction Policy
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-sans leading-relaxed">
              The <code className="bg-black/5 px-1 py-0.5 rounded font-mono text-xs">@intra/observer</code> module performs immediate in-memory scrubbing before any payload or structural representation is persisted or analyzed:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-sans text-xs sm:text-sm text-black/80">
              <li>
                <strong>Immediate Masking:</strong> Sensitive authorization headers (<code className="font-mono text-xs">Authorization</code>, <code className="font-mono text-xs">Cookie</code>, <code className="font-mono text-xs">x-api-key</code>) and sensitive JSON keys (<code className="font-mono text-xs">password</code>, <code className="font-mono text-xs">ssn</code>, <code className="font-mono text-xs">creditCard</code>, <code className="font-mono text-xs">secret</code>) are scrubbed before fingerprint generation.
              </li>
              <li>
                <strong>Irreversible Sketches:</strong> T-Digest centroids and HyperLogLog bit-registers retain streaming statistics only. No raw customer payload records are stored or sent off-box.
              </li>
              <li>
                <strong>Regulatory Compliance:</strong> Architecture complies with GDPR Article 25 (Data Protection by Design) and HIPAA Safe Harbor de-identification requirements.
              </li>
            </ul>
          </div>

          {/* Policy 3: Service Level Agreement & Performance Commitments */}
          <div className="p-8 rounded-[2.5rem] border border-black/10 bg-white shadow-card space-y-4">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-crimson" />
              <h2 className="font-display font-bold text-xl text-black">
                3. Service Level Agreement (SLA) &amp; Latency Guarantees
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs pt-2">
              <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5 space-y-1">
                <span className="text-crimson font-bold text-sm">99.99% Availability</span>
                <p className="text-black/60 font-sans text-xs">
                  In-process client interceptor (<code className="font-mono">@intra/sdk</code>) operates with zero external network dependency on hot request paths.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5 space-y-1">
                <span className="text-crimson font-bold text-sm">&lt;5ms P95 Overhead</span>
                <p className="text-black/60 font-sans text-xs">
                  Synthesized Occam AST adapters execute in-memory with sub-5ms overhead.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-cream-subtle border border-black/5 space-y-1">
                <span className="text-crimson font-bold text-sm">10ms Atomic Rollback</span>
                <p className="text-black/60 font-sans text-xs">
                  Any canary adapter that trips Wald SPRT lower bound is rolled back in &le;10 milliseconds.
                </p>
              </div>
            </div>
          </div>

          {/* Policy 4: Cryptographic Non-Repudiation & Audit Standards */}
          <div className="p-8 rounded-[2.5rem] border border-black/10 bg-white shadow-card space-y-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-crimson" />
              <h2 className="font-display font-bold text-xl text-black">
                4. Cryptographic Non-Repudiation &amp; Warranty Disclaimers
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-sans leading-relaxed">
              Every stage of the adaptation loop produces an immutable W3C WebCrypto SHA-256 digest linked to the operator's verification ledger. Intra software is distributed under the MIT License "AS IS", without warranties of any kind regarding third-party upstream API behavioral modifications. Engineering operators retain ultimate architectural responsibility for promoting migration pull requests.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY 3: ARCHITECTURE BLUEPRINT (docsCategory === 'docs')              */}
      {/* ========================================================================= */}
      {docsCategory === 'docs' && (
        <div className="space-y-10">
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/95 p-8 md:p-12 shadow-card dot-grid-pattern">
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="verified-badge flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
                  <span>THEORETICAL FOUNDATIONS &amp; FORMAL CITATIONS</span>
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

              {/* Quick Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3 font-mono text-xs">
                <button
                  onClick={() => handleCategorySwitch('research')}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-crimson text-white font-bold hover:bg-crimson-hover transition shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Read Borderless Research Paper</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCategorySwitch('terms')}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-black text-white font-bold hover:bg-black/80 transition shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>View Terms &amp; Policies</span>
                </button>
              </div>

              {/* Sub-Filter Pills */}
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

          {/* VECTOR ARCHITECTURE FLOW: 6-Stage Closed Loop */}
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

          {/* HIGH-ROI ALGORITHMIC FOUNDATIONS & EMPIRICAL BENCHMARKS */}
          {(activeFilter === 'all' || activeFilter === 'algorithms') && (
            <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-8">
              <div className="border-b border-black/10 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="verified-badge">TIER 1 ALGORITHMS</span>
                  <span className="text-xs font-mono text-black/50">MATHEMATICAL COMPLEXITY &amp; PROOFS</span>
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
                        Dunning &amp; Ertl (2019)
                      </span>
                    </div>
                    <p className="text-xs text-black/75 leading-relaxed font-sans">
                      Computes high-accuracy extreme percentiles (<code className="font-mono text-black font-semibold">p99, p99.9</code>) across unbuffered API observation streams using an adaptive scale function that concentrates centroids near the tails.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/60 pt-2 border-t border-black/10">
                    <div>Memory: <strong className="text-black">&lt;8 KB bounded</strong></div>
                    <div>Complexity: <strong className="text-black">O(&delta;) amortized</strong></div>
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
                      Estimates distinct value cardinality across high-throughput payload parameters to detect enum expansions vs ID transitions with provable theoretical error bounds of <code className="font-mono text-black font-semibold">1.04 / &radic;m &approx; 0.81%</code>.
                    </p>
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
                      Evaluates decile ratio vectors <code className="font-mono text-black font-semibold">r_k = Q_k(Y) / Q_k(X)</code>. When the Coefficient of Variation <code className="font-mono text-black font-semibold">CV(r) = &sigma; / &mu; &lt; 0.05</code>, it mathematically classifies scalar conversions (cents to dollars x100, metric x1000).
                    </p>
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
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/60 pt-2 border-t border-black/10">
                    <div>Complexity: <strong className="text-black">O(V&sup3;) Kuhn-Munkres</strong></div>
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
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-black/60 pt-2 border-t border-black/10">
                    <div>Early Stopping: <strong className="text-black">12–25 requests</strong></div>
                    <div>Safety Guarantees: <strong className="text-black">Strict Type I/II Bounds</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* THEORETICAL PRINCIPLES */}
          {(activeFilter === 'all' || activeFilter === 'principles') && (
            <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
              <div className="border-b border-black/10 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="verified-badge">SYSTEM PRINCIPLES</span>
                  <span className="text-xs font-mono text-black/50">INVARIANTS &amp; DISTRIBUTED SYSTEMS</span>
                </div>
                <h2 className="font-display font-bold text-2xl text-black mt-1">
                  Theoretical Principles of Self-Healing Distributed Systems
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs text-black/75 leading-relaxed">
                <div className="p-6 rounded-[2rem] border border-black/10 bg-[#FAF9F5] space-y-2.5">
                  <div className="flex items-center space-x-2 text-crimson font-mono font-bold text-xs uppercase">
                    <span className="w-2 h-2 rounded-full bg-crimson" />
                    <span>Principle 1: Behavioral Subtyping &amp; Liskov Invariance</span>
                  </div>
                  <p>
                    Syntactic schema adherence is insufficient for software survival. Real-world contracts are defined by operational invariants: optionality frequencies, error taxonomies, and latency distributions. An adapter is valid if and only if it preserves semantic expectations without data loss.
                  </p>
                </div>

                <div className="p-6 rounded-[2rem] border border-black/10 bg-[#FAF9F5] space-y-2.5">
                  <div className="flex items-center space-x-2 text-crimson font-mono font-bold text-xs uppercase">
                    <span className="w-2 h-2 rounded-full bg-crimson" />
                    <span>Principle 2: Conservative Safe-Handling &amp; Failure Asymmetry</span>
                  </div>
                  <p>
                    Safe failure beats clever failure. Automated repairs are strictly limited to verified, high-confidence equivalent changes (&ge;0.90 confidence). Lossy or breaking shifts automatically halt automated mutations and produce human-reviewed PR diffs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* BIBLIOGRAPHY & CITATIONS */}
          {(activeFilter === 'all' || activeFilter === 'citations') && (
            <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
              <div className="border-b border-black/10 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="verified-badge">BIBLIOGRAPHY</span>
                  <span className="text-xs font-mono text-black/50">PEER-REVIEWED LITERATURE &amp; STANDARDS</span>
                </div>
                <h2 className="font-display font-bold text-2xl text-black mt-1">
                  Academic &amp; Industrial Citations
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

          {/* MUTATIONS & APIS */}
          {(activeFilter === 'all' || activeFilter === 'api' || activeFilter === 'mutations') && (
            <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
              <div className="flex justify-between items-center border-b border-black/10 pb-4">
                <div>
                  <span className="verified-badge">PRODUCTION APIS</span>
                  <h2 className="font-display font-bold text-2xl text-black mt-1">
                    Customer MCP Server &amp; Engine REST API Directory
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DocsContainer;
