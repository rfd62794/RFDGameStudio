/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Landmark, ArrowUpCircle, Sparkles, UserCheck, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ShopTier } from '../types';
import { formatCurrency } from '../utils';

interface ShopUpgradesProps {
  capital: number;
  debt: number;
  shopTier: ShopTier;
  isLockedOut: boolean;
  graceDaysRemaining: number;
  onUpgradeShop: () => void;
  onRepayDebt: (amount: number) => void;
  onTakeLoan: (amount: number) => void;
}

export const ShopUpgrades: React.FC<ShopUpgradesProps> = ({
  capital,
  debt,
  shopTier,
  isLockedOut,
  graceDaysRemaining,
  onUpgradeShop,
  onRepayDebt,
  onTakeLoan,
}) => {
  const isGrace = graceDaysRemaining > 0;

  // Configuration for shop expansions
  const getNextUpgradeCost = (tier: ShopTier): number | null => {
    if (tier === 1) return 1500; // Alley Stall -> Storefront
    if (tier === 2) return 3500; // Storefront -> Boutique
    return null; // Max tier
  };

  const getNextUpgradeBenefits = (tier: ShopTier): string[] => {
    if (tier === 1) {
      return [
        "Expand physical storage to 8 slots",
        "Draw a second active lot offer per day"
      ];
    }
    if (tier === 2) {
      return [
        "Expand physical storage to 12 slots",
        "Hire Expert Appraiser: Halves Inspect action duration"
      ];
    }
    return [];
  };

  const nextCost = getNextUpgradeCost(shopTier);
  const canAffordUpgrade = nextCost !== null && capital >= nextCost;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="upgrades-and-lender-panel">
      
      {/* Lender Terminal */}
      <div className="bg-white border-2 border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-slate-200">
            <h3 className="font-display text-sm font-bold text-slate-950 flex items-center gap-1.5">
              <Landmark size={14} className="text-rose-600" />
              <span>Lender General Terminal</span>
            </h3>
            {isLockedOut ? (
              <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 animate-pulse">
                <ShieldAlert size={10} /> Default Lockout
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                <ShieldCheck size={10} /> Good Standing
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Manage your high-pressure financing. Repay compounding debt early to stop interest accrual, or request emergency liquidity.
          </p>

          {isLockedOut && (
            <div className="mb-4 p-2.5 bg-rose-50 border-2 border-rose-600 rounded-lg text-xs font-mono text-rose-800">
              <strong className="block uppercase text-[10px] mb-0.5 font-bold">⚠️ LOCKOUT WARNING:</strong>
              You missed your compounding debt interest payment of at least $100. **All acquisition board offerings and new loans are locked** until you pay down at least $100 of debt.
            </div>
          )}

          {/* Debt Repayment Actions */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Repay Debt Principal</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[100, 250, 500, 1000].map((amount) => {
                const canPay = capital >= amount && debt >= amount;
                return (
                  <button
                    key={amount}
                    onClick={() => onRepayDebt(amount)}
                    disabled={!canPay}
                    className={`py-1 rounded font-mono text-xs font-bold transition-all border ${
                      canPay
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-700 shadow-sm'
                        : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    ${amount}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => onRepayDebt(debt)}
              disabled={capital === 0 || debt === 0}
              className={`w-full py-1.5 rounded font-mono text-xs font-bold transition-all border uppercase tracking-wider ${
                capital >= debt && debt > 0
                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm'
                  : capital > 0 && debt > 0
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
              }`}
            >
              Repay {capital >= debt ? 'Full Debt' : 'All Available Cash'} ({formatCurrency(Math.min(capital, debt))})
            </button>
          </div>

          {/* Borrow New Capital Actions */}
          <div className="space-y-2 mt-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Apply for Emergency Loans</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[500, 1000, 2000].map((amount) => {
                // Cannot borrow if locked out, or if debt exceeds $6,000 credit limit
                const isLimitExceeded = debt + amount > 6000;
                const canBorrow = !isLockedOut && !isLimitExceeded;
                return (
                  <button
                    key={amount}
                    onClick={() => onTakeLoan(amount)}
                    disabled={!canBorrow}
                    className={`py-1.5 rounded font-mono text-xs font-bold transition-all border ${
                      canBorrow
                        ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-600 hover:text-white hover:border-rose-700 shadow-sm'
                        : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                    }`}
                    title={isLimitExceeded ? "Credit limit of $6,000 reached" : isLockedOut ? "Resolve default lockout first" : ""}
                  >
                    +${amount}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-1 px-1">
              <span>Limit: $6,000 max debt</span>
              <span>{isGrace ? 'Grace Period Active (0% interest)' : 'Immediate 10%/day interest'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Expansion */}
      <div className="bg-white border-2 border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-slate-200">
            <h3 className="font-display text-sm font-bold text-slate-950 flex items-center gap-1.5">
              <ArrowUpCircle size={14} className="text-indigo-600" />
              <span>Shop Expansion Registry</span>
            </h3>
            <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
              Current: Tier {shopTier}
            </span>
          </div>

          {nextCost ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Upgrade your physical shop presence. Unlocks more spacious storage grids, attracts secondary simultaneous walk-in/auction lots, and hires high-grade experts.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  Next Tier: {shopTier === 1 ? 'Storefront' : 'Boutique'} Benefits
                </span>
                <ul className="space-y-1">
                  {getNextUpgradeBenefits(shopTier).map((benefit, idx) => (
                    <li key={idx} className="text-xs font-mono text-slate-700 flex items-start gap-1.5">
                      <Sparkles size={11} className="text-indigo-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between font-mono text-xs pt-2">
                <span className="text-slate-400">Upgrade Investment:</span>
                <span className="font-bold text-slate-900">{formatCurrency(nextCost)}</span>
              </div>
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <span className="inline-flex items-center justify-center p-3 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 mb-2">
                <UserCheck size={20} />
              </span>
              <p className="text-sm font-display font-bold text-slate-900">Boutique Max Tier Reached</p>
              <p className="text-xs text-slate-400 font-mono mt-1 max-w-xs mx-auto">
                Your shop is fully optimized. You have maximum shelf storage (12 slots) and the Expert appraiser hired.
              </p>
            </div>
          )}
        </div>

        {nextCost && (
          <button
            onClick={onUpgradeShop}
            disabled={!canAffordUpgrade}
            className={`w-full flex items-center justify-center gap-1.5 py-2 mt-4 font-mono font-bold text-xs rounded uppercase border transition-all shadow-sm ${
              canAffordUpgrade
                ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
            id="btn-upgrade-shop"
          >
            <Sparkles size={13} />
            <span>Fund Expansion to Tier {shopTier + 1}</span>
          </button>
        )}
      </div>

    </div>
  );
};
