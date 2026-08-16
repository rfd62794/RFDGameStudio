import React, { useState } from 'react';
import { purchaseMultiplierApi } from '../services/api';
import { Coins, TrendingUp, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

interface EconomyPanelProps {
  kingdomId: string;
  houseId: string;
  gold: number;
  rewardMultiplierLevel: number;
  onRefreshPlayer: () => void;
  recordServerCall?: () => void;
}

export function costForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.15, level));
}

export function multiplierForLevel(level: number): number {
  return 1 + level * 0.1;
}

export const EconomyPanel: React.FC<EconomyPanelProps> = ({
  kingdomId,
  houseId,
  gold,
  rewardMultiplierLevel,
  onRefreshPlayer,
  recordServerCall,
}) => {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const nextCost = costForLevel(rewardMultiplierLevel);
  const currentMultiplier = multiplierForLevel(rewardMultiplierLevel);
  const nextMultiplier = multiplierForLevel(rewardMultiplierLevel + 1);
  const canAfford = gold >= nextCost;

  const handlePurchase = async () => {
    setPurchasing(true);
    setError(null);
    setSuccessMsg(null);
    if (recordServerCall) recordServerCall();

    try {
      const res = await purchaseMultiplierApi(kingdomId, houseId);
      setSuccessMsg(`Upgraded to Level ${res.newLevel}! Multiplier is now ${(res.newMultiplier * 100).toFixed(0)}%`);
      onRefreshPlayer();
    } catch (err: any) {
      setError(err.message || 'Failed to purchase multiplier');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-amber-100">House Treasury & Multiplier</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Server-authoritative Gold balance & multiplier cost curve engine
          </p>
        </div>

        {/* Gold Display Badge */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
          <Coins className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">Treasury Balance</div>
            <div className="text-xl font-extrabold text-amber-200 font-mono">{gold.toLocaleString()} Gold</div>
          </div>
        </div>
      </div>

      {/* Dual Economy Rule Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Kingdom Contribution (Fixed)
          </div>
          <p className="text-slate-400 leading-relaxed">
            Fixed per duration tier. Never amplified by multipliers. Future threshold-facing kingdom progress.
          </p>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Gold Balance (Accrues)
          </div>
          <p className="text-slate-400 leading-relaxed">
            Accrues on every completion via atomic database increment. Amplified by your Reward Multiplier level.
          </p>
        </div>
      </div>

      {/* Multiplier Purchase Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Reward Multiplier: <span className="text-amber-400 font-mono">Level {rewardMultiplierLevel}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Current Boost: <span className="text-amber-200 font-semibold font-mono">{(currentMultiplier * 100).toFixed(0)}%</span> (+{(rewardMultiplierLevel * 10).toFixed(0)}% bonus)
            </p>
          </div>

          <button
            onClick={handlePurchase}
            disabled={purchasing || !canAfford}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border shadow-lg ${
              canAfford
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-amber-500/10 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {purchasing
              ? 'Upgrading...'
              : `Upgrade to Lvl ${rewardMultiplierLevel + 1} (${nextCost} Gold)`}
          </button>
        </div>

        {/* Upgrade impact breakdown */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>Cost Formula: <code className="text-amber-300/80 font-mono">50 × 1.15^{rewardMultiplierLevel}</code></span>
          <span>Next Boost: <span className="text-emerald-400 font-bold font-mono">{(nextMultiplier * 100).toFixed(0)}%</span></span>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
