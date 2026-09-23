/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Trash2, ShieldCheck, ShieldAlert, ShieldQuestion, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { Good, Category, MarketState } from '../types';
import { formatCurrency } from '../utils';

interface InventoryPanelProps {
  inventory: Good[];
  market: Record<Category, MarketState>;
  shopCapacity: number;
  onSellItem: (goodId: string) => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  inventory,
  market,
  shopCapacity,
  onSellItem,
}) => {

  const getQualityBadgeColor = (quality: 'poor' | 'fair' | 'pristine') => {
    switch (quality) {
      case 'pristine': return "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold";
      case 'fair': return "bg-slate-100 text-slate-700 border-slate-200";
      case 'poor': return "bg-rose-100 text-rose-800 border-rose-200";
    }
  };

  const getCategoryBadgeColor = (category: Category) => {
    switch (category) {
      case Category.FINE_ART: return "bg-purple-50 text-purple-700 border-purple-200";
      case Category.VINTAGE_WATCHES: return "bg-blue-50 text-blue-700 border-blue-200";
      case Category.RARE_BOOKS: return "bg-amber-50 text-amber-700 border-amber-200";
      case Category.ANCIENT_COINS: return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case Category.COLLECTIBLES: return "bg-rose-50 text-rose-700 border-rose-200 font-semibold";
    }
  };

  return (
    <div className="bg-white border-2 border-slate-800 rounded-xl p-4 shadow-sm h-full" id="inventory-panel">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Shop Storage</span>
            <span className="font-mono text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full">
              {inventory.length}/{shopCapacity} Slots
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Physical shelf capacity. Expand shop to increase slots.
          </p>
        </div>

        {/* Space Gauge */}
        <div className="w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-300 relative">
          <div 
            className={`h-full transition-all duration-300 ${
              inventory.length === shopCapacity 
                ? 'bg-rose-500 animate-pulse' 
                : inventory.length > shopCapacity * 0.75 
                ? 'bg-amber-500' 
                : 'bg-emerald-500'
            }`}
            style={{ width: `${(inventory.length / shopCapacity) * 100}%` }}
          ></div>
        </div>
      </div>

      {inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50 border border-dashed border-slate-300 rounded-lg h-64">
          <Scale size={24} className="text-slate-300 mb-2" />
          <p className="text-sm font-mono text-slate-400 font-bold uppercase tracking-wider">Storage Empty</p>
          <p className="text-xs text-slate-400 mt-2 max-w-xs">
            Acquire lots from the trade board. Keep an eye on market trends before committing your capital.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item) => {
            const marketState = market[item.category];
            const qualityMultiplier = item.quality === 'pristine' ? 1.4 : item.quality === 'poor' ? 0.7 : 1.0;
            
            // Expected payout calculation
            const baseValue = item.baseValue * qualityMultiplier * marketState.currentPriceMultiplier * marketState.suppressionFactor;
            
            let payoutText = "";
            let netProfit = 0;
            let statusRibbon = null;

            if (item.isInspected) {
              if (item.authenticity === 'counterfeit') {
                // If appraised counterfeit, payout is scrap ($10 - $60 range)
                const scrapVal = Math.min(60, Math.round(baseValue * 0.08));
                netProfit = scrapVal - item.acquiredPrice;
                payoutText = formatCurrency(scrapVal);
                statusRibbon = (
                  <div className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded flex items-center gap-1 font-bold text-[10px] uppercase">
                    <ShieldAlert size={12} /> Counterfeit
                  </div>
                );
              } else {
                // Appraised authentic
                const finalVal = Math.round(baseValue);
                netProfit = finalVal - item.acquiredPrice;
                payoutText = formatCurrency(finalVal);
                statusRibbon = (
                  <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1 font-bold text-[10px] uppercase">
                    <ShieldCheck size={12} /> Verified
                  </div>
                );
              }
            } else {
              // Uninspected
              const standardVal = Math.round(baseValue);
              netProfit = standardVal - item.acquiredPrice;
              payoutText = `~${formatCurrency(standardVal)}`;
              statusRibbon = (
                <div className="bg-slate-100 text-slate-500 border border-slate-300 px-2 py-0.5 rounded flex items-center gap-1 font-bold text-[10px] uppercase">
                  <ShieldQuestion size={12} /> Uninspected
                </div>
              );
            }

            const isProfit = netProfit >= 0;

            return (
              <div 
                key={item.id}
                className="border-2 border-slate-700 rounded-xl flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md hover:border-slate-900 transition-all bg-white"
                id={`inventory-card-${item.id}`}
              >
                {/* Header info */}
                <div className="bg-slate-800 text-white p-2.5 flex items-center justify-between text-xs font-mono font-bold">
                  <span className={`px-2 py-0.5 rounded border text-[9px] uppercase tracking-tight ${getCategoryBadgeColor(item.category)}`}>
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400">Day {item.acquiredDay} purchase</span>
                </div>

                {/* Content */}
                <div className="p-3.5 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-display font-bold text-slate-900 text-sm leading-tight line-clamp-1">
                      {item.name}
                    </h3>
                    <span className={`text-[9px] font-mono uppercase px-1 rounded border shrink-0 ${getQualityBadgeColor(item.quality)}`}>
                      {item.quality}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px] font-bold">Paid Cost</span>
                      <span className="text-slate-700 font-bold">{formatCurrency(item.acquiredPrice)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px] font-bold">Market Price</span>
                      <span className="text-slate-700 font-bold">x{marketState.currentPriceMultiplier.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Appraisal Status ribbon bar */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-b border-slate-100 py-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Appraisal</span>
                    {statusRibbon}
                  </div>

                  {/* Net margin projected estimation */}
                  <div className="mt-3.5 p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between font-mono text-xs">
                    <div className="text-left">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Resale Valuation</span>
                      <span className="font-bold text-slate-900 text-sm">{payoutText}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Est. Net Profit</span>
                      <span className={`font-bold text-xs flex items-center gap-0.5 justify-end ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isProfit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {isProfit ? '+' : '-'}{formatCurrency(Math.abs(netProfit))}
                      </span>
                    </div>
                  </div>
                  
                  {!item.isInspected && (
                    <p className="text-[9px] font-mono text-rose-600 font-medium text-center mt-2 animate-pulse bg-rose-50 border border-rose-100 py-0.5 rounded">
                      ⚠️ Counterfeit risk! Buyer will audit upon sale.
                    </p>
                  )}
                </div>

                {/* Sell Action Footer */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={() => onSellItem(item.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 border-2 border-slate-800 bg-white hover:bg-slate-800 hover:text-white text-slate-800 font-mono font-bold text-xs rounded uppercase tracking-wide transition-all shadow-sm"
                    id={`btn-sell-${item.id}`}
                  >
                    <span>Liquidate Lot</span>
                  </button>
                  {marketState.suppressionDaysRemaining > 0 && (
                    <p className="text-[9px] font-mono text-amber-600 text-center mt-1">
                      Category under price pressure (-{( (1 - marketState.suppressionFactor) * 100 ).toFixed(0)}%)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
