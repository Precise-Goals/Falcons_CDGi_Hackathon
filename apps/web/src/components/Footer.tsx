import { MainTab } from '../types';

export interface FooterProps {
  setActiveTab: (tab: MainTab) => void;
}

export function Footer({ setActiveTab }: FooterProps) {
  return (
    <footer className="border-t border-black/10 bg-cream/80 backdrop-blur-md pt-16 pb-8 px-6 mt-16 relative z-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* 4-Column Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          {/* Column 1: Brand & Core Mission */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="Intra"
                className="w-6 h-6 object-contain"
              />
              <span className="font-display font-black text-sm tracking-wider text-black">INTRA</span>
            </div>
            <p className="text-black/60 leading-relaxed">
              Autonomous runtime infrastructure empowering software to survive undocumented upstream API changes with zero production downtime.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className="verified-badge">v0.1.0 VERIFIED</span>
              <span className="text-black/40 font-mono text-[10px]">MIT LICENSE</span>
            </div>
          </div>

          {/* Column 2: The Core Product Suite */}
          <div className="space-y-2">
            <h4 className="font-display font-bold uppercase tracking-wider text-black text-[11px]">
              Core Product Suite
            </h4>
            <ul className="space-y-1.5 text-black/60 font-mono text-[11px]">
              <li>&bull; <button onClick={() => setActiveTab('home')} className="hover:text-crimson">Home (Mission Portal)</button></li>
              <li>&bull; <button onClick={() => setActiveTab('agent')} className="hover:text-crimson">Agent Workbench (Claude-Style)</button></li>
              <li>&bull; <button onClick={() => setActiveTab('mcp')} className="hover:text-crimson">Customer MCP Server</button></li>
              <li>&bull; <button onClick={() => setActiveTab('sdk')} className="hover:text-crimson">Client SDK (@intra/sdk)</button></li>
              <li>&bull; <button onClick={() => setActiveTab('docs')} className="hover:text-crimson">Docs (docs/lock.md Specification)</button></li>
              <li>&bull; <button onClick={() => setActiveTab('pricing')} className="hover:text-crimson">Pricing (NFT AI Tiers)</button></li>
              <li>&bull; <button onClick={() => setActiveTab('dashboard')} className="hover:text-crimson">Dashboard (Observability)</button></li>
            </ul>
          </div>

          {/* Column 3: Customer MCP Server */}
          <div className="space-y-2">
            <h4 className="font-display font-bold uppercase tracking-wider text-black text-[11px]">
              Customer MCP Server
            </h4>
            <ul className="space-y-1.5 text-black/60 font-mono text-[11px]">
              <li><code>intra_list_dependencies</code></li>
              <li><code>intra_get_contract</code></li>
              <li><code>intra_recent_changes</code></li>
              <li><code>intra_impact</code></li>
              <li><code>intra_propose_adapter</code></li>
              <li><code>intra_apply_adapter</code></li>
              <li><code>intra_health</code></li>
            </ul>
          </div>

          {/* Column 4: Safe Handling Policy */}
          <div className="space-y-2">
            <h4 className="font-display font-bold uppercase tracking-wider text-black text-[11px]">
              Safe-Handling Policy
            </h4>
            <div className="space-y-1.5 text-black/60">
              <div className="flex justify-between font-mono text-[11px]">
                <span>Confidence &ge; 90%:</span>
                <span className="font-bold text-black">Auto-Apply</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>70% &le; Conf &lt; 90%:</span>
                <span className="font-bold text-black">Migration PR</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>Confidence &lt; 70%:</span>
                <span className="font-bold text-crimson">Quarantine</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>Breaking Verdict:</span>
                <span className="font-bold text-crimson">Circuit Break</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-black/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-black/50">
          <div>
            ENGINE STATUS: <span className="text-crimson font-bold">ALL SYSTEMS OPERATIONAL</span>
          </div>
          <div>
            COLOR PALETTE: <span className="text-black font-semibold">CRIMSON RED</span> &bull; <span className="text-black font-semibold">CREAM</span> &bull; <span className="text-black font-semibold">BLACK</span>
          </div>
          <div>
            FONTS: <span className="text-black font-semibold">POPPINS</span> + <span className="text-black font-semibold">MONTSERRAT</span>
          </div>
        </div>

        {/* Giant Antigravity "Intra." Headline with Red Gradient Background Clipping */}
        <div className="relative overflow-hidden pt-6 pb-2 text-center select-none pointer-events-none">
          <span className="font-display font-black text-6xl sm:text-8xl md:text-[11rem] lg:text-[14rem] xl:text-[16rem] leading-none tracking-tighter antigravity-hero-text block">
            Intra.
          </span>
        </div>

        <div className="text-center font-mono text-[11px] text-black/40">
          &copy; {new Date().getFullYear()} Intra. Autonomous Upstream API Resilience Platform.
        </div>
      </div>
    </footer>
  );
}
export default Footer;
