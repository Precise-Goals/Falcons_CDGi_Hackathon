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
        </div>
      </div>
    </div>
  );
}
export default DocsContainer;
