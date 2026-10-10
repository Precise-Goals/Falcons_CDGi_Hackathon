import { useState } from 'react';
import {
  X,
  ShieldCheck,
  Wallet,
  RefreshCw,
  Check,
  Key,
  Loader2,
  LogOut,
} from 'lucide-react';
import { UserProfile, MstcPurchaseSuccess } from '../types';
import {
  firebaseSignIn,
  firebaseSignUp,
  saveSession,
  clearSession,
  saveUserProfile,
} from '../lib/firebase';
import {
  connectBridgeKeyWallet,
  connectBridgeKeyOperatorSession,
  signIdentityChallenge,
  mapWalletToFirebase,
  fetchMstBalance,
  MST_CHAIN_ID_DEC,
} from '../lib/mstWallet';
import { logLedgerChecksum } from '../lib/crypto';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onBuyPlanWithMstc: (plan: 'free' | 'starter' | 'business', amountMstc: string) => Promise<void>;
  mstcPurchaseLoading: boolean;
  mstcPurchaseSuccess: MstcPurchaseSuccess | null;
}

export function AuthModal({
  isOpen,
  onClose,
  user,
  setUser,
  onBuyPlanWithMstc,
  mstcPurchaseLoading,
  mstcPurchaseSuccess,
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // BridgeKey Wallet Link State (MST Blockchain Testnet)
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real Firebase Auth Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setAuthLoading(true);
    setAuthError(null);

    try {
      const fbUser =
        authMode === 'signup'
          ? await firebaseSignUp(loginEmail, loginPassword)
          : await firebaseSignIn(loginEmail, loginPassword);

      const profile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${fbUser.uid}`,
        tier: fbUser.plan,
        nftLimit: fbUser.nfts,
        walletAddress: fbUser.walletAddress,
        walletSignature: fbUser.walletSignature,
        mstBalance: fbUser.mstBalance,
        idToken: fbUser.idToken,
        mappedAt: fbUser.mappedAt,
      };

      setUser(profile);
      onClose();
      setLoginEmail('');
      setLoginPassword('');
      await logLedgerChecksum('firebase_auth_success', {
        uid: profile.uid,
        email: profile.email,
        tier: profile.tier,
      });
    } catch (err: any) {
      setAuthError(err.message || 'Firebase authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    clearSession();
    setUser(null);
    onClose();
    await logLedgerChecksum('user_logged_out', { ts: new Date().toISOString() });
  };

  // Real BridgeKey Wallet Mapping
  const handleConnectWallet = async (type: 'browser' | 'operator') => {
    if (!user) return;
    setWalletLoading(true);
    setWalletError(null);
    setWalletSuccess(null);

    try {
      const walletState =
        type === 'browser'
          ? await connectBridgeKeyWallet()
          : await connectBridgeKeyOperatorSession();

      const { signature, checksum } = await signIdentityChallenge(walletState, user.uid);

      await mapWalletToFirebase(
        user.uid,
        user.idToken,
        walletState,
        user.tier,
        user.nftLimit,
        signature
      );

      const updatedUser: UserProfile = {
        ...user,
        walletAddress: walletState.address,
        walletSignature: signature,
        mstBalance: walletState.balance,
        mappedAt: new Date().toISOString(),
      };

      setUser(updatedUser);
      saveSession({
        uid: updatedUser.uid,
        email: updatedUser.email,
        idToken: updatedUser.idToken,
        refreshToken: '',
        expiresAt: Date.now() + 3600 * 1000,
        plan: updatedUser.tier,
        nfts: updatedUser.nftLimit,
        walletAddress: updatedUser.walletAddress,
        walletSignature: updatedUser.walletSignature,
        mstBalance: updatedUser.mstBalance,
        mappedAt: updatedUser.mappedAt,
      });

      setWalletSuccess(
        `Wallet mapped to Firebase! Checksum sha256:${checksum.slice(0, 10)}... (Balance: ${walletState.balance} MST)`
      );
    } catch (err: any) {
      setWalletError(err.message || 'Failed to connect and map BridgeKey wallet.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleRefreshMstBalance = async () => {
    if (!user?.walletAddress) return;
    try {
      const balance = await fetchMstBalance(user.walletAddress);
      setUser((prev) => (prev ? { ...prev, mstBalance: balance } : null));
    } catch (err) {
      console.warn('Failed to refresh MST balance:', err);
    }
  };

  const handleTierSwitch = async (t: 'free' | 'starter' | 'business') => {
    if (!user) return;
    const nfts = t === 'free' ? 15 : t === 'starter' ? 30 : 45;
    const updated: UserProfile = { ...user, tier: t, nftLimit: nfts };
    setUser(updated);
    saveSession({
      uid: updated.uid,
      email: updated.email,
      idToken: updated.idToken,
      refreshToken: '',
      expiresAt: Date.now() + 3600 * 1000,
      plan: t,
      nfts,
      walletAddress: updated.walletAddress,
      walletSignature: updated.walletSignature,
      mstBalance: updated.mstBalance,
      mappedAt: updated.mappedAt,
    });
    try {
      await saveUserProfile(user.uid, user.idToken, {
        uid: user.uid,
        email: user.email,
        plan: t,
        nfts,
        walletAddress: user.walletAddress,
        walletSignature: user.walletSignature,
        mstBalance: user.mstBalance,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not sync tier to RTDB:', err);
    }
    await logLedgerChecksum(`tier_switched_${t}`, { tier: t, nfts });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md liquid-glass-card p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative border border-white/80">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-black/50 hover:text-black transition"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-full mx-auto overflow-hidden border-2 border-crimson p-0.5">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-black">{user.email}</h3>
              <div className="text-[11px] text-black/50 font-mono">UID: {user.uid}</div>
              <div className="mt-1 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>FIREBASE AUTHENTICATED (HORIZON-1BA53)</span>
              </div>
            </div>

            {/* Section 1: Active Subscription Tier & Rate Limits */}
            <div className="p-4 rounded-2xl bg-cream-subtle text-left space-y-2.5 text-xs font-mono border border-black/5">
              <div className="flex justify-between items-center">
                <span className="text-black/60 font-semibold">SUBSCRIPTION TIER:</span>
                <span className="font-bold text-crimson uppercase">
                  {user.tier} ({user.nftLimit} NFTs)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['free', 'starter', 'business'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTierSwitch(t)}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border transition ${
                      user.tier === t
                        ? 'bg-crimson text-white border-crimson shadow-sm'
                        : 'bg-white text-black/70 border-black/10 hover:border-black/30'
                    }`}
                  >
                    {t.toUpperCase()} ({t === 'free' ? 15 : t === 'starter' ? 30 : 45})
                  </button>
                ))}
              </div>

              {/* MSTC Token Plan Purchase Trigger */}
              <div className="pt-2 border-t border-black/5 space-y-2">
                <div className="text-[10px] text-black/50 font-semibold uppercase">
                  Purchase with MSTC Tokens (MST Testnet):
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onBuyPlanWithMstc('starter', '2.5')}
                    disabled={mstcPurchaseLoading || user.tier === 'starter'}
                    className="py-1.5 px-2 rounded-xl border border-crimson/30 bg-crimson/5 hover:bg-crimson/15 text-crimson text-[10px] font-bold transition flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    <Wallet className="w-3 h-3 text-crimson" />
                    <span>Starter (2.5 MSTC)</span>
                  </button>
                  <button
                    onClick={() => onBuyPlanWithMstc('business', '7.5')}
                    disabled={mstcPurchaseLoading || user.tier === 'business'}
                    className="py-1.5 px-2 rounded-xl border border-crimson/30 bg-crimson/5 hover:bg-crimson/15 text-crimson text-[10px] font-bold transition flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    <Wallet className="w-3 h-3 text-crimson" />
                    <span>Business (7.5 MSTC)</span>
                  </button>
                </div>

                {mstcPurchaseSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-[10px] font-mono space-y-0.5">
                    <div className="font-bold flex items-center space-x-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>
                        Bought {mstcPurchaseSuccess.plan.toUpperCase()} ({mstcPurchaseSuccess.amountMstc} MSTC)
                      </span>
                    </div>
                    <div className="truncate text-emerald-700">TX: {mstcPurchaseSuccess.txHash}</div>
                    <div className="truncate text-emerald-600">
                      Seal: sha256:{mstcPurchaseSuccess.checksum.slice(0, 16)}...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Real BridgeKey Wallet on MST Blockchain */}
            <div className="p-4 rounded-2xl bg-cream-subtle text-left space-y-3 text-xs font-mono border border-black/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5">
                  <Wallet className="w-3.5 h-3.5 text-crimson" />
                  <span className="text-black/60 font-semibold">BRIDGEKEY WALLET</span>
                </div>
                <span className="text-[10px] text-black/40">CHAIN ID {MST_CHAIN_ID_DEC}</span>
              </div>

              {user.walletAddress ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-white border border-black/10 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-black/50">ADDRESS:</span>
                      <span className="font-bold text-black truncate max-w-[170px]" title={user.walletAddress}>
                        {user.walletAddress}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-black/50">MST BALANCE:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-crimson">{user.mstBalance || '0.0000'} MST</span>
                        <button
                          onClick={handleRefreshMstBalance}
                          title="Refresh live balance from RPC"
                          className="p-1 hover:bg-black/5 rounded text-black/60"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-emerald-600 flex items-center space-x-1 font-bold">
                    <Check className="w-3 h-3" />
                    <span>MAPPED TO FIREBASE & SIGNED</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-black/60 leading-tight">
                    No BridgeKey wallet linked yet. Map your wallet address to this Firebase user via signed cryptographic nonce challenge.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleConnectWallet('browser')}
                      disabled={walletLoading}
                      className="py-2 px-2.5 rounded-xl border border-black/15 bg-white hover:border-crimson hover:bg-crimson/5 text-[10px] font-bold text-black transition flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Wallet className="w-3 h-3 text-crimson" />
                      <span>BridgeKey Extension</span>
                    </button>
                    <button
                      onClick={() => handleConnectWallet('operator')}
                      disabled={walletLoading}
                      className="py-2 px-2.5 rounded-xl border border-black/15 bg-white hover:border-crimson hover:bg-crimson/5 text-[10px] font-bold text-black transition flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Key className="w-3 h-3 text-crimson" />
                      <span>Operator Keypair (76.91 MST)</span>
                    </button>
                  </div>
                </div>
              )}

              {walletLoading && (
                <div className="p-2 rounded-xl bg-crimson/5 text-crimson text-[11px] flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  <span>Signing nonce & mapping to Firebase Realtime DB...</span>
                </div>
              )}

              {walletError && (
                <div className="p-2 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson text-[11px]">
                  {walletError}
                </div>
              )}

              {walletSuccess && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px]">
                  {walletSuccess}
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-full border border-crimson text-crimson font-mono text-xs font-bold hover:bg-crimson/5 transition flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Platform</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="text-left space-y-1">
              <span className="verified-badge">FIREBASE AUTHENTICATION (HORIZON-1BA53)</span>
              <h3 className="font-display font-bold text-xl text-black">
                {authMode === 'signin' ? 'Sign In to Intra' : 'Create an Account'}
              </h3>
              <p className="text-xs text-black/60">
                Live Firebase authentication with real BridgeKey wallet mapping on MST Blockchain testnet.
              </p>
            </div>

            {/* Tab Switcher: Sign In vs Sign Up */}
            <div className="flex rounded-full bg-cream-subtle p-1 border border-black/10 text-xs font-mono font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-full transition ${
                  authMode === 'signin' ? 'bg-black text-white shadow-sm' : 'text-black/60 hover:text-black'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-full transition ${
                  authMode === 'signup' ? 'bg-crimson text-white shadow-sm' : 'text-black/60 hover:text-black'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono text-left">
              <div className="space-y-1">
                <label className="text-black/60 font-semibold">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  placeholder="developer@intra.dev"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-black focus:outline-none focus:border-crimson"
                />
              </div>
              <div className="space-y-1">
                <label className="text-black/60 font-semibold">PASSWORD (MIN 6 CHARACTERS)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-black focus:outline-none focus:border-crimson"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson text-xs font-mono text-left">
                {authError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={authLoading}
                className="skeuo-button-primary w-full py-3 rounded-full text-white font-mono text-xs font-bold flex items-center justify-center space-x-2"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Authenticating with Firebase...</span>
                  </>
                ) : (
                  <span>{authMode === 'signin' ? 'Sign In with Firebase' : 'Register Account on Firebase'}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
export default AuthModal;
