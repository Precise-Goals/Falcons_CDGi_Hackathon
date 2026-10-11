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
  ShieldCheck,
  FileText,
  Zap,
  Bluetooth,
  BluetoothConnected,
  BluetoothSearching,
  Key,
} from 'lucide-react';
import { MainTab, UserProfile, DocsCategory } from '../types';
import { bleManager } from '../lib/bleManager';

export interface NavbarProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  docsCategory?: DocsCategory;
  setDocsCategory?: (category: DocsCategory) => void;
  activeMutationsCount?: number;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  docsCategory = 'docs',
  setDocsCategory,
  activeMutationsCount = 0,
  user,
  onOpenAuth,
}: NavbarProps) {
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const productsDropdownRef = useRef<HTMLDivElement>(null);

  const [docsDropdownOpen, setDocsDropdownOpen] = useState(false);
  const docsDropdownRef = useRef<HTMLDivElement>(null);

  // Bluetooth Low Energy (BLE) Hardware Airlink State
  const [bleConnected, setBleConnected] = useState<boolean>(() => bleManager.isConnected);
  const [bleConnecting, setBleConnecting] = useState<boolean>(false);
  const [bleToast, setBleToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target as Node)) {
        setProductsDropdownOpen(false);
      }
      if (docsDropdownRef.current && !docsDropdownRef.current.contains(event.target as Node)) {
        setDocsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Subscribe to BLE connection changes & auto-reconnect to paired hardware node
  useEffect(() => {
    const unsubscribe = bleManager.onConnectionChange((connected) => {
      setBleConnected(connected);
      if (connected) {
        setBleConnecting(false);
      }
    });

    // Zero-click auto-reconnect if device was previously paired
    bleManager.tryAutoReconnect().catch(() => {});

    return unsubscribe;
  }, []);

  const showToast = (message: string, type: 'success' | 'warn' | 'info') => {
    setBleToast({ message, type });
    setTimeout(() => {
      setBleToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  const handleBleClick = async () => {
    if (bleConnected) {
      bleManager.disconnect();
      showToast('BLE Airlink Disconnected', 'warn');
      return;
    }

    if (!bleManager.isSupported) {
      showToast('Web Bluetooth unsupported in browser', 'warn');
      return;
    }

    setBleConnecting(true);
    showToast('Pairing Hardware Companion (<20ms BLE)...', 'info');
    const success = await bleManager.connect();
    setBleConnecting(false);

    if (success) {
      const devName = bleManager.deviceName || 'Android Companion';
      showToast(`Airlink Active: ${devName} (<20ms)`, 'success');
    } else {
      showToast('Airlink pairing cancelled or timed out', 'warn');
    }
  };

  return (
    <header className="fixed top-5 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto liquid-glass rounded-full px-3 py-1.5 flex items-center gap-1.5 sm:gap-2 shadow-capsule border border-black/10 backdrop-blur-xl">
        {/* Centered Brand Icon & Logo */}
        <div
          onClick={() => setActiveTab('home')}
          className="cursor-pointer flex items-center space-x-2 px-3 py-1 rounded-full hover:bg-black/5 transition"
        >
          <img
            src="/logo.png"
            alt="Intra Emblem"
            className="w-5 h-5 object-contain"
            style={{
              borderRadius:"4rem"
            }}
          />
          <span className="font-display font-black text-xs tracking-wider text-black ">
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
            <ChevronDown
              className={`w-3 h-3 opacity-60 transition-transform duration-200 ${
                productsDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {productsDropdownOpen && (
            <div className="absolute top-full mt-2 -left-6 w-60 bg-white rounded-[1.5rem] p-2.5 shadow-2xl space-y-1 z-[100] border border-[#E8E2D9] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5">
              <button
                onClick={() => {
                  setActiveTab('agent');
                  setProductsDropdownOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition ${
                  activeTab === 'agent'
                    ? 'bg-crimson text-white font-bold shadow-sm'
                    : 'hover:bg-cream-subtle text-black'
                }`}
              >
                <Cpu className={`w-4 h-4 ${activeTab === 'agent' ? 'text-white' : 'text-crimson'}`} />
                <div>
                  <div className="text-xs font-bold">Agent Workbench</div>
                  <div className={`text-[10px] font-mono ${activeTab === 'agent' ? 'text-white/85' : 'text-black/50'}`}>
                    Claude-Style Ask & Plan
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('mcp');
                  setProductsDropdownOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition ${
                  activeTab === 'mcp'
                    ? 'bg-crimson text-white font-bold shadow-sm'
                    : 'hover:bg-cream-subtle text-black'
                }`}
              >
                <Terminal className={`w-4 h-4 ${activeTab === 'mcp' ? 'text-white' : 'text-crimson'}`} />
                <div>
                  <div className="text-xs font-bold">Customer MCP Server</div>
                  <div className={`text-[10px] font-mono ${activeTab === 'mcp' ? 'text-white/85' : 'text-black/50'}`}>
                    7 Discovery & Adapter Tools
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('sdk');
                  setProductsDropdownOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition ${
                  activeTab === 'sdk'
                    ? 'bg-crimson text-white font-bold shadow-sm'
                    : 'hover:bg-cream-subtle text-black'
                }`}
              >
                <Code2 className={`w-4 h-4 ${activeTab === 'sdk' ? 'text-white' : 'text-crimson'}`} />
                <div>
                  <div className="text-xs font-bold">Client SDK & Proxy</div>
                  <div className={`text-[10px] font-mono ${activeTab === 'sdk' ? 'text-white/85' : 'text-black/50'}`}>
                    @intra/sdk Dynamic Interceptor
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Tab 3: Docs Category Dropdown (Docs, Terms & Policies, Research & Patent) */}
        <div className="relative" ref={docsDropdownRef}>
          <button
            onClick={() => setDocsDropdownOpen(!docsDropdownOpen)}
            className={`flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'docs'
                ? 'bg-black text-white shadow-sm'
                : 'text-black/75 hover:text-black hover:bg-black/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
            <ChevronDown
              className={`w-3 h-3 opacity-60 transition-transform duration-200 ${
                docsDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {docsDropdownOpen && (
            <div className="absolute top-full mt-2 -left-6 w-64 bg-white rounded-[1.5rem] p-2.5 shadow-2xl space-y-1 z-[100] border border-[#E8E2D9] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5">
              <button
                onClick={() => {
                  setActiveTab('docs');
                  if (setDocsCategory) setDocsCategory('docs');
                  setDocsDropdownOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition ${
                  activeTab === 'docs' && docsCategory === 'docs'
                    ? 'bg-crimson text-white font-bold shadow-sm'
                    : 'hover:bg-cream-subtle text-black'
                }`}
              >
                <BookOpen className={`w-4 h-4 ${activeTab === 'docs' && docsCategory === 'docs' ? 'text-white' : 'text-crimson'}`} />
                <div>
                  <div className="text-xs font-bold">Docs (Blueprint)</div>
                  <div className={`text-[10px] font-mono ${activeTab === 'docs' && docsCategory === 'docs' ? 'text-white/85' : 'text-black/50'}`}>
                    Architecture & Algorithms
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('docs');
                  if (setDocsCategory) setDocsCategory('terms');
                  setDocsDropdownOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition ${
                  activeTab === 'docs' && docsCategory === 'terms'
                    ? 'bg-crimson text-white font-bold shadow-sm'
                    : 'hover:bg-cream-subtle text-black'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${activeTab === 'docs' && docsCategory === 'terms' ? 'text-white' : 'text-crimson'}`} />
                <div>
                  <div className="text-xs font-bold">Terms & Policies</div>
                  <div className={`text-[10px] font-mono ${activeTab === 'docs' && docsCategory === 'terms' ? 'text-white/85' : 'text-black/50'}`}>
                    Safe-Handling & Governance
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('docs');
                  if (setDocsCategory) setDocsCategory('research');
                  setDocsDropdownOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition ${
                  activeTab === 'docs' && docsCategory === 'research'
                    ? 'bg-crimson text-white font-bold shadow-sm'
                    : 'hover:bg-cream-subtle text-black'
                }`}
              >
                <FileText className={`w-4 h-4 ${activeTab === 'docs' && docsCategory === 'research' ? 'text-white' : 'text-crimson'}`} />
                <div>
                  <div className="text-xs font-bold">Research & Patent</div>
                  <div className={`text-[10px] font-mono ${activeTab === 'docs' && docsCategory === 'research' ? 'text-white/85' : 'text-black/50'}`}>
                    Peer-Reviewed Paper & Patent
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

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

        {/* Secret Route: Live Trigger & Custom API Synthesis (/trigger) */}
        <button
          onClick={() => {
            setActiveTab('trigger');
            window.history.pushState(null, '', '/trigger');
          }}
          title="Live Trigger & Custom API Synthesis (/trigger)"
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
            activeTab === 'trigger'
              ? 'bg-crimson text-white shadow-sm ring-1 ring-black'
              : 'text-black/60 hover:text-crimson hover:bg-black/5 border border-black/10'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        </button>

        {/* Hardware Node: Web Bluetooth (BLE) Airlink */}
        <button
          onClick={handleBleClick}
          disabled={bleConnecting}
          title={
            bleConnected
              ? `Hardware Node: Active Airlink (<20ms BLE) — Click to disconnect`
              : bleConnecting
              ? `Hardware Node: Pairing BLE Airlink...`
              : `Hardware Node: BLE Disconnected (Click to Pair Android Companion)`
          }
          className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-all ${
            bleConnected
              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.45)] ring-1 ring-emerald-500/30'
              : bleConnecting
              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/40 animate-pulse'
              : 'text-crimson/80 hover:text-crimson hover:bg-crimson/5 border border-crimson/25'
          }`}
        >
          {bleConnecting ? (
            <BluetoothSearching className="w-3.5 h-3.5 animate-spin text-amber-600" />
          ) : bleConnected ? (
            <>
              <BluetoothConnected className="w-3.5 h-3.5 text-emerald-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </>
          ) : (
            <>
              <Bluetooth className="w-3.5 h-3.5 text-crimson" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-white" />
            </>
          )}
        </button>

        <div className="h-4 w-[1px] bg-black/10 mx-0.5" />

        {/* Web3 Wallet State & Signer Indicator */}
        {user?.walletAddress ? (
          <button
            onClick={onOpenAuth}
            title={`Connected to MST Blockchain Testnet (91562037)\nAddress: ${user.walletAddress}\nBalance: ${user.mstBalance || '0.00'} MST\nClick to manage wallet`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-xs font-mono font-bold hover:bg-emerald-500/15 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden md:inline">MST:</span>
            <span>
              {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            title="Connect Web3 Wallet (MetaMask / BridgeKey) on MST Blockchain Testnet"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-crimson/10 hover:bg-crimson/20 border border-crimson/30 text-xs font-mono font-bold text-crimson transition"
          >
            <Key className="w-3 h-3 text-crimson" />
            <span className="hidden md:inline">Connect Wallet</span>
          </button>
        )}

        {/* User Profile / Auth Pill */}
        <button
          onClick={onOpenAuth}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 transition text-xs font-mono font-bold text-black"
        >
          <UserIcon className="w-3 h-3 text-crimson" />
          <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
          {user?.activeTokenId && (
            <span className="px-1.5 py-0.5 rounded-full bg-crimson/15 text-crimson text-[9px] font-mono font-bold border border-crimson/30">
              #{user.activeTokenId}
            </span>
          )}
        </button>
      </nav>

      {/* Bluetooth Airlink Status Toast */}
      {bleToast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-lg backdrop-blur-md border animate-in fade-in slide-in-from-top-2 duration-200 flex items-center space-x-2 pointer-events-auto ${
            bleToast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/50 shadow-emerald-900/20'
              : bleToast.type === 'info'
              ? 'bg-black/90 text-white border-black/40'
              : 'bg-crimson/90 text-white border-crimson/50 shadow-crimson/20'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              bleToast.type === 'success' ? 'bg-emerald-400 animate-pulse' : bleToast.type === 'info' ? 'bg-amber-400' : 'bg-red-400'
            }`}
          />
          <span>{bleToast.message}</span>
        </div>
      )}
    </header>
  );
}
export default Navbar;
