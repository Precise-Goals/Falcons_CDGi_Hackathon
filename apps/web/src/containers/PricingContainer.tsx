import { useState } from 'react';
import {
  Check,
  Wallet,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { UserProfile, MstcPurchaseSuccess } from '../types';
import { saveSession, saveUserProfile } from '../lib/firebase';
import { logLedgerChecksum } from '../lib/crypto';

export interface PricingContainerProps {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onOpenAuth: () => void;
  onBuyPlanWithMstc: (plan: 'free' | 'starter' | 'business', amountMstc: string) => Promise<void>;
  mstcPurchaseLoading: boolean;
  mstcPurchaseSuccess: MstcPurchaseSuccess | null;
  mstcPurchaseError: string | null;
}

export function PricingContainer({
  user,
  setUser,
  onOpenAuth,
  onBuyPlanWithMstc,
  mstcPurchaseLoading,
  mstcPurchaseSuccess,
  mstcPurchaseError,
}: PricingContainerProps) {
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'annual'>('annual');

  const handleSelectTier = async (tierId: 'free' | 'starter' | 'business') => {
    if (user) {
      const newLimit = tierId === 'free' ? 15 : tierId === 'starter' ? 30 : 45;
      const updated: UserProfile = {
        ...user,
        tier: tierId,
        nftLimit: newLimit,
      };
      setUser(updated);
      saveSession({
        uid: updated.uid,
        email: updated.email,
        idToken: updated.idToken,
        refreshToken: '',
        expiresAt: Date.now() + 3600 * 1000,
        plan: tierId,
        nfts: newLimit,
        walletAddress: updated.walletAddress,
        walletSignature: updated.walletSignature,
        mstBalance: updated.mstBalance,
        mappedAt: updated.mappedAt,
      });
      try {
        await saveUserProfile(user.uid, user.idToken, {
          uid: user.uid,
          email: user.email,
          plan: tierId,
          nfts: newLimit,
          walletAddress: user.walletAddress,
          walletSignature: user.walletSignature,
          mstBalance: user.mstBalance,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not sync tier to Firebase RTDB:', e);
      }
      await logLedgerChecksum(`tier_upgraded_${tierId}`, { tier: tierId, nfts: newLimit });
    } else {
      onOpenAuth();
    }
  };

  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="verified-badge">TRANSPARENT SUBSCRIPTION TIERS</span>
        <h2 className="font-display font-black text-4xl sm:text-5xl text-black tracking-tight">
          Predictable Resilience Pricing.
        </h2>
        <p className="text-sm text-black/60">
          Choose the plan that fits your integration surface. Every plan includes non-blocking observation and cryptographic ledger proofs.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div className="inline-flex items-center p-1 rounded-full bg-cream-subtle border border-black/10 text-xs font-mono font-bold">
          <button
            onClick={() => setPricingCycle('monthly')}
            className={`px-4 py-1.5 rounded-full transition ${
              pricingCycle === 'monthly' ? 'bg-black text-white shadow-sm' : 'text-black/60 hover:text-black'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPricingCycle('annual')}
            className={`px-4 py-1.5 rounded-full transition ${
              pricingCycle === 'annual' ? 'bg-crimson text-white shadow-sm' : 'text-black/60 hover:text-black'
            }`}
          >
            Annual (Save 20%)
          </button>
        </div>
      </div>

      {/* Purchase Notification Banner */}
      {mstcPurchaseSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono space-y-1">
          <div className="font-bold flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Plan {mstcPurchaseSuccess.plan.toUpperCase()} Purchased with {mstcPurchaseSuccess.amountMstc} MSTC Tokens!</span>
          </div>
          <div className="text-[11px] text-emerald-700 truncate">
            TX Hash: {mstcPurchaseSuccess.txHash}
          </div>
          <div className="text-[10px] text-emerald-600 truncate">
            Ledger Seal: sha256:{mstcPurchaseSuccess.checksum}
          </div>
        </div>
      )}
      {mstcPurchaseError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-mono flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{mstcPurchaseError}</span>
        </div>
      )}

      {/* Pricing Cards Grid with Skeuomorphic Depth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            id: 'free' as const,
            name: 'Free Starter',
            mstcPrice: '0',
            priceMonthly: 0,
            priceAnnual: 0,
            limit: '15 NFTs / Quota Pool',
            desc: 'Perfect for solo developers testing resilience on open APIs.',
            features: [
              '15 NFT AI adaptation requests',
              '5,000 monthly telemetry observations',
              'Standard community support',
              'Public contract inference',
              'Local developer proxy CLI',
            ],
            highlight: false,
          },
          {
            id: 'starter' as const,
            name: 'Starter Pro',
            mstcPrice: '2.5',
            priceMonthly: 49,
            priceAnnual: 39,
            limit: '30 NFTs / Quota Pool',
            desc: 'Ideal for growth companies with mission-critical vendor APIs.',
            features: [
              '30 NFT AI adaptation requests',
              '100,000 monthly telemetry observations',
              'Automated Canary adapter synthesis',
              'BridgeKey MST Blockchain ledger signing',
              '5 team seats & GitHub PR automation',
              'Priority Discord & email support',
            ],
            highlight: true,
          },
          {
            id: 'business' as const,
            name: 'Business Enterprise',
            mstcPrice: '7.5',
            priceMonthly: 199,
            priceAnnual: 159,
            limit: '45 NFTs / Quota Pool',
            desc: 'For enterprise platforms requiring zero unannounced breakage.',
            features: [
              '45 NFT AI adaptation requests',
              'Unlimited telemetry observations',
              'Multi-tenant proxy gateways',
              'Custom AST blast-radius analyzer',
              'Dedicated SLA (99.99% uptime)',
              'Custom MCP bridge integrations',
              '24/7 dedicated engineering incident channel',
            ],
            highlight: false,
          },
        ].map((tier) => {
          const isCurrent = user?.tier === tier.id;
          const price = pricingCycle === 'annual' ? tier.priceAnnual : tier.priceMonthly;
          return (
            <div
              key={tier.id}
              className={`skeuo-card p-8 rounded-[2rem] flex flex-col justify-between space-y-6 ${
                tier.highlight ? 'border-crimson shadow-xl relative' : 'border-black/10'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-crimson text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold text-lg text-black">{tier.name}</h3>
                    <div className="text-[11px] font-mono text-crimson font-bold mt-0.5">{tier.limit}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline space-x-1">
                    <span className="font-display font-black text-4xl text-black">${price}</span>
                    <span className="text-xs text-black/50 font-mono">/ month</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-0.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-crimson/10 border border-crimson/20 text-crimson font-mono text-xs font-bold flex items-center space-x-1">
                      <Wallet className="w-3 h-3 text-crimson" />
                      <span>{tier.mstcPrice} MSTC</span>
                    </span>
                    <span className="text-[10px] font-mono text-black/50">on MST Blockchain</span>
                  </div>
                </div>

                <p className="text-xs text-black/60">{tier.desc}</p>

                <div className="pt-4 border-t border-black/5 space-y-2.5 text-xs">
                  {tier.features.map((feat, i) => (
                    <div key={i} className="flex items-center space-x-2 text-black/75">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleSelectTier(tier.id)}
                  className={`w-full py-3 rounded-full font-display font-bold text-xs transition ${
                    isCurrent
                      ? 'bg-emerald-600 text-white cursor-default'
                      : tier.highlight
                      ? 'skeuo-button-primary text-white'
                      : 'skeuo-button-dark text-white'
                  }`}
                >
                  {isCurrent ? 'Current Active Plan' : `Select ${tier.name}`}
                </button>

                {tier.id !== 'free' && (
                  <button
                    onClick={() => onBuyPlanWithMstc(tier.id, tier.mstcPrice)}
                    disabled={mstcPurchaseLoading || isCurrent}
                    className="w-full py-2.5 rounded-full font-mono font-bold text-xs border border-crimson/30 bg-crimson/5 hover:bg-crimson/15 text-crimson transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                  >
                    {mstcPurchaseLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing MSTC Transfer...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-3.5 h-3.5 text-crimson" />
                        <span>Buy with {tier.mstcPrice} MSTC</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default PricingContainer;
