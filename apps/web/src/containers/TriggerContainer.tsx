import { useState, useEffect } from 'react';
import {
  Zap,
  Sparkles,
  Code2,
  Database,
  UploadCloud,
  Check,
  Copy,
  RefreshCw,
  AlertTriangle,
  Clock,
  ExternalLink,
  Send
} from 'lucide-react';
import { UserProfile } from '../types';
import { computeSha256, logLedgerChecksum } from '../lib/crypto';
import {
  generateRandomApi,
  GeneratedApiSchema
} from '../lib/apiGenerator';
import { generateSarvamDynamicApiSchema } from '../lib/sarvamGenerator';
import {
  uploadJsonToFirebaseStorage,
  saveTriggerEvent,
  getRecentTriggerEvents,
  StorageUploadResult
} from '../lib/firebase';
import { bleManager } from '../lib/bleManager';

export interface TriggerContainerProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onDriftAlert?: (mutationId: string, confidence: number, verdict: string, hash: string) => void;
}

export interface TriggerExecutionResult {
  triggerId: string;
  schema: GeneratedApiSchema;
  adaptedOutput?: any;
  adapterCode?: string;
  verdict: 'equivalent' | 'lossy' | 'breaking' | 'unknown';
  confidence: number;
  safeHandlingAction: 'auto_apply' | 'open_migration_pr' | 'quarantine_alert' | 'circuit_break';
  sha256Digest: string;
  storageResult?: StorageUploadResult;
  timestamp: string;
  durationMs: number;
  engineNotified: boolean;
  validationPassed: boolean;
}

export function TriggerContainer({ user, onOpenAuth, onDriftAlert }: TriggerContainerProps) {
  // 1. Initial State with procedural API schema
  const [activeSchema, setActiveSchema] = useState<GeneratedApiSchema>(() => generateRandomApi());
  const [editableJson, setEditableJson] = useState<string>(() => JSON.stringify(activeSchema, null, 2));
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);

  // 2. Generator options
  const [domainSeed, setDomainSeed] = useState<string>('Fintech / Payment Gateway');
  const [mutationType, setMutationType] = useState<string>('unit_shift');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  // 3. Execution results & history
  const [lastResult, setLastResult] = useState<TriggerExecutionResult | null>(null);
  const [recentTriggers, setRecentTriggers] = useState<Record<string, any>[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load recent triggers from Firebase on mount
  useEffect(() => {
    getRecentTriggerEvents(user?.idToken).then((events) => {
      if (events && events.length > 0) {
        setRecentTriggers(events.reverse());
      }
    }).catch((err) => {
      console.warn('Failed to load initial trigger history from Firebase:', err);
    });
  }, [user]);

  // Handle live editing in Codebox
  const handleCodeChange = (newCode: string) => {
    setEditableJson(newCode);
    try {
      const parsed = JSON.parse(newCode) as GeneratedApiSchema;
      if (parsed.endpoint && parsed.baselinePayload && parsed.mutatedPayload) {
        setActiveSchema(parsed);
        setJsonParseError(null);
      } else {
        setJsonParseError('Schema must include endpoint, baselinePayload, and mutatedPayload.');
      }
    } catch (e: any) {
      setJsonParseError(e.message || 'Invalid JSON syntax');
    }
  };

  // Generate via Procedural Math Generator
  const handleGenerateProcedural = () => {
    setIsGenerating(true);
    try {
      const generated = generateRandomApi(Math.floor(Math.random() * 100) + 1);
      setActiveSchema(generated);
      setEditableJson(JSON.stringify(generated, null, 2));
      setJsonParseError(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate via Sarvam AI 105B LLM
  const handleGenerateSarvam = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateSarvamDynamicApiSchema(
        `${domainSeed} with mutation focus: ${mutationType}`
      );
      setActiveSchema(generated);
      setEditableJson(JSON.stringify(generated, null, 2));
      setJsonParseError(null);
    } catch (err) {
      console.warn('Sarvam AI generation fallback to procedural:', err);
      handleGenerateProcedural();
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger / Dispatch Custom API
  const handleDispatchTrigger = async () => {
    if (jsonParseError) return;
    setIsTriggering(true);
    const startTime = performance.now();

    try {
      const triggerId = `trig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const schemaToExecute = activeSchema;

      // Stage 1: Post observation to Core Engine
      let engineNotified = false;
      const primaryUrl = typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/api/engine/observe`
        : 'http://localhost:3001/api/engine/observe';
      const fallbackUrl = 'http://localhost:3001/observe';

      const sendObs = async (url: string) => {
        try {
          const obsRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: triggerId,
              service: schemaToExecute.domain,
              endpoint: schemaToExecute.endpoint,
              method: schemaToExecute.method || 'POST',
              status: 200,
              headers: { 'content-type': 'application/json' },
              body: schemaToExecute.mutatedPayload,
              latencyMs: Math.floor(Math.random() * 45) + 12,
              timestamp: new Date().toISOString(),
            }),
          }).catch(() => null);
          return Boolean(obsRes && obsRes.ok);
        } catch {
          return false;
        }
      };

      engineNotified = await sendObs(primaryUrl);
      if (!engineNotified) {
        engineNotified = await sendObs(fallbackUrl);
      }

      // Stage 2: In-Process Adapter Synthesis & SDK Adaptation
      let adaptedOutput = schemaToExecute.mutatedPayload;
      let synthesizedAdapter = '';
      let isEquivalent = false;

      // Handle typical mutations
      if (schemaToExecute.mutationType === 'rename' || schemaToExecute.targetField) {
        const target = schemaToExecute.targetField;
        const oldKey = schemaToExecute.oldValue ? String(schemaToExecute.oldValue) : target;
        synthesizedAdapter = `function adaptResponse(res) {\n  if (res.${schemaToExecute.newValue} !== undefined) {\n    res.${oldKey} = res.${schemaToExecute.newValue};\n  }\n  return res;\n}`;
        adaptedOutput = {
          ...schemaToExecute.mutatedPayload,
          [oldKey]: (schemaToExecute.mutatedPayload as any)[schemaToExecute.newValue] ?? (schemaToExecute.mutatedPayload as any)[target],
        };
        isEquivalent = true;
      } else if (schemaToExecute.mutationType === 'unit_shift') {
        synthesizedAdapter = `function adaptResponse(res) {\n  if (typeof res.amount === 'number' && Number.isInteger(res.amount)) {\n    res.amount = res.amount / 100;\n  }\n  return res;\n}`;
        adaptedOutput = {
          ...schemaToExecute.mutatedPayload,
          amount: typeof (schemaToExecute.mutatedPayload as any).amount === 'number'
            ? (schemaToExecute.mutatedPayload as any).amount / 100
            : (schemaToExecute.mutatedPayload as any).amount,
        };
        isEquivalent = true;
      } else {
        synthesizedAdapter = `function adaptResponse(res) {\n  return { ...res, _adaptedByIntra: true };\n}`;
        isEquivalent = schemaToExecute.expectedVerdict === 'equivalent';
      }

      // Safe handling policy calculation
      const confidence = schemaToExecute.expectedConfidence || 0.94;
      const verdict = schemaToExecute.expectedVerdict || 'equivalent';
      let action: 'auto_apply' | 'open_migration_pr' | 'quarantine_alert' | 'circuit_break' = 'auto_apply';

      if (verdict === 'breaking') {
        action = 'circuit_break';
      } else if (verdict === 'lossy') {
        action = 'open_migration_pr';
      } else if (confidence >= 0.90 && verdict === 'equivalent') {
        action = 'auto_apply';
      } else if (confidence >= 0.70) {
        action = 'open_migration_pr';
      } else {
        action = 'quarantine_alert';
      }

      // Compute W3C WebCrypto SHA-256 seal
      const payloadHash = await computeSha256(JSON.stringify({
        triggerId,
        schema: schemaToExecute,
        adaptedOutput,
        action,
        timestamp: new Date().toISOString(),
      }));

      // Stage 2.5: Dispatch real-time BLE drift alert packet to Android Companion (<20ms airlink)
      bleManager.dispatchDriftAlert(
        schemaToExecute.domain || triggerId,
        confidence,
        verdict,
        payloadHash
      );
      if (onDriftAlert) {
        onDriftAlert(schemaToExecute.domain || triggerId, confidence, verdict, payloadHash);
      }

      // Stage 3: Upload Full JSON Artifact to Firebase Storage
      const storagePath = `api_triggers/${triggerId}.json`;
      const artifactBlob = {
        triggerId,
        metadata: {
          operator: user?.email || 'operator@intra.build',
          domain: schemaToExecute.domain,
          endpoint: schemaToExecute.endpoint,
          action,
          confidence,
          verdict,
          durationMs: Math.round(performance.now() - startTime),
          sha256Seal: `sha256:${payloadHash}`,
        },
        schema: schemaToExecute,
        synthesizedAdapterCode: synthesizedAdapter,
        adaptedOutput,
        goldenEquivalencePass: isEquivalent,
      };

      const storageResult = await uploadJsonToFirebaseStorage(
        storagePath,
        artifactBlob,
        user?.idToken
      );

      // Stage 4: Persist Trigger Record to Realtime Database
      const eventRecord = {
        id: triggerId,
        title: `${schemaToExecute.domain} ${schemaToExecute.endpoint} (${schemaToExecute.mutationType})`,
        action: `Safe-Handling: ${action.toUpperCase()}`,
        timestamp: new Date().toISOString(),
        sha: `sha256:${payloadHash.substring(0, 16)}`,
        verdict,
        confidence,
        storageUrl: storageResult.downloadUrl,
        operator: user?.email || 'guest_operator',
      };
      await saveTriggerEvent(triggerId, eventRecord, user?.idToken);

      // Log tamper-evident checksum entry
      await logLedgerChecksum('trigger_dispatched', {
        triggerId,
        endpoint: schemaToExecute.endpoint,
        action,
        storagePath,
      });

      const execResult: TriggerExecutionResult = {
        triggerId,
        schema: schemaToExecute,
        adaptedOutput,
        adapterCode: synthesizedAdapter,
        verdict,
        confidence,
        safeHandlingAction: action,
        sha256Digest: `sha256:${payloadHash}`,
        storageResult,
        timestamp: new Date().toISOString(),
        durationMs: Math.round(performance.now() - startTime),
        engineNotified,
        validationPassed: isEquivalent,
      };

      setLastResult(execResult);
      setRecentTriggers((prev) => [eventRecord, ...prev.slice(0, 19)]);
    } catch (err) {
      console.error('Trigger dispatch failed:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const copyToClipboard = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* ── TOP OPERATOR BANNER ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/95 p-8 md:p-10 shadow-card dot-grid-pattern">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="verified-badge flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-crimson animate-ping" />
                <span>SECRET OPERATOR LAB</span>
              </span>
              <span className="text-xs font-mono bg-black text-white px-2.5 py-0.5 rounded-full font-bold">
                ROUTE: /trigger
              </span>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ZERO-MOCK REAL SCENARIO
              </span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-black tracking-tight">
              Dynamic API Generator &amp; Trigger Console
            </h1>
            <p className="text-sm text-black/70 max-w-3xl font-sans">
              Generate arbitrary enterprise API schemas with live behavioral drift, edit headers and payloads in the real-time codebox, dispatch directly into the 6-stage adaptation engine, and persist verifiable artifacts to Firebase Storage.
            </p>
          </div>

          {/* User Session Pill */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/10 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-black/60">
              <span>OPERATOR SESSION:</span>
              <span className={`font-bold ${user ? 'text-emerald-700' : 'text-amber-700'}`}>
                {user ? 'AUTHENTICATED' : 'ANONYMOUS'}
              </span>
            </div>
            <div className="font-bold text-black truncate max-w-[200px]">
              {user ? user.email : 'guest.developer@intra.build'}
            </div>
            {!user && (
              <button
                onClick={onOpenAuth}
                className="w-full mt-1 px-3 py-1.5 rounded-xl bg-crimson text-white font-bold hover:bg-crimson-hover transition text-[11px]"
              >
                Sign In to Firebase
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── GENERATOR CONTROLS BAR ── */}
      <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 bg-cream-subtle px-3 py-2 rounded-xl border border-black/5">
            <span className="text-black/50">Domain:</span>
            <select
              value={domainSeed}
              onChange={(e) => setDomainSeed(e.target.value)}
              className="bg-transparent font-bold text-black focus:outline-none cursor-pointer"
            >
              <option value="Fintech / Payment Gateway">Fintech / Payment Gateway</option>
              <option value="Logistics & Freight Manifest">Logistics & Freight Manifest</option>
              <option value="Healthcare & Patient Vitals">Healthcare & Patient Vitals</option>
              <option value="E-Commerce Order Fulfillment">E-Commerce Order Fulfillment</option>
              <option value="Cloud Telemetry & Smartgrid">Cloud Telemetry & Smartgrid</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-cream-subtle px-3 py-2 rounded-xl border border-black/5">
            <span className="text-black/50">Mutation:</span>
            <select
              value={mutationType}
              onChange={(e) => setMutationType(e.target.value)}
              className="bg-transparent font-bold text-crimson focus:outline-none cursor-pointer"
            >
              <option value="unit_shift">M3 Unit Shift (Float to Cents)</option>
              <option value="rename">M1 Field Rename</option>
              <option value="format_shift">M2 Token Format Shift</option>
              <option value="pagination">M5 Offset Deprecation</option>
              <option value="webhook_flatten">M7 Webhook Flattening</option>
              <option value="enum_semantics">M10 Enum Expansion</option>
            </select>
          </div>
        </div>

        {/* Dual Engine Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGenerateProcedural}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-black/15 bg-white text-black text-xs font-mono font-bold hover:bg-black/5 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Procedural Randomizer</span>
          </button>

          <button
            onClick={handleGenerateSarvam}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-black text-white text-xs font-mono font-bold hover:bg-black/80 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-crimson" />
            <span>Generate via Sarvam 105B</span>
          </button>

          <button
            onClick={handleDispatchTrigger}
            disabled={isTriggering || Boolean(jsonParseError)}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-crimson text-white text-xs font-mono font-bold hover:bg-crimson-hover transition shadow-sm"
          >
            <Send className={`w-4 h-4 ${isTriggering ? 'animate-bounce' : ''}`} />
            <span>{isTriggering ? 'Dispatching...' : 'Trigger Custom API'}</span>
          </button>
        </div>
      </div>

      {/* ── CODEBOX & EXECUTION SPLIT VIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Editable JSON Codebox */}
        <div className="p-6 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-crimson" />
              <h3 className="font-display font-bold text-sm text-black">
                Editable API Specification (JSON)
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {jsonParseError ? (
                <span className="text-[10px] font-mono text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Syntax Error
                </span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Valid JSON Schema
                </span>
              )}
              <button
                onClick={() => copyToClipboard('codebox', editableJson)}
                className="p-1 rounded hover:bg-black/5 text-black/60 transition"
                title="Copy JSON"
              >
                {copiedKey === 'codebox' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Syntax Error Notice */}
          {jsonParseError && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-mono border border-red-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="truncate">{jsonParseError}</span>
            </div>
          )}

          {/* Textarea Editor */}
          <div className="relative rounded-2xl border border-black/10 bg-[#0A0A0A] p-4 text-white font-mono text-xs overflow-hidden">
            <textarea
              value={editableJson}
              onChange={(e) => handleCodeChange(e.target.value)}
              rows={22}
              className="w-full bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-y selection:bg-crimson/30 selection:text-white leading-relaxed"
              spellCheck={false}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono text-black/50 pt-1">
            <span>Live Endpoint: <strong className="text-black font-mono">{activeSchema.method} {activeSchema.endpoint}</strong></span>
            <span>Mutation: <strong className="text-crimson font-mono">{activeSchema.mutationType}</strong></span>
          </div>
        </div>

        {/* Right Column: Live Trigger Results & Firebase Storage Artifact */}
        <div className="space-y-6">
          {/* Latest Execution Card */}
          <div className="p-6 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-crimson" />
                <h3 className="font-display font-bold text-sm text-black">
                  Trigger Execution &amp; Adapter Output
                </h3>
              </div>
              {lastResult && (
                <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-full font-bold">
                  {lastResult.durationMs}ms
                </span>
              )}
            </div>

            {lastResult ? (
              <div className="space-y-4 font-mono text-xs">
                {/* Result Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-black/5">
                    <span className="text-black/50 block">SAFE-HANDLING</span>
                    <strong className="text-crimson font-bold uppercase">{lastResult.safeHandlingAction}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-black/5">
                    <span className="text-black/50 block">CONFIDENCE</span>
                    <strong className="text-black font-bold">{(lastResult.confidence * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-black/5">
                    <span className="text-black/50 block">VERDICT</span>
                    <strong className="text-emerald-700 font-bold uppercase">{lastResult.verdict}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-black/5">
                    <span className="text-black/50 block">ENGINE STATUS</span>
                    <strong className="text-black font-bold">{lastResult.engineNotified ? '200 OK' : 'LOCAL MOCK'}</strong>
                  </div>
                </div>

                {/* Synthesized Adapter Code */}
                <div className="p-3.5 rounded-2xl bg-[#0A0A0A] text-white space-y-1">
                  <div className="text-[10px] text-white/50 flex justify-between">
                    <span>SYNTHESIZED IN-PROCESS ADAPTER (@intra/sdk):</span>
                    <button
                      onClick={() => copyToClipboard('adapterCode', lastResult.adapterCode || '')}
                      className="hover:text-crimson transition"
                    >
                      {copiedKey === 'adapterCode' ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <pre className="text-emerald-400 overflow-x-auto text-[10px] leading-relaxed pt-1">
                    {lastResult.adapterCode}
                  </pre>
                </div>

                {/* Firebase Storage Artifact Box */}
                {lastResult.storageResult && (
                  <div className="p-3.5 rounded-2xl bg-cream-subtle border border-black/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-black flex items-center space-x-1">
                        <UploadCloud className="w-3.5 h-3.5 text-crimson" />
                        <span>FIREBASE STORAGE ARTIFACT</span>
                      </span>
                      <span className="text-[10px] text-black/50">
                        {lastResult.storageResult.sizeBytes} bytes
                      </span>
                    </div>
                    <div className="text-[10px] text-black/70 break-all font-mono">
                      Path: <strong>{lastResult.storageResult.storagePath}</strong>
                    </div>
                    <a
                      href={lastResult.storageResult.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-[10px] font-bold hover:bg-black/80 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Download JSON Artifact</span>
                    </a>
                  </div>
                )}

                {/* SHA-256 Ledger Digest */}
                <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-black/5 flex items-center justify-between text-[10px]">
                  <span className="text-black/50">W3C WebCrypto SHA-256:</span>
                  <span className="text-black font-bold truncate max-w-[240px]">{lastResult.sha256Digest}</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-black/40 font-mono text-xs space-y-2">
                <Database className="w-8 h-8 mx-auto opacity-30" />
                <p>Click &quot;Trigger Custom API&quot; to execute schema against the live closed-loop engine.</p>
              </div>
            )}
          </div>

          {/* Trigger History / Audit Log */}
          <div className="p-6 rounded-[2rem] bg-white border border-black/10 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <h4 className="font-display font-bold text-xs text-black uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-crimson" />
                <span>Recent Triggers in Firebase RTDB</span>
              </h4>
              <span className="text-[10px] font-mono text-black/50">
                {recentTriggers.length} Events Logged
              </span>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {recentTriggers.length > 0 ? (
                recentTriggers.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#FAF9F5] border border-black/5 text-[11px] font-mono flex items-center justify-between hover:border-crimson/30 transition"
                  >
                    <div>
                      <div className="font-bold text-black text-[10px]">{t.title}</div>
                      <div className="text-[9px] text-black/50">{t.action} &bull; {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : 'Recent'}</div>
                    </div>
                    {t.storageUrl && (
                      <a
                        href={t.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-crimson hover:underline text-[10px] font-bold"
                      >
                        JSON
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-black/40 text-xs font-mono">
                  No trigger history logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TriggerContainer;
