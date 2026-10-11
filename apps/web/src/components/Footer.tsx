import { MainTab } from '../types';

export interface FooterProps {
  setActiveTab: (tab: MainTab) => void;
}

export function Footer({ setActiveTab }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A] text-white pt-16 pb-10 px-6 mt-20 relative z-10 overflow-hidden">
      {/* Background Subtle Technical Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Ambient Crimson Edge Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-crimson to-transparent opacity-80" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* 4-Column Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          {/* Column 1: Brand & Core Mission */}
          <div className="space-y-3.5">
            <div className="flex items-center space-x-2.5">
              <img
                src="/logo.png"
                alt="Intra"
                className="w-7 h-7 object-contain brightness-110 drop-shadow-[0_0_8px_rgba(200,16,46,0.5)]"
              />
              <span className="font-display font-black text-base tracking-widest text-white">INTRA</span>
            </div>
            <p className="text-white/60 leading-relaxed font-sans text-xs">
              Autonomous runtime infrastructure empowering software to survive undocumented upstream API changes with zero production downtime.
            </p>
            <div className="flex items-center space-x-2 pt-1 text-[11px] font-mono">
              <span className="text-crimson font-bold">v0.1.0 VERIFIED</span>
              <span className="text-white/30">|</span>
              <span className="text-white/60">MIT LICENSE</span>
            </div>
          </div>

          {/* Column 2: The Core Product Suite */}
          <div className="space-y-2.5">
            <h4 className="font-display font-bold uppercase tracking-wider text-white/90 text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
              Core Product Suite
            </h4>
            <ul className="space-y-1.5 text-white/60 font-mono text-[11px]">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-white transition-colors duration-150">
                  &bull; Home (Mission Portal)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('dashboard')} className="hover:text-white transition-colors duration-150">
                  &bull; Dashboard (NetworkX Topology &amp; APM)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('agent')} className="hover:text-white transition-colors duration-150">
                  &bull; Agent Workbench (Claude-Style)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('mcp')} className="hover:text-white transition-colors duration-150">
                  &bull; Customer MCP Server (Port 3002)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('sdk')} className="hover:text-white transition-colors duration-150">
                  &bull; Client SDK (@intra/sdk)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('docs')} className="hover:text-white transition-colors duration-150">
                  &bull; Docs (docs/lock.md Specification)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('pricing')} className="hover:text-white transition-colors duration-150">
                  &bull; Pricing (NFT AI Tiers)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('eval'); window.history.pushState(null, '', '/eval'); }} 
                  className="hover:text-crimson transition-colors duration-150 text-white/70"
                >
                  &bull; Autonomous Eval Lab (/eval)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('trigger'); window.history.pushState(null, '', '/trigger'); }} 
                  className="hover:text-crimson transition-colors duration-150 text-white/70"
                >
                  &bull; Secret Trigger Lab (/trigger)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer MCP Server */}
          <div className="space-y-2.5">
            <h4 className="font-display font-bold uppercase tracking-wider text-white/90 text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
              Customer MCP Server
            </h4>
            <ul className="space-y-1.5 text-white/60 font-mono text-[11px]">
              <li className="hover:text-white/90 transition-colors"><code>intra_list_dependencies</code></li>
              <li className="hover:text-white/90 transition-colors"><code>intra_get_contract</code></li>
              <li className="hover:text-white/90 transition-colors"><code>intra_recent_changes</code></li>
              <li className="hover:text-white/90 transition-colors"><code>intra_impact</code></li>
              <li className="hover:text-white/90 transition-colors"><code>intra_propose_adapter</code></li>
              <li className="hover:text-white/90 transition-colors"><code>intra_apply_adapter</code></li>
              <li className="hover:text-white/90 transition-colors"><code>intra_health</code></li>
            </ul>
          </div>

          {/* Column 4: Safe Handling Policy */}
          <div className="space-y-2.5">
            <h4 className="font-display font-bold uppercase tracking-wider text-white/90 text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
              Safe-Handling Policy
            </h4>
            <div className="space-y-2 text-white/60">
              <div className="flex justify-between font-mono text-[11px] bg-white/[0.03] p-1.5 rounded border border-white/5">
                <span className="text-white/60">Confidence &ge; 90%:</span>
                <span className="font-bold text-white">Auto-Apply</span>
              </div>
              <div className="flex justify-between font-mono text-[11px] bg-white/[0.03] p-1.5 rounded border border-white/5">
                <span className="text-white/60">70% &le; Conf &lt; 90%:</span>
                <span className="font-bold text-white/90">Migration PR</span>
              </div>
              <div className="flex justify-between font-mono text-[11px] bg-crimson/10 p-1.5 rounded border border-crimson/20">
                <span className="text-white/60">Confidence &lt; 70%:</span>
                <span className="font-bold text-crimson">Quarantine</span>
              </div>
              <div className="flex justify-between font-mono text-[11px] bg-crimson/15 p-1.5 rounded border border-crimson/30">
                <span className="text-white/60">Breaking Verdict:</span>
                <span className="font-bold text-crimson">Circuit Break</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ENGINE STATUS:</span>
            <span className="text-white font-bold">ALL SYSTEMS OPERATIONAL</span>
          </div>
          <div>
            COLOR PALETTE: <span className="text-crimson font-semibold">CRIMSON (#C8102E)</span> &bull; <span className="text-white/90 font-semibold">CREAM (#FAF7F2)</span> &bull; <span className="text-white/90 font-semibold">BLACK (#0A0A0A)</span>
          </div>
          <div>
            FONTS: <span className="text-white font-semibold">POPPINS</span> + <span className="text-white font-semibold">MONTSERRAT</span>
          </div>
        </div>

        {/* Giant Antigravity "Intra." Headline with Dark-to-Crimson Gradient Clipping */}
        <div className="relative overflow-hidden pt-4 pb-1 text-center select-none pointer-events-none">
          <span 
            className="font-display font-black text-6xl sm:text-8xl md:text-[11rem] lg:text-[14rem] xl:text-[16rem] leading-none tracking-tighter block"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(200, 16, 46, 0.45) 50%, rgba(10, 10, 10, 0.8) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Intra.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/10 pt-4 text-center font-mono text-[11px] text-white/40 gap-2">
          <div>
            &copy; {new Date().getFullYear()} Intra. Autonomous Upstream API Resilience Platform.
          </div>
          <div className="flex items-center space-x-3 text-white/40">
            <span>EIP-712 CHAIN 91562037</span>
            <span>&bull;</span>
            <span>SHA-256 PROOF ANCHORED</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
