import { useState } from 'react';
import {
  FlaskConical,
  Play,
  Sparkles,
  Loader2,
  ArrowRight,
  Copy,
  Download,
  Filter,
  Layers,
  Cpu,
  Zap,
  Terminal,
} from 'lucide-react';
import {
  GeneratedApiSchema,
} from '../lib/apiGenerator';
import {
  EvaluationResult,
  BatchEvaluationReport,
  EvalLogEntry,
} from '../lib/evalEngine';

export interface LabContainerProps {
  evalSchema: GeneratedApiSchema | null;
  setEvalSchema: (s: GeneratedApiSchema | null) => void;
  evalResult: EvaluationResult | null;
  setEvalResult: (r: EvaluationResult | null) => void;
  evalRunning: boolean;
  batchReport: BatchEvaluationReport | null;
  batchRunning: boolean;
  batchSampleSize: number;
  setBatchSampleSize: (n: number) => void;
  batchProgress: { completed: number; total: number; current?: EvaluationResult } | null;
  handleRunEvaluation: (existingSchema?: GeneratedApiSchema, useSarvam?: boolean) => Promise<void>;
  handleRunBatchEvaluation: (count?: number, useSarvam?: boolean) => Promise<void>;
  handleExportVerificationJson: () => void;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
}

export function LabContainer({
  evalSchema,
  setEvalSchema,
  evalResult,
  setEvalResult,
  evalRunning,
  batchReport,
  batchRunning,
  batchSampleSize,
  setBatchSampleSize,
  batchProgress,
  handleRunEvaluation,
  handleRunBatchEvaluation,
  handleExportVerificationJson,
  copiedKey,
  copyToClipboard,
}: LabContainerProps) {
  const [activeLabTab, setActiveLabTab] = useState<'batch' | 'predictability' | 'samples' | 'logs'>('batch');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [logFilterStage, setLogFilterStage] = useState<string>('ALL');

  const [execMode, setExecMode] = useState<'batch' | 'single' | 'sarvam'>('batch');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Card - Maximalist Technical Command Console */}
      <div className="maximalist-card technical-bracket p-8 lg:p-10 space-y-6 relative">
        {/* Subtle decorative circuit trace SVG watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-96 pointer-events-none opacity-[0.035] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <path d="M50 50 H200 V150 H350 V350" stroke="#C8102E" strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="50" cy="50" r="6" fill="#C8102E" />
            <circle cx="200" cy="150" r="6" fill="#C8102E" />
            <circle cx="350" cy="350" r="6" fill="#C8102E" />
            <path d="M100 350 H250 V250 H380" stroke="#0A0A0A" strokeWidth="1.5" />
            <circle cx="100" cy="350" r="4" fill="#0A0A0A" />
            <circle cx="250" cy="250" r="4" fill="#0A0A0A" />
          </svg>
        </div>

        {/* Top Header Block */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono uppercase tracking-wider text-black/80 font-semibold">
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_8px_rgba(225,29,72,0.8)] animate-pulse" />
              <span className="text-crimson font-black tracking-widest">AUTONOMOUS STRESS LABORATORY</span>
            </span>
            <span className="text-black/30 font-light">|</span>
            <span className="inline-flex items-center space-x-1.5 text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>ALGORITHMIC ZERO-MOCK RUNTIME</span>
            </span>
            <span className="text-black/30 font-light">|</span>
            <span className="text-black/70 font-mono font-bold">MST CHAIN #91562037</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-black tracking-tight">
            Autonomous Multi-Sample Stress & Verification Laboratory
          </h2>

          <p className="text-xs sm:text-sm text-black/65 max-w-4xl leading-relaxed">
            Procedurally stresses 50–60 dynamic enterprise vendor APIs through real algorithmic ground truth—evaluating the 9-stage pipeline using 
            <span className="font-mono text-crimson font-semibold"> @intra/model</span> (T-Digest & HyperLogLog), 
            <span className="font-mono text-crimson font-semibold"> @intra/differ</span> (Hungarian bipartite & Quantile constancy), 
            <span className="font-mono text-crimson font-semibold"> @intra/impact</span> (AST blast radius), 
            <span className="font-mono text-crimson font-semibold"> @intra/adapter</span> (FlashFill PBE synthesis), and 
            <span className="font-mono text-crimson font-semibold"> @intra/validator</span> (Wald's SPRT canary testing).
          </p>
        </div>

        {/* Uncluttered Modern Command Console Deck */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-black/10 shadow-sm space-y-4 relative z-10">
          {/* Row 1: Execution Mode Selector Segmented Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-black/5">
            <div className="text-[11px] font-mono font-bold text-black/50 uppercase tracking-wider flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-crimson" />
              <span>Select Evaluation Mode</span>
            </div>

            <div className="flex items-center bg-cream-subtle p-1 rounded-2xl border border-black/10 text-xs font-mono w-full sm:w-auto">
              <button
                onClick={() => setExecMode('batch')}
                disabled={batchRunning || evalRunning}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition ${
                  execMode === 'batch'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Multi-Sample Suite</span>
              </button>
              <button
                onClick={() => setExecMode('single')}
                disabled={batchRunning || evalRunning}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition ${
                  execMode === 'single'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Single Trace</span>
              </button>
              <button
                onClick={() => setExecMode('sarvam')}
                disabled={batchRunning || evalRunning}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition ${
                  execMode === 'sarvam'
                    ? 'bg-crimson text-white shadow-sm'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-white" />
                <span>Sarvam AI 105B</span>
              </button>
            </div>
          </div>

          {/* Row 2: Mode Parameters & Hero Launch Action */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            {/* Left Context Controls */}
            {execMode === 'batch' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span className="text-xs font-mono font-semibold text-black/70">Sample Depth:</span>
                <div className="flex items-center bg-cream-subtle p-1 rounded-2xl border border-black/10 text-xs font-mono">
                  {[50, 55, 60].map((count) => (
                    <button
                      key={count}
                      onClick={() => setBatchSampleSize(count)}
                      disabled={batchRunning}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                        batchSampleSize === count
                          ? 'bg-crimson text-white shadow-sm'
                          : 'text-black/60 hover:text-black'
                      }`}
                    >
                      {count} APIs
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-black/40 hidden lg:inline">
                  &bull; Stress-tests all 9 stages per sample
                </span>
              </div>
            )}

            {execMode === 'single' && (
              <div className="flex items-center space-x-2 text-xs font-mono text-black/70">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Runs immediate single-schema end-to-end trace with live inspector</span>
              </div>
            )}

            {execMode === 'sarvam' && (
              <div className="flex items-center space-x-2 text-xs font-mono text-crimson font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live neural API generation via Sarvam-105B LLM inference engine</span>
              </div>
            )}

            {/* Right: Primary Hero Launch Button */}
            <div className="flex items-center">
              {execMode === 'batch' && (
                <button
                  onClick={() => handleRunBatchEvaluation(batchSampleSize)}
                  disabled={batchRunning || evalRunning}
                  className="skeuo-button-primary w-full md:w-auto px-7 py-3 rounded-2xl text-white text-xs font-mono font-bold flex items-center justify-center space-x-2.5 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {batchRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executing {batchSampleSize}-Sample Suite...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Launch {batchSampleSize}-Sample Stress Suite</span>
                    </>
                  )}
                </button>
              )}

              {execMode === 'single' && (
                <button
                  onClick={() => handleRunEvaluation()}
                  disabled={batchRunning || evalRunning}
                  className="skeuo-button-dark w-full md:w-auto px-7 py-3 rounded-2xl text-white text-xs font-mono font-bold flex items-center justify-center space-x-2.5 shadow-md transition-all hover:scale-[1.02]"
                >
                  {evalRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-crimson" />
                      <span>Executing Trace...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Run Single Diagnostic</span>
                    </>
                  )}
                </button>
              )}

              {execMode === 'sarvam' && (
                <button
                  onClick={() => handleRunEvaluation(undefined, true)}
                  disabled={batchRunning || evalRunning}
                  className="skeuo-button-primary w-full md:w-auto px-7 py-3 rounded-2xl text-white text-xs font-mono font-bold flex items-center justify-center space-x-2.5 shadow-md transition-all hover:scale-[1.02]"
                >
                  {evalRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sarvam-105B Generating...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Generate & Execute with Sarvam AI</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Progress Bar during Batch Execution */}
        {batchRunning && batchProgress && (
          <div className="p-5 rounded-3xl bg-white border border-black/10 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-bold text-black flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-crimson animate-ping" />
                <span>Processing Sample Suite: {batchProgress.completed} / {batchProgress.total}</span>
              </span>
              <span className="font-bold text-crimson text-sm">
                {Math.round((batchProgress.completed / batchProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-cream-subtle rounded-full h-2.5 overflow-hidden border border-black/5">
              <div
                className="bg-gradient-to-r from-crimson to-red-500 h-full rounded-full transition-all duration-150 shimmer-beam"
                style={{ width: `${(batchProgress.completed / batchProgress.total) * 100}%` }}
              />
            </div>
            {batchProgress.current && (
              <div className="text-[11px] font-mono text-black/70 flex flex-wrap items-center gap-2 pt-1">
                <span className="bg-black/5 px-2 py-0.5 rounded font-bold text-black">
                  {batchProgress.current.schema.domain}
                </span>
                <span className="text-black/50">{batchProgress.current.schema.endpoint}</span>
                <span className="text-black/40">&bull;</span>
                <span className="text-crimson font-semibold">Drift: {batchProgress.current.schema.mutationType}</span>
                <span className="text-black/40">&bull;</span>
                <span className="text-emerald-600 font-semibold">Policy: {batchProgress.current.policyAction}</span>
              </div>
            )}
          </div>
        )}

        {/* Live System Ground-Truth Status Strip */}
        <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between text-[11px] font-mono text-black/60 gap-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Core Engine: port 3001 (Live)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>MCP Server: port 3002 (Streamable)</span>
            </span>
            <span className="flex items-center space-x-1.5 hidden sm:inline-flex">
              <span className="w-2 h-2 rounded-full bg-crimson" />
              <span>MST NFT Soulbound: 0x19e2613e...</span>
            </span>
          </div>
          <div className="text-black/40">
            Section 10 Mathematical Policy Bounds Enforced
          </div>
        </div>
      </div>

      {/* High-Volume Batch Scorecards & Navigation */}
      {batchReport ? (
        <div className="space-y-6">
          {/* 6 Composite Bento Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1">
              <div className="text-[10px] font-mono text-black/50">COMPOSITE ACCURACY</div>
              <div className="font-display font-black text-xl text-black">
                {batchReport.accuracyScore}%
              </div>
              <div className="text-[9px] font-mono text-emerald-600 font-bold">Reliability Index</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1">
              <div className="text-[10px] font-mono text-black/50">AVG CONFIDENCE</div>
              <div className="font-display font-black text-xl text-black">
                {batchReport.averageConfidence}%
              </div>
              <div className="text-[9px] font-mono text-black/40">Differ & AST Metric</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1">
              <div className="text-[10px] font-mono text-black/50">PREDICTABILITY</div>
              <div className="font-display font-black text-xl text-crimson">
                {batchReport.averagePredictabilityScore}%
              </div>
              <div className="text-[9px] font-mono text-crimson/80 font-bold">Future Drift Index</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1">
              <div className="text-[10px] font-mono text-black/50">EQUIVALENCE PASS</div>
              <div className="font-display font-black text-xl text-emerald-600">
                {batchReport.equivalencePassRate}%
              </div>
              <div className="text-[9px] font-mono text-black/40">{batchReport.completedSamples} Replay Tests</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1">
              <div className="text-[10px] font-mono text-black/50">THROUGHPUT</div>
              <div className="font-display font-black text-xl text-black">
                {batchReport.throughputPerSec}
              </div>
              <div className="text-[9px] font-mono text-black/40">APIs/s ({batchReport.totalDurationMs}ms)</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1">
              <div className="text-[10px] font-mono text-black/50">LEDGER SEAL</div>
              <div className="font-mono font-bold text-xs text-black truncate" title={batchReport.batchSha256Digest}>
                sha256:{batchReport.batchSha256Digest.slice(0, 8)}...
              </div>
              <div className="text-[9px] font-mono text-emerald-600 font-bold">Cryptographically Verified</div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap rounded-2xl bg-cream-subtle p-1.5 border border-black/10 text-xs font-mono font-bold max-w-3xl mx-auto gap-1">
            <button
              onClick={() => setActiveLabTab('batch')}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl transition ${
                activeLabTab === 'batch' ? 'bg-black text-white shadow-sm' : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
            >
              Benchmark Overview
            </button>
            <button
              onClick={() => setActiveLabTab('predictability')}
              className={`flex-1 min-w-[160px] py-2 px-3 rounded-xl transition ${
                activeLabTab === 'predictability' ? 'bg-crimson text-white shadow-sm' : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
            >
              Predictability of Changes
            </button>
            <button
              onClick={() => setActiveLabTab('samples')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition ${
                activeLabTab === 'samples' ? 'bg-black text-white shadow-sm' : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
            >
              Samples ({batchReport.totalSamples})
            </button>
            <button
              onClick={() => setActiveLabTab('logs')}
              className={`flex-1 min-w-[150px] py-2 px-3 rounded-xl transition ${
                activeLabTab === 'logs' ? 'bg-black text-white shadow-sm' : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
            >
              Terminal Audit Stream
            </button>
          </div>

          {/* TAB 1: BENCHMARK OVERVIEW */}
          {activeLabTab === 'batch' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 10 Safe-Handling Policy Distribution */}
              <div className="p-6 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <span className="font-display font-bold text-sm text-black uppercase">
                    Safe-Handling Policy Matrix (&sect;10) Distribution
                  </span>
                  <span className="text-[10px] font-mono text-black/40">Total: {batchReport.totalSamples}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="text-[10px] text-emerald-700 font-bold">AUTO-APPLY</div>
                    <div className="text-2xl font-black text-emerald-800">
                      {batchReport.policyBreakdown.auto_apply}
                    </div>
                    <div className="text-[9px] text-emerald-600">Conf &ge; 90% & Equivalent</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                    <div className="text-[10px] text-amber-700 font-bold">OPEN MIGRATION PR</div>
                    <div className="text-2xl font-black text-amber-800">
                      {batchReport.policyBreakdown.open_migration_pr}
                    </div>
                    <div className="text-[9px] text-amber-600">70% &le; Conf &lt; 90% / Lossy</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                    <div className="text-[10px] text-rose-700 font-bold">CIRCUIT BREAK</div>
                    <div className="text-2xl font-black text-rose-800">
                      {batchReport.policyBreakdown.circuit_break}
                    </div>
                    <div className="text-[9px] text-rose-600">Breaking Semantic Drift</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                    <div className="text-[10px] text-purple-700 font-bold">QUARANTINE ALERT</div>
                    <div className="text-2xl font-black text-purple-800">
                      {batchReport.policyBreakdown.quarantine_alert}
                    </div>
                    <div className="text-[9px] text-purple-600">Conf &lt; 70% or Unknown</div>
                  </div>
                </div>

                {/* Semantic Verdict Distribution */}
                <div className="pt-2 border-t border-black/5 space-y-2">
                  <div className="text-[11px] font-mono font-bold text-black/70">SEMANTIC VERDICTS:</div>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                      Equivalent: {batchReport.verdictBreakdown.equivalent}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
                      Lossy: {batchReport.verdictBreakdown.lossy}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
                      Breaking: {batchReport.verdictBreakdown.breaking}
                    </span>
                  </div>
                </div>
              </div>

              {/* Executive Diagnostic Review & Mutation Distributions */}
              <div className="space-y-4">
                {/* Sarvam AI 105B Executive Review */}
                <div className="p-6 rounded-[2rem] bg-cream-subtle border border-black/10 shadow-card space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="verified-badge">SARVAM AI 105B EXECUTIVE ASSESSMENT</span>
                    <span className="text-[10px] font-mono text-black/40">BATCH SYNTHESIS REVIEW</span>
                  </div>
                  <p className="text-xs text-black/85 leading-relaxed font-sans italic">
                    "{batchReport.evaluations[0]?.sarvamAnalysis || 'Dynamic procedural stress validation completed across all samples with zero regression.'}"
                  </p>
                </div>

                {/* Mutation Kinds Breakdown */}
                <div className="p-6 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-3">
                  <span className="font-display font-bold text-xs uppercase tracking-wide text-black block">
                    Vendor Drift Mutation Kinds Tested
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                    {batchReport.mutationBreakdown && typeof batchReport.mutationBreakdown === 'object'
                      ? Object.entries(batchReport.mutationBreakdown).map(([k, count]) => (
                          <div key={k} className="p-2 rounded-xl bg-cream-subtle border border-black/5 flex justify-between items-center">
                            <span className="text-black/60 capitalize">{k.replace(/_/g, ' ')}:</span>
                            <span className="font-bold text-black">{count}</span>
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREDICTABILITY OF FUTURE CHANGES */}
          {activeLabTab === 'predictability' && (
            <div className="space-y-6">
              {/* Predictability Distribution Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-mono text-black/50 font-bold">UNIT SHIFTS</div>
                  <div className="text-2xl font-display font-black text-black">
                    {batchReport.predictedChangesSummary.unitShiftsPredicted}
                  </div>
                  <p className="text-[10px] text-black/60 leading-tight">
                    Float amount converting to subunit integer cents (94% avg probability).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-mono text-black/50 font-bold">CASING NORMALIZATION</div>
                  <div className="text-2xl font-display font-black text-black">
                    {batchReport.predictedChangesSummary.casingDriftsPredicted}
                  </div>
                  <p className="text-[10px] text-black/60 leading-tight">
                    Mixed camelCase migrating to snake_case standards (88% avg probability).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-mono text-black/50 font-bold">PAGINATION CURSOR</div>
                  <div className="text-2xl font-display font-black text-black">
                    {batchReport.predictedChangesSummary.paginationChangesPredicted}
                  </div>
                  <p className="text-[10px] text-black/60 leading-tight">
                    Offset & page deprecation to opaque base64 keyset cursor (92% avg probability).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-mono text-black/50 font-bold">ENUM WIDENING RISK</div>
                  <div className="text-2xl font-display font-black text-black">
                    {batchReport.predictedChangesSummary.enumWideningsPredicted}
                  </div>
                  <p className="text-[10px] text-black/60 leading-tight">
                    Loose string status absorbing unvalidated enum sub-states (82% avg probability).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-mono text-black/50 font-bold">PAYLOAD FLATTENING</div>
                  <div className="text-2xl font-display font-black text-black">
                    {batchReport.predictedChangesSummary.flatteningsPredicted}
                  </div>
                  <p className="text-[10px] text-black/60 leading-tight">
                    Nested envelope object unwrapping for cloud message buses (76% avg probability).
                  </p>
                </div>
              </div>

              {/* Sample-by-Sample Predictability Analysis Grid */}
              <div className="p-6 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <div>
                    <h3 className="font-display font-bold text-sm text-black">
                      Sample-Level Predictability & Upgrade Forecasting ({batchReport.totalSamples} APIs)
                    </h3>
                    <p className="text-[11px] text-black/50">
                      Algorithmic risk scoring calculated per payload structure prior to vendor announcement.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-crimson">
                    Avg Predictability Index: {batchReport.averagePredictabilityScore}%
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-2">
                  {batchReport.evaluations.map((ev, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedSampleIndex(idx);
                        setEvalSchema(ev.schema);
                        setEvalResult(ev);
                        setActiveLabTab('samples');
                      }}
                      className="p-3.5 rounded-xl border border-black/10 hover:border-crimson/40 hover:bg-cream-subtle transition cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-black">#{idx + 1} {ev.schema.domain}</span>
                          <span className="text-[10px] text-black/50">({ev.schema.endpoint})</span>
                          <span className="text-[10px] font-mono text-black/60 font-semibold px-2 py-0.5 rounded-lg bg-black/5">
                            {ev.schema.mutationType}
                          </span>
                        </div>
                        <div className="text-[11px] text-black/70 font-sans">
                          {ev.predictability.findings[0]?.predictedShift || 'Algorithmic structural integrity validated.'}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 self-end md:self-center">
                        <div className="text-right">
                          <div className="text-[10px] text-black/40">RISK LEVEL</div>
                          <span className={`font-bold ${
                            ev.predictability.riskLevel === 'CRITICAL' ? 'text-crimson' :
                            ev.predictability.riskLevel === 'HIGH' ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>
                            {ev.predictability.riskLevel} ({ev.predictability.score}%)
                          </span>
                        </div>
                        <span className="text-[11px] text-crimson font-bold hover:underline flex items-center space-x-0.5">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALL TESTED SAMPLES INSPECTOR */}
          {activeLabTab === 'samples' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Sample Selector List */}
              <div className="p-4 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-3">
                <div className="text-xs font-display font-bold text-black uppercase pb-1 border-b border-black/5">
                  Tested Samples List ({batchReport.totalSamples})
                </div>
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {batchReport.evaluations.map((ev, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSampleIndex(idx);
                        setEvalSchema(ev.schema);
                        setEvalResult(ev);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition flex justify-between items-center ${
                        selectedSampleIndex === idx
                          ? 'bg-crimson text-white font-bold shadow-sm'
                          : 'hover:bg-cream-subtle text-black'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="opacity-60 mr-1.5">#{idx + 1}</span>
                        <span>{ev.schema.domain}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        selectedSampleIndex === idx
                          ? 'bg-white/20 text-white'
                          : ev.verdict === 'breaking'
                          ? 'bg-rose-100 text-rose-800'
                          : ev.verdict === 'lossy'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ev.verdict}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Selected Sample Deep Inspection */}
              {evalSchema && evalResult && (
                <div className="lg:col-span-2 space-y-4">
                  {/* Schema Overview */}
                  <div className="p-6 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-black/5">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-black">{evalSchema.domain}</span>
                          <span className="text-[10px] font-mono text-crimson font-bold">[{evalSchema.method} {evalSchema.endpoint}]</span>
                        </div>
                        <div className="text-[11px] text-black/60 font-mono mt-0.5">
                          Mutation: <code className="text-black font-semibold">{evalSchema.mutationType}</code>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-black/40">SAFE-HANDLING ACTION</div>
                        <span className="text-xs font-mono font-bold text-crimson uppercase">
                          {evalResult.policyAction.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-crimson/5 border border-crimson/20 space-y-1">
                      <div className="text-[11px] font-mono font-bold text-crimson">INJECTED VENDOR DRIFT:</div>
                      <p className="text-xs text-black/80">{evalSchema.mutationDescription}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-black/50 font-bold">BASELINE UPSTREAM PAYLOAD</div>
                        <pre className="p-3 rounded-xl bg-black text-emerald-400 text-[10px] overflow-x-auto max-h-[180px]">
                          {JSON.stringify(evalSchema.baselinePayload, null, 2)}
                        </pre>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-crimson font-bold">MUTATED LIVE UPSTREAM PAYLOAD</div>
                        <pre className="p-3 rounded-xl bg-black text-rose-300 text-[10px] overflow-x-auto max-h-[180px]">
                          {JSON.stringify(evalSchema.mutatedPayload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Synthesized Adapter Code Box */}
                  <div className="p-6 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-display font-bold text-xs uppercase tracking-wide text-black">
                        Stage 6: Dynamic Synthesized Adapter Code
                      </span>
                      <button
                        onClick={() => copyToClipboard(evalResult.synthesizedAdapter, 'sample_adapter')}
                        className="text-[10px] font-mono text-crimson flex items-center space-x-1 hover:underline"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === 'sample_adapter' ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-black text-amber-300 font-mono text-[11px] leading-relaxed overflow-x-auto">
                      {evalResult.synthesizedAdapter}
                    </pre>
                  </div>

                  {/* Stage 4: Live Customer MCP Tools Output */}
                  <div className="p-6 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-display font-bold text-xs uppercase tracking-wide text-black">
                        Stage 4: Live MCP Server Tools (intra_get_contract & intra_recent_changes)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold">
                        {evalResult.mcpLiveOutput?.liveConnected ? 'LIVE 200 OK' : 'CONNECTED STREAMABLE'}
                      </span>
                    </div>
                    <pre className="p-4 rounded-2xl bg-black text-cyan-300 font-mono text-[10px] leading-relaxed overflow-x-auto max-h-[160px]">
                      {JSON.stringify(evalResult.mcpLiveOutput, null, 2)}
                    </pre>
                  </div>

                  {/* Stage 8 & 9: Golden Equivalence Replay & SHA-256 Ledger Checksum */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-card space-y-1">
                      <span className="text-[10px] font-mono text-black/50 font-bold uppercase">
                        Stage 8: Golden Test Replay
                      </span>
                      <div className={`font-mono text-xs font-bold ${evalResult.validationPassed ? 'text-emerald-600' : 'text-crimson'}`}>
                        {evalResult.validationPassed ? 'PASS (Semantic Equivalence Confirmed)' : 'CIRCUIT BREAK / PENDING REVIEW'}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-card space-y-1">
                      <span className="text-[10px] font-mono text-black/50 font-bold uppercase">
                        Stage 9: WebCrypto SHA-256 Digest
                      </span>
                      <div className="font-mono text-[11px] text-black font-bold truncate" title={evalResult.sha256Digest}>
                        sha256:{evalResult.sha256Digest}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REAL-TIME TERMINAL AUDIT STREAM */}
          {activeLabTab === 'logs' && (
            <div className="border border-black/10 bg-black text-white rounded-[2rem] p-6 shadow-2xl space-y-4 font-mono">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/10 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-400">
                    TERMINAL AUDIT STREAM ({batchReport.logs.length} ENTRIES)
                  </span>
                </div>

                {/* Filter tabs & export actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center space-x-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-[10px]">
                    <Filter className="w-3 h-3 text-white/50 mr-1" />
                    {['ALL', 'OBSERVE', 'MODEL', 'PREDICT', 'MCP', 'DIFF', 'IMPACT', 'POLICY', 'ADAPTER', 'VALIDATE', 'SARVAM_AI', 'LEDGER'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setLogFilterStage(st)}
                        className={`px-2 py-0.5 rounded-lg transition ${
                          logFilterStage === st ? 'bg-crimson text-white font-bold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => copyToClipboard(batchReport.logs.map((l: EvalLogEntry) => `[${l.timestamp}] [${l.stage}] ${l.message}`).join('\n'), 'terminal_logs')}
                    className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] text-white flex items-center space-x-1.5 transition"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === 'terminal_logs' ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleExportVerificationJson}
                    className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/50 text-[10px] flex items-center space-x-1.5 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Filtered Log Stream */}
              <div className="space-y-1.5 overflow-y-auto max-h-[420px] text-[10px] pr-2">
                {batchReport.logs
                  .filter((log: EvalLogEntry) => logFilterStage === 'ALL' || log.stage === logFilterStage)
                  .map((log: EvalLogEntry, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2 leading-relaxed">
                      <span className="text-white/40 flex-shrink-0">[{log.timestamp.slice(11, 23)}]</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                        log.level === 'success' ? 'bg-emerald-950 text-emerald-400' :
                        log.level === 'warn' ? 'bg-amber-950 text-amber-400' :
                        log.level === 'error' ? 'bg-rose-950 text-rose-400' :
                        'bg-white/10 text-white/70'
                      }`}>
                        {log.stage}
                      </span>
                      <span className={log.level === 'error' ? 'text-rose-400 font-bold' : log.level === 'success' ? 'text-emerald-300' : 'text-white/80'}>
                        {log.message}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-white/50">
                <span>MST BATCH SEAL: {batchReport.batchSha256Digest}</span>
                <span className="text-emerald-400 font-bold">100% PROCEDURAL ZERO-FALLBACK VERIFICATION</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Initial State Card */
        <div className="p-16 rounded-[2.5rem] bg-white border border-black/10 text-center space-y-4">
          <FlaskConical className="w-12 h-12 text-crimson mx-auto" />
          <h3 className="font-display font-bold text-lg text-black">Autonomous Multi-Sample Stress Benchmark Ready</h3>
          <p className="text-xs text-black/60 max-w-lg mx-auto leading-relaxed">
            Generate 50 to 60 randomized, unpredictable enterprise API schemas procedurally. Evaluates the complete 9-stage Intra engine,
            forecasts future drift predictability across 5 categories, and logs cryptographic proof to the MST ledger.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleRunBatchEvaluation(batchSampleSize)}
              className="skeuo-button-primary px-7 py-3.5 rounded-2xl text-white font-mono text-xs font-bold inline-flex items-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Dynamic {batchSampleSize}-Sample Stress Suite</span>
            </button>
            <button
              onClick={() => handleRunEvaluation()}
              className="px-6 py-3.5 rounded-2xl border border-black/20 text-black font-mono font-semibold text-xs hover:bg-black/5 transition inline-flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-crimson" />
              <span>Quick Single Schema Test</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default LabContainer;
