/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, Sun, Moon, Landmark, Wallet, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { formatCurrency } from '../utils';

interface HeaderProps {
  day: number;
  timeOfDay: number;
  capital: number;
  debt: number;
  graceDaysRemaining: number;
  isDayActive: boolean;
  shopTier: number;
  onTogglePause: () => void;
  onAdvanceDay: () => void;
  onOpenTutorial: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  day,
  timeOfDay,
  capital,
  debt,
  graceDaysRemaining,
  isDayActive,
  shopTier,
  onTogglePause,
  onAdvanceDay,
  onOpenTutorial,
}) => {
  const netWorth = capital - debt;
  const isGracePeriod = graceDaysRemaining > 0;
  
  // Shop tier labels
  const getTierName = (tier: number) => {
    switch (tier) {
      case 1: return "Alley Stall";
      case 2: return "Storefront";
      case 3: return "Boutique";
      default: return "Alley Stall";
    }
  };

  return (
    <header className="border-b-2 border-slate-800 bg-white p-4 font-sans text-slate-800 shadow-sm" id="ledger-header">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Title and Identity */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>L E D G E R</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-500 uppercase tracking-widest">
                v1.0 SPA
              </span>
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              Proprietor: {getTierName(shopTier)} (Tier {shopTier})
            </p>
          </div>
          <button 
            onClick={onOpenTutorial}
            className="md:hidden flex items-center justify-center p-2 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-600"
            title="How to Play"
            id="btn-tutorial-mobile"
          >
            <Info size={18} />
          </button>
        </div>

        {/* Real-time Ticking Clock & Status */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider">Day</span>
            <span className="font-display text-xl font-bold text-slate-900">{day}/10</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-200"></div>

          {/* Progress Bar Clock */}
          <div className="flex items-center gap-2 flex-1 min-w-[120px] md:flex-none md:w-44">
            <Sun className={`text-amber-500 shrink-0 ${isDayActive ? 'animate-spin-slow' : ''}`} size={16} />
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
              <div 
                className="h-full bg-amber-500 transition-all duration-300 ease-linear"
                style={{ width: `${timeOfDay}%` }}
              ></div>
            </div>
            <Moon className="text-indigo-600 shrink-0" size={16} />
          </div>

          <div className="h-6 w-[1px] bg-slate-200"></div>

          {/* Time Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePause}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold border rounded uppercase transition-colors shadow-sm ${
                isDayActive 
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
              }`}
              id="btn-pause-play"
            >
              {isDayActive ? (
                <>
                  <Pause size={12} fill="currentColor" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" />
                  <span>Trade</span>
                </>
              )}
            </button>

            <button
              onClick={onAdvanceDay}
              className="px-2 py-1 text-xs font-mono font-bold border border-slate-800 hover:bg-slate-800 hover:text-white rounded uppercase transition-colors shadow-sm"
              id="btn-close-day"
            >
              End Day
            </button>
          </div>
        </div>

        {/* Financial Accounts Ledger */}
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          {/* Capital */}
          <div className="flex-1 min-w-[110px] bg-slate-50 border border-slate-200 p-2 rounded-lg" id="ledger-capital">
            <div className="flex items-center gap-1 text-slate-500">
              <Wallet size={13} className="text-emerald-600" />
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Cash Assets</span>
            </div>
            <div className="font-mono text-lg font-bold text-emerald-700 mt-0.5">
              {formatCurrency(capital)}
            </div>
          </div>

          {/* Debt */}
          <div className="flex-1 min-w-[110px] bg-slate-50 border border-slate-200 p-2 rounded-lg" id="ledger-debt">
            <div className="flex items-center gap-1 text-slate-500 justify-between">
              <div className="flex items-center gap-1">
                <Landmark size={13} className="text-rose-600" />
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Lender Debt</span>
              </div>
              {isGracePeriod && (
                <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-bold px-1 rounded border border-amber-200 uppercase scale-90">
                  Grace
                </span>
              )}
            </div>
            <div className="font-mono text-lg font-bold text-rose-700 mt-0.5 flex items-center justify-between">
              <span>{formatCurrency(debt)}</span>
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">
              {isGracePeriod 
                ? `${graceDaysRemaining} day${graceDaysRemaining > 1 ? 's' : ''} grace left` 
                : '10% compounded daily'}
            </div>
          </div>

          {/* Net Balance */}
          <div className="flex-1 min-w-[110px] bg-slate-50 border border-slate-200 p-2 rounded-lg" id="ledger-net-worth">
            <div className="flex items-center gap-1 text-slate-500">
              <TrendingUp size={13} className={netWorth >= 0 ? 'text-blue-600' : 'text-slate-400'} />
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Net Valuation</span>
            </div>
            <div className={`font-mono text-lg font-bold mt-0.5 ${netWorth >= 0 ? 'text-blue-700' : 'text-slate-500'}`}>
              {netWorth < 0 ? '-' : ''}{formatCurrency(Math.abs(netWorth))}
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">
              Goal: repay debt ($0)
            </div>
          </div>

          {/* Desktop Info Button */}
          <button 
            onClick={onOpenTutorial}
            className="hidden md:flex items-center justify-center p-2 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-600 self-center"
            title="How to Play"
            id="btn-tutorial-desktop"
          >
            <Info size={18} />
          </button>
        </div>

      </div>
    </header>
  );
};
