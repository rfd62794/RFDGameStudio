/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Newspaper, HelpCircle, TrendingUp, TrendingDown, ArrowRight, Activity, Flame } from 'lucide-react';
import { Category, MarketState } from '../types';

interface MarketPanelProps {
  market: Record<Category, MarketState>;
  news: {
    message: string;
    category: Category | null;
    trend: 'boom' | 'bust' | null;
  } | null;
}

export const MarketPanel: React.FC<MarketPanelProps> = ({ market, news }) => {
  
  const getVolatilityBadge = (volatility: 'low' | 'moderate' | 'high') => {
    switch (volatility) {
      case 'high':
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 animate-pulse">
            <Flame size={10} /> Wild Volatility
          </span>
        );
      case 'moderate':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded uppercase">
            Moderate
          </span>
        );
      case 'low':
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded uppercase">
            Stable
          </span>
        );
    }
  };

  // Render tiny CSS block sparklines
  const renderSparkline = (history: number[]) => {
    if (!history || history.length === 0) return null;
    
    // Find min and max to scale nicely
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-[3px] h-6 w-16 bg-slate-50 border border-slate-200 p-0.5 rounded shrink-0 shadow-inner" title="5-Day Price Index Trend">
        {history.map((val, idx) => {
          // Calculate percentage height
          const percent = ((val - min) / range) * 80 + 20; // 20% to 100% height
          
          // Determine color based on trend
          let color = "bg-slate-400";
          if (idx > 0) {
            if (val > history[idx - 1]) {
              color = "bg-emerald-500";
            } else if (val < history[idx - 1]) {
              color = "bg-rose-500";
            }
          }

          return (
            <div 
              key={idx} 
              className={`w-full rounded-t-sm transition-all duration-300 ${color}`}
              style={{ height: `${percent}%` }}
              title={`x${val.toFixed(2)}`}
            ></div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-4 h-full" id="market-panel">
      {/* News Flash Ticker */}
      <div className="border-2 border-slate-800 rounded-lg p-3 bg-slate-50 shadow-inner relative overflow-hidden" id="news-flash-ticker">
        {/* News label */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
          <Newspaper size={14} className="text-indigo-600" />
          <span>Macroeconomic Ledger News</span>
          <span className="absolute top-1.5 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        </div>

        {news ? (
          <div>
            <p className="text-xs text-slate-700 italic leading-relaxed font-sans font-medium">
              "{news.message}"
            </p>
            {news.category && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Affected Category:</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  news.trend === 'boom' 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}>
                  {news.category} ({news.trend === 'boom' ? 'BOOM' : 'BUST'})
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-mono">
            No active news reports. Market remains in steady drift state.
          </p>
        )}
      </div>

      {/* Volatile Market Indexes */}
      <div>
        <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-slate-200">
          <h3 className="font-display text-sm font-bold text-slate-950 flex items-center gap-1.5">
            <Activity size={14} className="text-slate-800" />
            <span>Resale Price Indices</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Baseline is x1.00</span>
        </div>

        <div className="space-y-2.5">
          {(Object.values(market) as MarketState[]).map((state) => {
            const isBoomAffected = news?.category === state.category && news?.trend === 'boom';
            const isBustAffected = news?.category === state.category && news?.trend === 'bust';
            
            // Check trend direction from last price
            const history = state.driftHistory;
            const isTrendingUp = history.length > 1 && history[history.length - 1] >= history[history.length - 2];
            
            return (
              <div 
                key={state.category}
                className={`p-2 rounded-lg border-2 flex items-center justify-between gap-3 transition-colors ${
                  isBoomAffected 
                    ? 'bg-emerald-50 border-emerald-600' 
                    : isBustAffected 
                    ? 'bg-rose-50 border-rose-600' 
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
                id={`market-idx-${state.category.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {/* Info and Category */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-display font-bold text-slate-900 text-xs truncate">
                      {state.category}
                    </span>
                    {getVolatilityBadge(state.volatility)}
                  </div>
                  
                  {/* Price Suppression alert */}
                  {state.suppressionDaysRemaining > 0 ? (
                    <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-amber-600 font-bold uppercase animate-pulse">
                      <span>⚠️ Suppressed ({-((1 - state.suppressionFactor) * 100).toFixed(0)}%) — {state.suppressionDaysRemaining}d left</span>
                    </div>
                  ) : (
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                      Healthy supply & demand
                    </p>
                  )}
                </div>

                {/* Sparkline trend */}
                {renderSparkline(state.driftHistory)}

                {/* Multiplier Valuation */}
                <div className="text-right shrink-0">
                  <div className={`font-mono font-bold text-sm flex items-center gap-0.5 justify-end ${
                    isBoomAffected 
                      ? 'text-emerald-700 text-base' 
                      : isBustAffected 
                      ? 'text-rose-700 text-base' 
                      : isTrendingUp 
                      ? 'text-emerald-600' 
                      : 'text-rose-600'
                  }`}>
                    {isTrendingUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>x{state.currentPriceMultiplier.toFixed(2)}</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 uppercase font-semibold">
                    Current Index
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>
      
      {/* Market rule memo */}
      <div className="mt-auto bg-indigo-50 border border-indigo-200 rounded p-2.5 text-[10px] font-mono text-indigo-800 leading-normal">
        <strong className="uppercase block mb-0.5">Appraisal Rulebook:</strong>
        Selling any item instantly triggers **Sales Pressure** on its category, suppressing prices by **15-20%** for 2 days. Diversify liquidations to maximize capital yield!
      </div>
    </div>
  );
};
