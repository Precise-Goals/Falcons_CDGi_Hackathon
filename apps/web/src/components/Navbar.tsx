import { useState, useRef, useEffect } from 'react';
import {
  Home,
  ChevronDown,
  BookOpen,
  Activity,
  Cpu,
  Terminal,
  Code2,
  DollarSign,
  FlaskConical,
  User as UserIcon,
} from 'lucide-react';
import { MainTab, UserProfile } from '../types';

export interface NavbarProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  activeMutationsCount?: number;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  activeMutationsCount = 0,
  user,
  onOpenAuth,
}: NavbarProps) {
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const productsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target as Node)) {
        setProductsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-5 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto liquid-glass rounded-full px-3 py-1.5 flex items-center gap-1.5 sm:gap-2 shadow-capsule">
        {/* Centered Brand Icon & Logo */}
        <div
          onClick={() => setActiveTab('home')}
          className="cursor-pointer flex items-center space-x-2 px-3 py-1 rounded-full hover:bg-black/5 transition"
        >
          <img
            src="/logo.png"
            alt="Intra Emblem"
            className="w-5 h-5 object-contain"
          />
          <img
            src="/logowithname.png"
            alt="Intra"
            className="h-4.5 max-h-5 object-contain hidden sm:inline"
          />
          <span className="font-display font-black text-xs tracking-wider text-black sm:hidden">
            INTRA
          </span>
        </div>

        <div className="h-4 w-[1px] bg-black/10 mx-0.5" />

        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
            activeTab === 'home'
              ? 'bg-black text-white shadow-sm'
              : 'text-black/75 hover:text-black hover:bg-black/5'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        {/* Tab 2: Products Dropdown (Agent, MCP, SDK) */}
        <div className="relative" ref={productsDropdownRef}>
          <button
            onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
            className={`flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'agent' || activeTab === 'mcp' || activeTab === 'sdk'
                ? 'bg-black text-white shadow-sm'
                : 'text-black/75 hover:text-black hover:bg-black/5'
            }`}
          >
            <span>Products</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {productsDropdownOpen && (
            <div className="absolute top-full mt-2 -left-6 w-56 liquid-glass-card rounded-[1.5rem] p-2.5 shadow-2xl space-y-1 z-50 border border-white/80 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setActiveTab('agent');
                  setProductsDropdownOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition ${
                  activeTab === 'agent' ? 'bg-crimson text-white font-bold' : 'hover:bg-black/5 text-black'
                }`}
              >
                <Cpu className="w-4 h-4 text-crimson" />
                <div>
                  <div className="text-xs font-bold">Agent Workbench</div>
                  <div className="text-[10px] text-black/50 font-mono">Claude-Style Ask & Plan</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('mcp');
                  setProductsDropdownOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition ${
                  activeTab === 'mcp' ? 'bg-crimson text-white font-bold' : 'hover:bg-black/5 text-black'
                }`}
              >
                <Terminal className="w-4 h-4 text-crimson" />
                <div>
                  <div className="text-xs font-bold">Customer MCP Server</div>
                  <div className="text-[10px] text-black/50 font-mono">7 Discovery & Adapter Tools</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('sdk');
                  setProductsDropdownOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition ${
                  activeTab === 'sdk' ? 'bg-crimson text-white font-bold' : 'hover:bg-black/5 text-black'
                }`}
              >
                <Code2 className="w-4 h-4 text-crimson" />
                <div>
                  <div className="text-xs font-bold">Client SDK & Proxy</div>
                  <div className="text-[10px] text-black/50 font-mono">@intra/sdk Dynamic Interceptor</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Tab 3: Docs */}
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
            activeTab === 'docs'
              ? 'bg-black text-white shadow-sm'
              : 'text-black/75 hover:text-black hover:bg-black/5'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Docs</span>
        </button>

        {/* Tab 4: Pricing */}
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
            activeTab === 'pricing'
              ? 'bg-black text-white shadow-sm'
              : 'text-black/75 hover:text-black hover:bg-black/5'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Pricing</span>
        </button>

        {/* Tab 5: Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
            activeTab === 'dashboard'
              ? 'bg-crimson text-white shadow-sm'
              : 'text-black/75 hover:text-black hover:bg-black/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Dashboard</span>
          {activeMutationsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-crimson text-[10px] font-bold flex items-center justify-center">
              {activeMutationsCount}
            </span>
          )}
        </button>

        {/* Secret Route: Autonomous Verification Laboratory (Discreet icon-only button) */}
        <button
          onClick={() => {
            setActiveTab('eval');
            window.history.pushState(null, '', '/eval');
          }}
          title="Autonomous Verification & Stress Laboratory"
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
            activeTab === 'eval'
              ? 'bg-black text-white shadow-sm ring-1 ring-crimson'
              : 'text-crimson/80 hover:text-crimson hover:bg-crimson/5 border border-crimson/20'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-crimson" />
        </button>

        <div className="h-4 w-[1px] bg-black/10 mx-0.5" />

        {/* User Profile / Auth Pill */}
        <button
          onClick={onOpenAuth}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 transition text-xs font-mono font-bold text-black"
        >
          <UserIcon className="w-3 h-3 text-crimson" />
          <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
        </button>
      </nav>
    </header>
  );
}
export default Navbar;
