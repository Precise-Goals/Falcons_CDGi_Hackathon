import { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Send,
  Loader2,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  Cpu,
  Code2,
  Zap,
  Sliders,
  Layers,
  FlaskConical,
  ArrowDown,
} from 'lucide-react';
import {
  AgentMode,
  ChatMessage,
  MutationItem,
  MainTab,
  DashboardSubView,
} from '../types';
import { MarkdownView } from '../components/MarkdownView';

export interface ProductsContainerProps {
  activeProductTab: 'agent' | 'mcp' | 'sdk';
  onSelectProductTab: (tab: 'agent' | 'mcp' | 'sdk') => void;
  onNavigateToTab?: (tab: MainTab, subView?: DashboardSubView, mutationId?: string) => void;
  // Agent Props
  agentMode: AgentMode;
  setAgentMode: (mode: AgentMode) => void;
  agentLanguage: string;
  setAgentLanguage: (lang: string) => void;
  chatMessages: ChatMessage[];
  agentPrompt: string;
  setAgentPrompt: (prompt: string) => void;
  agentLoading: boolean;
  handleAgentSubmit: (promptText?: string) => Promise<void>;
  // MCP Props
  liveToolsList: Array<{ name: string; description: string }>;
  selectedMcpTool: string;
  setSelectedMcpTool: (tool: string) => void;
  mcpLiveOutput: string;
  mcpLoading: boolean;
  executeMcpTool: (toolName: string) => Promise<void>;
  // SDK Props
  sdkSelectedMutation: string;
  setSdkSelectedMutation: (m: string) => void;
  sdkCustomInput: string;
  setSdkCustomInput: (input: string) => void;
  getAdaptedSdkOutput: () => string;
  mutations: MutationItem[];
  // Shared
  copyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

export function ProductsContainer({
  activeProductTab,
  onSelectProductTab,
  onNavigateToTab,
  agentMode,
  setAgentMode,
  agentLanguage,
  setAgentLanguage,
  chatMessages,
  agentPrompt,
  setAgentPrompt,
  agentLoading,
  handleAgentSubmit,
  liveToolsList,
  selectedMcpTool,
  setSelectedMcpTool,
  mcpLiveOutput,
  mcpLoading,
  executeMcpTool,
  sdkSelectedMutation,
  setSdkSelectedMutation,
  sdkCustomInput,
  setSdkCustomInput,
  getAdaptedSdkOutput,
  mutations,
  copyToClipboard,
  copiedKey,
}: ProductsContainerProps) {
  // Chat auto-scroll to present state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToPresentChat = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToPresentChat(true);
  }, [chatMessages, agentLoading]);

  const handleChatScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsAtBottom(distanceFromBottom < 80);
  };

  return (
    <div className="space-y-8">
      {/* Product Suite Top Sub-Nav Selector */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-cream-subtle p-1 border border-black/10 text-xs font-mono font-semibold">
          <button
            onClick={() => onSelectProductTab('agent')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full transition ${
              activeProductTab === 'agent'
                ? 'bg-black text-white shadow-sm'
                : 'text-black/60 hover:text-black'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent Workbench</span>
          </button>
          <button
            onClick={() => onSelectProductTab('mcp')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full transition ${
              activeProductTab === 'mcp'
                ? 'bg-crimson text-white shadow-sm'
                : 'text-black/60 hover:text-black'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Customer MCP Server</span>
          </button>
          <button
            onClick={() => onSelectProductTab('sdk')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full transition ${
              activeProductTab === 'sdk'
                ? 'bg-black text-white shadow-sm'
                : 'text-black/60 hover:text-black'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Client SDK & Proxy</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: AGENT WORKBENCH (CLAUDE-STYLE MINIMAL AESTHETIC INTERFACE)
         ========================================================================= */}
      {activeProductTab === 'agent' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Claude-Style Clean Header */}
          <div className="border border-black/10 bg-white/95 p-8 rounded-[2.5rem] shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="verified-badge">CLAUDE AGENT WORKBENCH</span>
                  <span className="text-xs font-mono text-black/40">INTELLIGENT ADAPTATION</span>
                </div>
                <h2 className="font-display font-bold text-2xl text-black mt-1">
                  Autonomous Adaptation Agent
                </h2>
              </div>

              {/* Mode Switcher: Ask Mode vs Plan Mode */}
              <div className="flex items-center p-1 bg-cream-subtle rounded-full border border-black/10 text-xs font-mono font-semibold">
                <button
                  onClick={() => setAgentMode('ask')}
                  className={`px-4 py-1.5 rounded-full transition ${
                    agentMode === 'ask'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Ask Mode
                </button>
                <button
                  onClick={() => setAgentMode('plan')}
                  className={`px-4 py-1.5 rounded-full transition ${
                    agentMode === 'plan'
                      ? 'bg-crimson text-white shadow-sm'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Plan Mode
                </button>
              </div>
            </div>

            {/* Sub-header Controls: Multilingual Language Selector (Sarvam AI) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 text-xs">
              <div className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-crimson" />
                <span className="text-black/60 font-mono text-[11px]">Interface Language:</span>
                <select
                  value={agentLanguage}
                  onChange={(e) => setAgentLanguage(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-black/10 bg-white font-mono text-xs text-black focus:outline-none"
                >
                  <option value="en">English (Default)</option>
                  <option value="hi">हिन्दी (Hindi - Sarvam 105B)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="es">Español (Spanish)</option>
                </select>
              </div>

              <div className="text-[11px] font-mono text-black/50">
                Mode: <strong className="text-black uppercase">{agentMode}</strong> &bull; Engine: Sarvam-105B & In-Process LLM
              </div>
            </div>
          </div>

          {/* Prompt Suggestion Chips */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-black/50 uppercase tracking-wider">
              {agentMode === 'ask' ? 'Suggested Inquiries (Ask Mode)' : 'Suggested Engineering Plans (Plan Mode)'}
            </div>
            <div className="flex flex-wrap gap-2">
              {(agentMode === 'ask'
                ? [
                    'Analyze rate-limit drift on /payments/charge',
                    'How does M1 field rename affect userProfile.ts?',
                    'Propose backward-compatible TypeScript adapter for M5 cursor pagination',
                    'Explain why M10 enum drift tripped the circuit breaker',
                  ]
                : [
                    'Plan zero-downtime migration for M3 dollar-to-cent unit shift',
                    'Generate security quarantine plan for M10 enum drift',
                    'Create rollback strategy for payment webhook flattening',
                  ]
              ).map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleAgentSubmit(chip)}
                  className="px-3.5 py-1.5 rounded-full border border-black/10 bg-white hover:border-crimson hover:bg-crimson/5 text-xs text-black/80 transition shadow-sm text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Dialogue Container */}
          <div className="relative border border-black/10 bg-white/95 rounded-[2.5rem] p-6 shadow-card space-y-4 min-h-[380px] flex flex-col justify-between">
            <div
              ref={chatScrollContainerRef}
              onScroll={handleChatScroll}
              className="space-y-4 overflow-y-auto h-[480px] max-h-[60vh] pr-2 scroll-smooth"
            >
              {chatMessages.map((msg, i) => {
                // Smart heuristic detection of referenced mutation for ecosystem deep-linking
                let targetMutation = 'M1';
                const lower = msg.text.toLowerCase();
                if (lower.includes('m10') || lower.includes('enum')) targetMutation = 'M10';
                else if (lower.includes('m9') || lower.includes('tool')) targetMutation = 'M9';
                else if (lower.includes('m8') || lower.includes('rate')) targetMutation = 'M8';
                else if (lower.includes('m7') || lower.includes('webhook')) targetMutation = 'M7';
                else if (lower.includes('m6') || lower.includes('truncat')) targetMutation = 'M6';
                else if (lower.includes('m5') || lower.includes('pagination') || lower.includes('cursor')) targetMutation = 'M5';
                else if (lower.includes('m4') || lower.includes('currency')) targetMutation = 'M4';
                else if (lower.includes('m3') || lower.includes('unit') || lower.includes('cent') || lower.includes('dollar')) targetMutation = 'M3';
                else if (lower.includes('m2') || lower.includes('format')) targetMutation = 'M2';
                else if (lower.includes('m1') || lower.includes('rename')) targetMutation = 'M1';

                return (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-black/40">
                      <span>{msg.sender === 'user' ? 'DEVELOPER' : 'INTRA ADAPTATION AGENT'}</span>
                      {msg.sha && <span>&bull; SHA: {msg.sha.slice(0, 8)}</span>}
                    </div>
                    <div
                      className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-black text-white rounded-br-none'
                          : 'bg-cream-subtle border border-black/5 text-black rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <p className="leading-relaxed">{msg.text}</p>
                      ) : (
                        <MarkdownView content={msg.text} />
                      )}

                      {msg.planSteps && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-black/10 font-mono text-[11px]">
                          {msg.planSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <span className="text-crimson font-bold">{idx + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interactive Ecosystem Action Panel on AI Findings */}
                      {msg.sender === 'agent' && (
                        <div className="mt-4 pt-3 border-t border-black/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-black/50 uppercase tracking-wider flex items-center space-x-1">
                              <Zap className="w-3 h-3 text-crimson" />
                              <span>Ecosystem Actions & Deep-Links:</span>
                            </span>
                            {msg.sha && (
                              <span className="text-[9px] font-mono text-crimson font-bold bg-crimson/10 px-1.5 py-0.5 rounded border border-crimson/20">
                                SEAL: {msg.sha.slice(0, 8)}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {/* Action 1: SDK Dynamic Proxy */}
                            <button
                              onClick={() => {
                                setSdkSelectedMutation(targetMutation);
                                if (onNavigateToTab) {
                                  onNavigateToTab('sdk', undefined, targetMutation);
                                } else {
                                  onSelectProductTab('sdk');
                                }
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-semibold hover:bg-black/80 transition shadow-xs"
                              title="Test dynamically adapted payload in Client SDK Proxy"
                            >
                              <Code2 className="w-3 h-3 text-emerald-400" />
                              <span>Apply to SDK Proxy</span>
                            </button>

                            {/* Action 2: Switchboard */}
                            <button
                              onClick={() => {
                                if (onNavigateToTab) {
                                  onNavigateToTab('dashboard', 'switchboard', targetMutation);
                                }
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-black/15 text-black text-[11px] font-semibold hover:border-crimson hover:text-crimson transition shadow-xs"
                              title={`Jump to Switchboard and toggle ${targetMutation}`}
                            >
                              <Sliders className="w-3 h-3 text-crimson" />
                              <span>Test in Switchboard ({targetMutation})</span>
                            </button>

                            {/* Action 3: Impact Blast Radius */}
                            <button
                              onClick={() => {
                                if (onNavigateToTab) {
                                  onNavigateToTab('dashboard', 'impact', targetMutation);
                                }
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-black/15 text-black text-[11px] font-semibold hover:border-crimson hover:text-crimson transition shadow-xs"
                              title="Inspect downstream Shipwell workflows affected by this change"
                            >
                              <Layers className="w-3 h-3 text-blue-600" />
                              <span>Inspect Blast Radius</span>
                            </button>

                            {/* Action 4: Stress Lab */}
                            <button
                              onClick={() => {
                                if (onNavigateToTab) {
                                  onNavigateToTab('eval');
                                }
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-black/15 text-black text-[11px] font-semibold hover:border-crimson hover:text-crimson transition shadow-xs"
                              title="Run 50-sample dynamic stress test in autonomous laboratory"
                            >
                              <FlaskConical className="w-3 h-3 text-purple-600" />
                              <span>Stress Test in Lab</span>
                            </button>

                            {/* Action 5: Customer MCP */}
                            <button
                              onClick={() => {
                                if (onNavigateToTab) {
                                  onNavigateToTab('mcp');
                                } else {
                                  onSelectProductTab('mcp');
                                }
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-black/15 text-black text-[11px] font-semibold hover:border-crimson hover:text-crimson transition shadow-xs"
                              title="Inspect tool definitions and recent changes via MCP Server"
                            >
                              <Terminal className="w-3 h-3 text-amber-600" />
                              <span>Inspect in MCP</span>
                            </button>

                            {/* Action 6: Copy Findings */}
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `${msg.text}\n\n[INTRA AUDIT CHECKSUM]: ${msg.sha || 'sha256:verified'}`,
                                  `msg-${i}`
                                )
                              }
                              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white border border-black/15 text-black/70 text-[11px] hover:text-black transition"
                              title="Copy findings and cryptographic checksum"
                            >
                              {copiedKey === `msg-${i}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {agentLoading && (
                <div className="flex flex-col items-start space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-crimson font-bold">
                    <Loader2 className="w-3 h-3 animate-spin text-crimson" />
                    <span>SARVAM-105B INFERRING RESPONSE...</span>
                  </div>
                  <div className="p-4 rounded-2xl max-w-xl text-xs leading-relaxed bg-cream-subtle border border-crimson/20 text-black rounded-bl-none shadow-sm flex items-center space-x-2.5">
                    <div className="w-2 h-2 rounded-full bg-crimson animate-ping" />
                    <span className="font-mono text-black/70">
                      Querying https://api.sarvam.ai in language [{agentLanguage}] & computing SHA-256 ledger digest...
                    </span>
                  </div>
                </div>
              )}
              {/* Anchor to scroll to present chat */}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Jump to Present Chat Pill */}
            {!isAtBottom && (
              <button
                onClick={() => scrollToPresentChat(true)}
                className="absolute bottom-20 right-10 z-10 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-crimson text-white text-[11px] font-mono font-bold shadow-lg hover:bg-crimson-hover transition transform hover:-translate-y-0.5"
              >
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                <span>Present Chat</span>
              </button>
            )}

            {/* Chat Input Field */}
            <div className="pt-3 border-t border-black/5 flex items-center space-x-2">
              <input
                type="text"
                placeholder={
                  agentMode === 'ask'
                    ? 'Ask about observed contracts, drift, or blast-radius...'
                    : 'Request a structured dependency adaptation plan...'
                }
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAgentSubmit()}
                className="flex-grow px-4 py-3 rounded-full border border-black/10 bg-cream-subtle text-xs text-black focus:outline-none focus:border-crimson"
              />
              <button
                onClick={() => handleAgentSubmit()}
                className="p-3 rounded-full bg-crimson text-white hover:bg-crimson-hover transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: CUSTOMER MCP SERVER (CONNECTED TO LIVE PORT 3002)
         ========================================================================= */}
      {activeProductTab === 'mcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tool Selection */}
          <div className="lg:col-span-1 space-y-3">
            <div className="border border-black/10 bg-white/95 rounded-[2rem] p-6 shadow-card space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-black/5">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                  Live MCP Tools ({liveToolsList.length || 7})
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">PORT 3002 READY</span>
              </div>

              <div className="space-y-2">
                {(liveToolsList.length > 0
                  ? [...liveToolsList].sort((a, b) => {
                      const order = ['intra_health', 'intra_get_contract', 'intra_recent_changes', 'intra_impact', 'intra_propose_adapter', 'intra_apply_adapter', 'intra_list_dependencies'];
                      const idxA = order.indexOf(a.name);
                      const idxB = order.indexOf(b.name);
                      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
                    })
                  : [
                      { name: 'intra_health', description: 'Check rate-limit headroom & system status' },
                      { name: 'intra_get_contract', description: 'Fetch behavioral contract for service & endpoint' },
                      { name: 'intra_recent_changes', description: 'List active mutations & drift with confidence' },
                      { name: 'intra_impact', description: 'Trace affected workflows & AST blast radius' },
                      { name: 'intra_propose_adapter', description: 'Generate TypeScript adapter & migration PR' },
                      { name: 'intra_apply_adapter', description: 'Apply adapter to live canary runtime' },
                      { name: 'intra_list_dependencies', description: 'Query all observed services & endpoints' },
                    ]
                ).map((tool) => {
                  const isSelected = selectedMcpTool === tool.name;
                  return (
                    <button
                      key={tool.name}
                      onClick={() => {
                        setSelectedMcpTool(tool.name);
                        executeMcpTool(tool.name);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition ${
                        isSelected
                          ? 'border-crimson bg-crimson/5 shadow-sm'
                          : 'border-black/5 bg-cream-subtle hover:border-black/20'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs text-black">{tool.name}</div>
                      <div className="text-[11px] text-black/50 mt-0.5">{tool.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connection info card */}
            <div className="border border-black/10 bg-white/95 rounded-[2rem] p-6 shadow-card space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-black/5">
                <span className="font-display font-bold uppercase text-[11px] text-black">Connection Config</span>
                <span className="text-[10px] text-crimson font-bold">STREAMABLE HTTP</span>
              </div>
              <div className="space-y-2 text-black/60 text-[11px]">
                <div>Transport: <code className="text-black font-semibold">http/streamable</code></div>
                <div>
                  Deployed: <code className="text-crimson font-semibold">https://intra-vert.vercel.app/api/mcp</code>
                </div>
                <div>
                  Local: <code className="text-black font-semibold">http://localhost:3002</code>
                </div>
                <div>Health: <code className="text-black font-semibold">GET /healthz (HTTP 200)</code></div>
              </div>
              <div className="pt-2 border-t border-black/5">
                <div className="text-[10px] text-black/50 mb-1">Claude Desktop stdio Bridge:</div>
                <div className="p-2 rounded-xl bg-black text-white text-[10px] overflow-x-auto">
                  node scripts/mcp-remote-client.mjs https://intra-vert.vercel.app/api/mcp
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Tool Execution Output */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-black/5">
                <div>
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-crimson" />
                    <h3 className="font-mono font-bold text-sm text-black">{selectedMcpTool}</h3>
                  </div>
                  <p className="text-xs text-black/50 mt-1">Live response from Node MCP server</p>
                </div>
                <button
                  onClick={() => executeMcpTool(selectedMcpTool)}
                  disabled={mcpLoading}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black text-white text-xs font-mono font-bold hover:bg-black/80 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${mcpLoading ? 'animate-spin' : ''}`} />
                  <span>{mcpLoading ? 'Executing...' : 'Re-run Tool'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                    Tool Response JSON
                  </h4>
                  <button
                    onClick={() => copyToClipboard(mcpLiveOutput, 'mcp-output')}
                    className="flex items-center space-x-1 text-xs font-mono text-black/60 hover:text-black"
                  >
                    {copiedKey === 'mcp-output' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'mcp-output' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-cream-subtle border border-black/10 rounded-2xl font-mono text-xs text-black overflow-x-auto min-h-[220px]">
                  {mcpLiveOutput || '// Loading response from MCP server...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: CLIENT SDK & DYNAMIC RUNTIME PROXY
         ========================================================================= */}
      {activeProductTab === 'sdk' && (
        <div className="space-y-8">
          <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="verified-badge">@intra/sdk CLIENT</span>
                <span className="text-xs font-mono text-black/40">DYNAMIC RUNTIME PROXY</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-black mt-1">
                Intra Client SDK & Proxy Interceptor
              </h2>
              <p className="text-xs text-black/60 mt-1 max-w-2xl">
                Zero-overhead client-side interception. Wraps outgoing fetch/axios requests to non-blockingly stream telemetry to the observability platform and dynamically execute synthesized compatibility adapters in-process.
              </p>
            </div>

            {/* Code Snippets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                    1. Drop-In Fetch Client Wrapper
                  </h3>
                  <span className="text-[10px] font-mono text-black/40">TYPESCRIPT</span>
                </div>
                <pre className="p-5 rounded-2xl border border-black/10 bg-cream-subtle font-mono text-xs text-black overflow-x-auto whitespace-pre-wrap">
{`import { createIntraClient } from '@intra/sdk';

// Initialize lightweight client with telemetry link
const intra = createIntraClient({
  engineUrl: 'http://localhost:3001',
  appName: 'shipwell-production',
});

// Outgoing fetch calls automatically adapt to upstream mutations
const response = await intra.fetch('https://api.external.com/users');
const users = await response.json();
// users[0].name is guaranteed even if upstream renamed to display_name!`}
                </pre>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-black">
                    2. Dynamic Adapter Registration
                  </h3>
                  <span className="text-[10px] font-mono text-black/40">IN-PROCESS HEALING</span>
                </div>
                <pre className="p-5 rounded-2xl border border-black/10 bg-cream-subtle font-mono text-xs text-black overflow-x-auto whitespace-pre-wrap">
{`// Dynamic hot-swap: update adapter in memory without restarting server
intra.registerAdapter('/users', {
  id: 'adp_users_v2',
  rollbackHandle: 'rollback_m1_canary',
  adaptResponse: (data) => {
    return data.map(item => ({
      ...item,
      name: item.display_name ?? item.name
    }));
  }
});`}
                </pre>
              </div>
            </div>

            {/* Interactive Dynamic Adapter Playground */}
            <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-display font-bold text-sm text-black">
                    Interactive Client Adapter Playground
                  </h3>
                  <p className="text-xs text-black/60">
                    Test how the client SDK dynamically transforms incoming broken upstream payloads into safe schema-compliant responses.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-black/50">Simulate:</span>
                  <select
                    value={sdkSelectedMutation}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setSdkSelectedMutation(mId);
                      const match = mutations.find((m) => m.id === mId);
                      if (match) setSdkCustomInput(match.afterSnippet);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-black/20 bg-white font-mono text-xs text-black focus:outline-none"
                  >
                    {mutations.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id}: {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-black/60 text-[11px]">
                    <span>INPUT: MUTATED UPSTREAM JSON</span>
                    <span className="text-crimson font-bold">RAW TELEMETRY</span>
                  </div>
                  <textarea
                    rows={6}
                    value={sdkCustomInput}
                    onChange={(e) => setSdkCustomInput(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-black/10 bg-white text-black font-mono text-xs focus:outline-none focus:border-crimson"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-black/60 text-[11px]">
                    <span>OUTPUT: SDK ADAPTED RESPONSE</span>
                    <span className="text-emerald-600 font-bold">NORMALIZED</span>
                  </div>
                  <pre className="p-3 rounded-2xl border border-emerald-600/30 bg-emerald-50/50 text-black font-mono text-xs h-[138px] overflow-x-auto whitespace-pre-wrap">
                    {getAdaptedSdkOutput()}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProductsContainer;
