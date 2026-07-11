/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Eye, User, Gavel, AlertTriangle, ShieldCheck, HelpCircle, Ban, ArrowDown, ChevronRight, Users } from 'lucide-react';
import { Lot, Category } from '../types';
import { formatCurrency, getInspectionDetailText } from '../utils';

interface LotsPanelProps {
  lots: Lot[];
  capital: number;
  isDayActive: boolean;
  isInventoryFull: boolean;
  onBuyLot: (lotId: string) => void;
  onDeclineLot: (lotId: string) => void;
  onInspectLot: (lotId: string) => void;
}

export const LotsPanel: React.FC<LotsPanelProps> = ({
  lots,
  capital,
  isDayActive,
  isInventoryFull,
  onBuyLot,
  onDeclineLot,
  onInspectLot,
}) => {

  const getCategoryBadgeColor = (category: Category) => {
    switch (category) {
      case Category.FINE_ART:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case Category.VINTAGE_WATCHES:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case Category.RARE_BOOKS:
        return "bg-amber-100 text-amber-800 border-amber-200";
      case Category.ANCIENT_COINS:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case Category.COLLECTIBLES:
        return "bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getQualityBadgeColor = (quality: 'poor' | 'fair' | 'pristine') => {
    switch (quality) {
      case 'pristine': return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 'fair': return "bg-slate-100 text-slate-700 border-slate-200";
      case 'poor': return "bg-rose-100 text-rose-800 border-rose-200";
    }
  };

  return (
    <div className="bg-white border-2 border-slate-800 rounded-xl p-4 shadow-sm h-full" id="lots-panel">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
        <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Daily Acquisition Board</span>
          {lots.length > 0 && (
            <span className="font-mono text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
              {lots.length} lot{lots.length > 1 ? 's' : ''} active
            </span>
          )}
        </h2>
        {isInventoryFull && (
          <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded animate-pulse">
            Inventory Full
          </span>
        )}
      </div>

      {lots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50 border border-dashed border-slate-300 rounded-lg h-56">
          <p className="text-sm font-mono text-slate-500 font-bold uppercase tracking-wider">Board Cleared</p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">
            All of today's walk-ins have departed and auctions have closed. Pause and end the day to receive tomorrow's lots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lots.map((lot) => {
            const isAffordable = capital >= lot.askingPrice;
            const qualityMultiplier = lot.good.quality === 'pristine' ? 1.4 : lot.good.quality === 'poor' ? 0.7 : 1.0;
            const estimateMin = Math.round(lot.good.baseValue * qualityMultiplier * 0.85);
            const estimateMax = Math.round(lot.good.baseValue * qualityMultiplier * 1.15);

            return (
              <div 
                key={lot.id} 
                className={`border-2 rounded-xl flex flex-col justify-between overflow-hidden shadow-sm transition-all duration-300 bg-white ${
                  lot.type === 'dutch_auction' 
                    ? 'border-indigo-600 hover:border-indigo-800 ring-1 ring-indigo-500/10' 
                    : 'border-slate-700 hover:border-slate-900'
                }`}
                id={`lot-card-${lot.id}`}
              >
                {/* Header Banner */}
                <div className={`p-2.5 flex items-center justify-between text-xs font-mono font-bold tracking-tight text-white ${
                  lot.type === 'dutch_auction' ? 'bg-indigo-600' : 'bg-slate-700'
                }`}>
                  <div className="flex items-center gap-1.5 uppercase">
                    {lot.type === 'dutch_auction' ? (
                      <>
                        <Gavel size={14} className="animate-bounce" />
                        <span>Dutch Auction</span>
                      </>
                    ) : (
                      <>
                        <User size={14} />
                        <span>Walk-in Client</span>
                      </>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[10px] ${getCategoryBadgeColor(lot.good.category)}`}>
                    {lot.good.category}
                  </span>
                </div>

                {/* Body Details */}
                <div className="p-3.5 flex-1">
                  {/* Name and Quality */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-slate-900 text-sm md:text-base leading-tight">
                      {lot.good.name}
                    </h3>
                    <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${getQualityBadgeColor(lot.good.quality)}`}>
                      {lot.good.quality}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {lot.good.description}
                  </p>

                  {/* Pricing / Appraisal Status Section */}
                  <div className="mt-4 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-200 pb-1.5 mb-1.5">
                      <span>Appraisal State</span>
                      {lot.good.isInspected ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold uppercase">
                          <ShieldCheck size={12} /> Appraised
                        </span>
                      ) : lot.isInspecting ? (
                        <span className="text-amber-700 font-bold animate-pulse flex items-center gap-1 uppercase">
                          <Eye size={12} /> Appraising...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400 font-bold uppercase">
                          <HelpCircle size={12} /> Raw Lot
                        </span>
                      )}
                    </div>

                    {/* Appraised details or vague estimates */}
                    {lot.good.isInspected ? (
                      <div className="text-xs">
                        <div className="font-mono font-bold text-slate-800">
                          {getInspectionDetailText(lot.good)}
                        </div>
                        <div className="flex justify-between text-slate-500 mt-1.5 font-mono text-[10px]">
                          <span>Standard Valuation:</span>
                          <span className="font-bold text-slate-700">{formatCurrency(Math.round(lot.good.baseValue * qualityMultiplier))}</span>
                        </div>
                      </div>
                    ) : lot.isInspecting ? (
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                          <div 
                            className="h-full bg-amber-500 transition-all duration-100 ease-linear"
                            style={{ width: `${lot.inspectProgress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <span>Holding item under glass...</span>
                          <span>{Math.round(lot.inspectProgress)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-slate-400">Rough Appraisal:</span>
                        <span className="font-bold text-slate-700">{formatCurrency(estimateMin)} - {formatCurrency(estimateMax)}</span>
                      </div>
                    )}
                  </div>

                  {/* Ticking Indicators */}
                  <div className="mt-4 space-y-2">
                    {lot.type === 'dutch_auction' ? (
                      <div className="space-y-1">
                        {/* Rival Interest Bar */}
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Users size={12} className="text-indigo-600" />
                            Rival Interest
                          </span>
                          <span className={`font-bold ${lot.rivalInterest > 75 ? 'text-rose-600 animate-pulse' : 'text-slate-600'}`}>
                            {Math.round(lot.rivalInterest)}% {lot.rivalInterest > 75 ? '(SNIPING SOON!)' : ''}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                          <div 
                            className={`h-full transition-all duration-300 ${lot.rivalInterest > 75 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`}
                            style={{ width: `${lot.rivalInterest}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <span>First to claim gets the lot</span>
                          <span>Floor: {formatCurrency(lot.auctionFloorPrice)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {/* Client Patience Bar */}
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500">Client Patience</span>
                          <span className={`font-bold ${lot.patience < 30 ? 'text-rose-600 animate-pulse' : 'text-slate-600'}`}>
                            {Math.round(lot.patience)}% {lot.patience < 30 ? '(Leaving shortly!)' : ''}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                          <div 
                            className={`h-full transition-all duration-300 ${lot.patience < 30 ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`}
                            style={{ width: `${lot.patience}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-wrap gap-2 items-center justify-between">
                  {/* Asking Price / Cost */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      {lot.type === 'dutch_auction' ? 'Current Price' : 'Asking Price'}
                    </span>
                    <span className={`font-mono font-bold text-lg leading-none mt-1 flex items-center gap-1 ${
                      lot.type === 'dutch_auction' ? 'text-indigo-700 animate-pulse' : 'text-slate-800'
                    }`}>
                      {lot.type === 'dutch_auction' && <ArrowDown size={14} className="text-indigo-500" />}
                      {formatCurrency(lot.askingPrice)}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Decline / Pull */}
                    {lot.type === 'walk_in' && (
                      <button
                        onClick={() => onDeclineLot(lot.id)}
                        disabled={lot.isInspecting}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-300 hover:border-rose-200 uppercase font-mono text-[10px] font-bold tracking-tight disabled:opacity-50"
                        title="Decline and turn client away"
                        id={`btn-decline-${lot.id}`}
                      >
                        <Ban size={14} />
                      </button>
                    )}

                    {/* Appraise / Inspect */}
                    {!lot.good.isInspected && (
                      <button
                        onClick={() => onInspectLot(lot.id)}
                        disabled={!isDayActive || lot.isInspecting}
                        className={`px-2 py-1.5 font-mono text-[10px] font-bold uppercase rounded border transition-all ${
                          lot.isInspecting 
                            ? 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse' 
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        } disabled:opacity-50`}
                        title="Requires the day ticker to be active"
                        id={`btn-inspect-${lot.id}`}
                      >
                        {lot.isInspecting ? 'Appraising...' : 'Appraise'}
                      </button>
                    )}

                    {/* Buy Lot */}
                    <button
                      onClick={() => onBuyLot(lot.id)}
                      disabled={!isAffordable || isInventoryFull || lot.isInspecting}
                      className={`flex items-center gap-1 px-3.5 py-1.5 rounded font-mono font-bold text-[11px] uppercase transition-all shadow-sm ${
                        isAffordable && !isInventoryFull && !lot.isInspecting
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
                          : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                      }`}
                      id={`btn-buy-${lot.id}`}
                    >
                      <span>Acquire</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
