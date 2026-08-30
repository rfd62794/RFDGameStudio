/**
 * @file src/components/NightScreen.tsx
 * Dedicated Night Phase UI screen featuring Day Recap stats, Cash total formatting,
 * and the relocated Policy Dial controls.
 */

import React from 'react';
import { KitchenState } from '../types';
import { Moon, DollarSign, Award, Zap, CheckCircle2, Play, ShoppingBag, AlertTriangle, Package, ShieldCheck, Clock, HeartHandshake, Flame } from 'lucide-react';
import {
  UPGRADE_BUFFER_CAPACITY_COST,
  UPGRADE_STOCK_CAPACITY_COST,
  UPGRADE_DAY_DURATION_COST,
  UPGRADE_BRAND_RECOVERY_COST,
  UPGRADE_FRIES_UNLOCK_COST,
  BRAND_RECOVERY_AMOUNT,
  BUFFER_CAPACITY_INCREASE,
  STOCK_CAPACITY_INCREASE,
  DAY_DURATION_INCREASE_SECONDS,
  WEEK_ONE_TIER_UP_MESSAGE,
  FRIES_UNLOCK_MIN_DAY,
  BASIC_UPGRADES_MIN_DAY,
} from '../data';
import {
  purchaseBrandRecovery,
  purchaseBufferCapacity,
  purchaseDayDuration,
  purchaseFriesUnlock,
  purchaseStockCapacity,
} from '../nightShop';

export function getTierUpMessage(storeTier: number): string {
  return storeTier === 2
    ? WEEK_ONE_TIER_UP_MESSAGE
    : `Week Survived — Tier ${storeTier} Unlocked`;
}

export function isNewThisNight(
  shopItemsEverAvailable: Record<string, boolean> | undefined,
  itemKey: string,
  currentlyAvailable: boolean
): boolean {
  if (!currentlyAvailable) return false;
  const wasSeenBefore = shopItemsEverAvailable?.[itemKey];
  return !wasSeenBefore;
}

interface NightScreenProps {
  state: KitchenState;
  onUpdatePolicy: (policy: number) => void;
  onStartNextDay: () => void;
  onPurchaseUpgrade?: (upgradeType: 'buffer_capacity' | 'stock_capacity' | 'day_duration' | 'brand_recovery' | 'fries_unlock') => void;
}

export const NightScreen: React.FC<NightScreenProps> = ({
  state,
  onUpdatePolicy,
  onStartNextDay,
  onPurchaseUpgrade,
}) => {
  const policyPercent = Math.round(state.policyDial * 100);

  const shopItemsEverAvailable = state.shopItemsEverAvailable || {};

  const friesAvailable = !state.unlockedStations?.fryer && state.dayNumber >= FRIES_UNLOCK_MIN_DAY;
  const bufferAvailable = !state.purchasedUpgrades?.buffer_capacity && state.dayNumber >= BASIC_UPGRADES_MIN_DAY;
  const stockAvailable = !state.purchasedUpgrades?.stock_capacity && state.dayNumber >= BASIC_UPGRADES_MIN_DAY;
  const durationAvailable = !state.purchasedUpgrades?.day_duration && state.dayNumber >= BASIC_UPGRADES_MIN_DAY;
  const brandAvailable = state.brandEquity < 100;

  const isFriesNew = isNewThisNight(shopItemsEverAvailable, 'fries_unlock', friesAvailable);
  const isBufferNew = isNewThisNight(shopItemsEverAvailable, 'buffer_capacity', bufferAvailable);
  const isStockNew = isNewThisNight(shopItemsEverAvailable, 'stock_capacity', stockAvailable);
  const isDurationNew = isNewThisNight(shopItemsEverAvailable, 'day_duration', durationAvailable);
  const isBrandNew = isNewThisNight(shopItemsEverAvailable, 'brand_recovery', brandAvailable);

  React.useEffect(() => {
    if (!state.shopItemsEverAvailable) {
      state.shopItemsEverAvailable = {};
    }
    if (friesAvailable) state.shopItemsEverAvailable['fries_unlock'] = true;
    if (bufferAvailable) state.shopItemsEverAvailable['buffer_capacity'] = true;
    if (stockAvailable) state.shopItemsEverAvailable['stock_capacity'] = true;
    if (durationAvailable) state.shopItemsEverAvailable['day_duration'] = true;
    if (brandAvailable) state.shopItemsEverAvailable['brand_recovery'] = true;
  }, [friesAvailable, bufferAvailable, stockAvailable, durationAvailable, brandAvailable, state]);

  const handlePurchase = (type: 'buffer_capacity' | 'stock_capacity' | 'day_duration' | 'brand_recovery' | 'fries_unlock') => {
    if (onPurchaseUpgrade) {
      onPurchaseUpgrade(type);
    } else {
      if (type === 'buffer_capacity') purchaseBufferCapacity(state);
      else if (type === 'stock_capacity') purchaseStockCapacity(state);
      else if (type === 'day_duration') purchaseDayDuration(state);
      else if (type === 'brand_recovery') purchaseBrandRecovery(state);
      else if (type === 'fries_unlock') purchaseFriesUnlock(state);
    }
  };

  let policyDescription = 'Strict Protocol — High safety & compliance, moderate throughput.';
  if (state.policyDial > 0.7) {
    policyDescription = 'Max Throughput — Rushed pace heavily encouraging workers to cut corners!';
  } else if (state.policyDial > 0.3) {
    policyDescription = 'Balanced Operations — Equal weight on speed and safety standard compliance.';
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 lg:p-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-2xl font-black">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {(state.dayNumber - 1) % 7 === 0 && state.dayNumber > 1
                  ? getTierUpMessage(state.storeTier)
                  : state.dayNumber === 1
                  ? 'First Shift Setup • Day 1'
                  : `Shift Complete • Preparing Day ${state.dayNumber}`}
              </div>
              <h2 className="text-2xl font-black text-white">Night Phase & Day Setup</h2>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Current Cash</span>
              <span className="text-emerald-400 font-bold text-lg flex items-center">
                <DollarSign className="w-4 h-4" />
                {state.cash.toFixed(2)}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-sans">Brand Equity</span>
              <span className="text-purple-400 font-bold text-lg">
                {Math.max(0, state.brandEquity).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Day Recap Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            {state.dayNumber > 1 ? `Day ${state.dayNumber - 1} Operations Recap` : 'Pre-Shift Overview'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" /> Orders Served
              </div>
              <div className="text-xl font-mono font-bold text-emerald-400">
                {state.ordersServed}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Protocols
              </div>
              <div className="text-xl font-mono font-bold text-blue-400">
                {state.totalProtocolTasks}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Corner-Cuts
              </div>
              <div className="text-xl font-mono font-bold text-amber-400">
                {state.totalCornerCutsTaken}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Abandoned
              </div>
              <div className="text-xl font-mono font-bold text-rose-400">
                {state.totalAbandonedOrders}
              </div>
            </div>
          </div>
        </div>

        {/* Daily P&L Statement */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            {state.dayNumber > 1 ? `Day ${state.dayNumber - 1} P&L Statement` : 'Daily P&L Statement'}
          </h3>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-sans text-xs text-slate-400">Revenue (Orders Served)</span>
              <span className="font-bold text-emerald-400">+${(state.cashEarnedToday || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-sans text-xs text-slate-400">Tips Earned</span>
              <span className="font-bold text-emerald-300">+${(state.tipsEarnedToday || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-sans text-xs text-slate-400">Restock Cost (Stock Truck)</span>
              <span className="font-bold text-rose-400">-${(state.cashSpentToday || 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-base font-bold">
              <span className="font-sans text-xs text-slate-200 uppercase tracking-wider">Net Profit / Loss</span>
              {((state.cashEarnedToday || 0) - (state.cashSpentToday || 0)) >= 0 ? (
                <span className="text-emerald-400">+${((state.cashEarnedToday || 0) - (state.cashSpentToday || 0)).toFixed(2)}</span>
              ) : (
                <span className="text-rose-400">-${Math.abs((state.cashEarnedToday || 0) - (state.cashSpentToday || 0)).toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Policy Dial Configurator */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Policy Dial Configurator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set policy expectation for upcoming shift.
              </p>
            </div>
            <span className="font-mono font-bold text-lg text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-lg">
              {policyPercent}% Throughput
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.policyDial}
              onChange={(e) => onUpdatePolicy(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>0.0 (Strict Protocol)</span>
              <span>0.5 (Balanced)</span>
              <span>1.0 (Max Throughput)</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 italic">
            "{policyDescription}"
          </p>
        </div>

        {/* Night Shop */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Night Equipment & Recovery Shop
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reinvest earnings into permanent station upgrades or public relations recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Featured Menu Expansion: Fryer Station */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between col-span-1 sm:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    Menu Expansion • Tier 1
                    {isFriesNew && (
                      <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    Unlock French Fries Station
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Constructs Fryer station & enables side item orders on future shifts.
                  </div>
                </div>
              </div>
              {state.unlockedStations?.fryer ? (
                <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1.5 rounded-lg border border-amber-800/60">
                  Unlocked
                </span>
              ) : state.dayNumber < FRIES_UNLOCK_MIN_DAY ? (
                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  Unlocks Day {FRIES_UNLOCK_MIN_DAY}
                </span>
              ) : (
                <button
                  onClick={() => handlePurchase('fries_unlock')}
                  disabled={state.cash < UPGRADE_FRIES_UNLOCK_COST}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs rounded-lg transition cursor-pointer disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
                >
                  ${UPGRADE_FRIES_UNLOCK_COST}
                </button>
              )}
            </div>

            {/* Upgrade 1: Buffer Capacity */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Buffer Expansion
                  {isBufferNew && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  +{BUFFER_CAPACITY_INCREASE} Capacity (Grill/Assembly/Fryer)
                </div>
              </div>
              {state.purchasedUpgrades?.buffer_capacity ? (
                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  Owned
                </span>
              ) : state.dayNumber < BASIC_UPGRADES_MIN_DAY ? (
                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  Unlocks Day {BASIC_UPGRADES_MIN_DAY}
                </span>
              ) : (
                <button
                  onClick={() => handlePurchase('buffer_capacity')}
                  disabled={state.cash < UPGRADE_BUFFER_CAPACITY_COST}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded transition cursor-pointer disabled:cursor-not-allowed"
                >
                  ${UPGRADE_BUFFER_CAPACITY_COST}
                </button>
              )}
            </div>

            {/* Upgrade 2: Stock Capacity */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-400" /> Stock Capacity
                  {isStockNew && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  +{STOCK_CAPACITY_INCREASE} Ingredient Storage Capacity
                </div>
              </div>
              {state.purchasedUpgrades?.stock_capacity ? (
                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  Owned
                </span>
              ) : state.dayNumber < BASIC_UPGRADES_MIN_DAY ? (
                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  Unlocks Day {BASIC_UPGRADES_MIN_DAY}
                </span>
              ) : (
                <button
                  onClick={() => handlePurchase('stock_capacity')}
                  disabled={state.cash < UPGRADE_STOCK_CAPACITY_COST}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded transition cursor-pointer disabled:cursor-not-allowed"
                >
                  ${UPGRADE_STOCK_CAPACITY_COST}
                </button>
              )}
            </div>

            {/* Upgrade 3: Day Duration */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Extended Shift
                  {isDurationNew && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  +{DAY_DURATION_INCREASE_SECONDS}s Extended Day Duration
                </div>
              </div>
              {state.purchasedUpgrades?.day_duration ? (
                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  Owned
                </span>
              ) : state.dayNumber < BASIC_UPGRADES_MIN_DAY ? (
                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  Unlocks Day {BASIC_UPGRADES_MIN_DAY}
                </span>
              ) : (
                <button
                  onClick={() => handlePurchase('day_duration')}
                  disabled={state.cash < UPGRADE_DAY_DURATION_COST}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded transition cursor-pointer disabled:cursor-not-allowed"
                >
                  ${UPGRADE_DAY_DURATION_COST}
                </button>
              )}
            </div>

            {/* Upgrade 4: Brand Recovery (Repeatable) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-purple-400" /> Brand Recovery
                  {isBrandNew && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  +{BRAND_RECOVERY_AMOUNT}% Brand Equity (Repeatable)
                </div>
              </div>
              <button
                onClick={() => handlePurchase('brand_recovery')}
                disabled={state.cash < UPGRADE_BRAND_RECOVERY_COST || state.brandEquity >= 100}
                className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded transition cursor-pointer disabled:cursor-not-allowed"
              >
                ${UPGRADE_BRAND_RECOVERY_COST}
              </button>
            </div>
          </div>
        </div>

        {/* Start Next Day Button */}
        <button
          onClick={onStartNextDay}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-lg shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Start Day {state.dayNumber}</span>
        </button>
      </div>
    </div>
  );
};
