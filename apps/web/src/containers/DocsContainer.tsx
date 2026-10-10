export function DocsContainer() {
  return (
    <div className="space-y-8">
      <div className="border border-black/10 bg-white/95 rounded-[2.5rem] p-8 shadow-card space-y-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="verified-badge">SPECIFICATION GUIDE</span>
            <span className="text-xs font-mono text-black/50">docs/lock.md ALIGNMENT</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-black mt-1">
            The Internet After the API: Help Software Survive Undocumented Changes
          </h2>
          <p className="text-xs text-black/60 mt-1 max-w-2xl">
            Complete technical specification and architectural solution addressing the core challenge in{' '}
            <code className="text-black font-semibold">docs/lock.md</code>.
          </p>
        </div>

        {/* Document Sections */}
        <div className="space-y-6 text-xs text-black/75 leading-relaxed">
          {/* 1. Problem & Challenge */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-3">
            <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
              1. The Core Problem Statement (docs/lock.md)
            </h3>
            <p>
              Modern software relies on APIs, SDKs, MCP servers, webhooks, and third-party services. If a dependency changes behaviour, disappears, becomes rate-limited, or returns subtly different data, applications can silently fail.
            </p>
            <p>
              <strong className="text-black">The Challenge:</strong> Build a system that observes external dependencies, learns their real behaviour, detects meaningful changes, assesses which parts of an application are affected, and automatically adapts—or proposes a safe migration.
            </p>
            <div className="p-3.5 rounded-2xl bg-white border border-black/10 font-mono text-[11px] text-black/70">
              <strong>Core Pipeline:</strong> External service &rarr; Observed behaviour &rarr; Contract / behavioural model &rarr; Change detection &rarr; Impact analysis &rarr; Adapter or migration &rarr; Validation &rarr; Updated system.
            </div>
          </div>

          {/* 2. Semantic Drift Handling */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-3">
            <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
              2. Beyond Documented Schemas (Behavioral Drift)
            </h3>
            <p>
              Do not rely only on documented schemas. Intra detects behavioural changes too: altered defaults, different error responses, changed pagination, rate limits, or data that remains valid JSON but changes meaning.
            </p>
            <p>
              <strong className="text-black">Example Semantic Change:</strong> An endpoint previously returns <code className="font-mono text-black">GET /users &rarr; name</code> but now returns <code className="font-mono text-black">GET /users &rarr; display_name</code>. Intra identifies which workflows depend on name and determines whether mapping the new field preserves the original meaning.
            </p>
          </div>

          {/* 3. Safe-Handling Policy Matrix */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4">
            <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
              3. Safe-Handling Policy Matrix (Section 10)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border border-black/10 rounded-2xl">
                <thead className="bg-black/5 text-black">
                  <tr>
                    <th className="p-3">Confidence Score</th>
                    <th className="p-3">Semantic Verdict</th>
                    <th className="p-3">Safe-Handling Action</th>
                    <th className="p-3">Production Behavior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  <tr>
                    <td className="p-3 font-bold text-black">&ge; 0.90</td>
                    <td className="p-3 text-black">Equivalent</td>
                    <td className="p-3 font-bold text-emerald-600">Auto-Apply</td>
                    <td className="p-3">Canary adapter injected with rollback handle</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-black">0.70 &le; c &lt; 0.90</td>
                    <td className="p-3 text-black">Equivalent</td>
                    <td className="p-3 font-bold text-black">Migration PR</td>
                    <td className="p-3">Automated PR opened with adapter diff and test suite</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-black">Any score</td>
                    <td className="p-3 text-crimson">Lossy</td>
                    <td className="p-3 font-bold text-black">Migration PR</td>
                    <td className="p-3">Requires human engineering review before deployment</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-crimson">&lt; 0.70</td>
                    <td className="p-3 text-black">Any</td>
                    <td className="p-3 font-bold text-crimson">Quarantine Alert</td>
                    <td className="p-3">No automated changes permitted; alert fired</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-crimson">Any score</td>
                    <td className="p-3 font-bold text-crimson">Breaking</td>
                    <td className="p-3 font-bold text-crimson">Circuit Breaker</td>
                    <td className="p-3">Trips circuit breaker to isolate downstream crash</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. The 10 Mutation Catalogue */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-3">
            <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
              4. The 10 Mutation Catalogue (M1 through M10)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M1:</span> Field Rename (name &rarr; display_name)
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M2:</span> Name Format Shift (Last, First tokenization)
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M3:</span> Unit Shift (dollars float &rarr; cents integer)
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M4:</span> Default Currency Flip (USD &rarr; EUR fallback)
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M5:</span> Pagination (offset deprecated &rarr; opaque cursor)
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M6:</span> Silent Truncation (caps limit 100 &rarr; 20)
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M7:</span> Webhook Flattening (event.type &rarr; type)
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M8:</span> Rate Limit Throttle (HTTP 429 Retry-After)
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M9:</span> MCP Tool Signature Drift (query &rarr; q, limit)
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <span className="font-bold text-crimson">M10:</span> Enum Semantics (status: active includes suspended)
              </div>
            </div>
          </div>
          {/* 5. Customer MCP Server Reference (§11) */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                5. Customer MCP Server Reference (Section 11)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-crimson/10 text-crimson text-[10px] font-mono font-bold">
                STREAMABLE HTTP
              </span>
            </div>
            <p>
              Intra exposes a dedicated Model Context Protocol (MCP) server compliant with the standard specification. External AI agents (Claude Desktop, Cursor, AutoGPT) can query live dependencies, examine learned schemas, trace blast-radii, and apply validated adapters.
            </p>
            <div className="p-4 rounded-2xl bg-black text-white font-mono text-[11px] space-y-2">
              <div className="text-crimson font-bold"># Live Deployed Vercel MCP Endpoint</div>
              <div className="text-emerald-400">https://intra-vert.vercel.app/api/mcp</div>
              <div className="text-white/60 pt-1 border-t border-white/10">
                Claude Desktop Bridge: <code className="text-white">node scripts/mcp-remote-client.mjs https://intra-vert.vercel.app/api/mcp</code>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-white border border-black/10">
                <code className="text-crimson font-bold">intra_list_dependencies</code>
                <p className="text-black/60 text-[10px] mt-0.5">Lists all monitored services, endpoints, and health status.</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/10">
                <code className="text-crimson font-bold">intra_get_contract</code>
                <p className="text-black/60 text-[10px] mt-0.5">Fetches learned JSON schema, optionality, and error taxonomy.</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/10">
                <code className="text-crimson font-bold">intra_recent_changes</code>
                <p className="text-black/60 text-[10px] mt-0.5">Returns detected drift items filtered by minimum confidence.</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/10">
                <code className="text-crimson font-bold">intra_impact</code>
                <p className="text-black/60 text-[10px] mt-0.5">Traces affected application workflows and AST blast radius.</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/10">
                <code className="text-crimson font-bold">intra_propose_adapter</code>
                <p className="text-black/60 text-[10px] mt-0.5">Synthesizes backward-compatible TypeScript adapter and proposal.</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/10">
                <code className="text-crimson font-bold">intra_apply_adapter</code>
                <p className="text-black/60 text-[10px] mt-0.5">Applies approved canary adapter with rollback handle protection.</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/10">
                <code className="text-crimson font-bold">intra_health</code>
                <p className="text-black/60 text-[10px] mt-0.5">Returns engine connectivity, uptime, and rate limit headroom.</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/10">
                <code className="text-crimson font-bold">intra_verify_proof</code>
                <p className="text-black/60 text-[10px] mt-0.5">Verifies SHA-256 ledger checksum and on-chain NFT ownership.</p>
              </div>
            </div>
          </div>

          {/* 6. Client SDK & Dynamic Proxy (@intra/sdk) */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4">
            <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
              6. Client SDK & Dynamic Proxy (@intra/sdk)
            </h3>
            <p>
              The <code className="font-mono text-black">@intra/sdk</code> package provides drop-in HTTP/fetch interception with zero performance penalty (&lt;5ms p95). Outgoing requests stream telemetry asynchronously to the engine while in-process adapters normalize drift before payload reaches business logic.
            </p>
            <div className="p-4 rounded-2xl bg-white border border-black/10 font-mono text-[11px] space-y-2 overflow-x-auto">
              <div className="text-black/40">// 1. Drop-In Initialization</div>
              <div className="text-black">
                <span className="text-crimson">import</span> &#123; IntraClient &#125; <span className="text-crimson">from</span> <span className="text-emerald-700">'@intra/sdk'</span>;
              </div>
              <div className="text-black">
                <span className="text-crimson">const</span> intra = <span className="text-crimson">new</span> IntraClient(&#123;
              </div>
              <div className="text-black pl-4">
                engineUrl: <span className="text-emerald-700">'https://intra-vert.vercel.app/api/engine'</span>,
              </div>
              <div className="text-black pl-4">
                appName: <span className="text-emerald-700">'shipwell-production'</span>,
              </div>
              <div className="text-black pl-4">
                failOpen: <span className="text-crimson">true</span>, <span className="text-black/40">// Never block traffic if engine is unreachable</span>
              </div>
              <div className="text-black">&#125;);</div>
              <div className="text-black/40 pt-2">// 2. Dynamic Adaptive Request</div>
              <div className="text-black">
                <span className="text-crimson">const</span> users = <span className="text-crimson">await</span> intra.fetch(<span className="text-emerald-700">'https://api.vendor.com/users'</span>);
              </div>
            </div>
          </div>

          {/* 7. MST Blockchain & Cryptographic Ledger Audit */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                7. MST Blockchain & Cryptographic Ledger Audit
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                TESTNET CHAIN 91562037
              </span>
            </div>
            <p>
              To eliminate false claims and provide non-repudiable audit trails, every critical event—wallet link, plan purchase, drift detection, and adapter approval—computes an authentic W3C WebCrypto SHA-256 seal logged directly to the browser console ledger.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-white border border-black/10 space-y-1">
                <div className="text-[10px] text-black/40 uppercase">Free Starter Tier</div>
                <div className="text-base font-bold text-black">2 MSTC</div>
                <div className="text-crimson font-bold">15 NFTs Rate Limit</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/10 space-y-1">
                <div className="text-[10px] text-black/40 uppercase">Starter Pro Tier</div>
                <div className="text-base font-bold text-black">3 MSTC</div>
                <div className="text-crimson font-bold">30 NFTs Rate Limit</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/10 space-y-1">
                <div className="text-[10px] text-black/40 uppercase">Business Enterprise</div>
                <div className="text-base font-bold text-black">5 MSTC</div>
                <div className="text-crimson font-bold">45 NFTs Rate Limit</div>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-black/10 font-mono text-[11px] space-y-1">
              <div><strong>Live Soulbound Contract:</strong> <code className="text-crimson">0x19e2613e9eD73d970Af06Bca28E799E5de3Fa89B</code></div>
              <div><strong>MST Scan Explorer:</strong> <a href="https://testnet.mstscan.com/address/0x19e2613e9eD73d970Af06Bca28E799E5de3Fa89B" target="_blank" rel="noreferrer" className="text-black underline">View Contract on MST Scan &rarr;</a></div>
            </div>
          </div>

          {/* 8. Engine REST API Endpoints */}
          <div className="p-6 rounded-[2rem] border border-black/10 bg-cream-subtle/50 space-y-3 font-mono text-[11px]">
            <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider font-sans">
              8. Engine REST API Endpoints
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-black/10 rounded-2xl">
                <thead className="bg-black/5 text-black">
                  <tr>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Endpoint</th>
                    <th className="p-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-700">POST</td>
                    <td className="p-2.5">/observe</td>
                    <td className="p-2.5">Records raw non-blocking HTTP telemetry observation.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-700">GET</td>
                    <td className="p-2.5">/contracts/:svc/:endpoint</td>
                    <td className="p-2.5">Returns inferred behavioral schema and invariants.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-700">GET</td>
                    <td className="p-2.5">/services</td>
                    <td className="p-2.5">Lists all distinct observed services and endpoints.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-700">GET</td>
                    <td className="p-2.5">/changes</td>
                    <td className="p-2.5">Returns all detected structural and semantic drift items.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-700">GET</td>
                    <td className="p-2.5">/impact/:changeId</td>
                    <td className="p-2.5">Calculates AST blast-radius and affected workflows.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-700">POST</td>
                    <td className="p-2.5">/apply/:proposalId</td>
                    <td className="p-2.5">Approves proposal with explicit confirmation flag.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-700">GET</td>
                    <td className="p-2.5">/events</td>
                    <td className="p-2.5">Real-time Server-Sent Events (SSE) telemetry stream.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-700">GET</td>
                    <td className="p-2.5">/health</td>
                    <td className="p-2.5">Uptime, dependency connectivity, and rate-limit headroom.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DocsContainer;
