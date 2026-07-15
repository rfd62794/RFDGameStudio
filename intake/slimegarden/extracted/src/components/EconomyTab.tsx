import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, TrendingUp, AlertTriangle, Info, Ship, Check, ArrowRight, X, Sparkles, Database 
} from 'lucide-react';
import { Slime, LabState, CorporateContract, SlimeColor } from '../types';
import { COLOR_SPECS, PATTERN_DESCRIPTIONS, calculateMarketPrice } from '../gameLogic';
import { SlimeVisual } from './SlimeVisual';
import { SpecimenListItem } from './SpecimenListItem';

interface EconomyTabProps {
  key?: any;
  state: LabState;
  handleDeliverContract: (contract: CorporateContract, targetSlime: Slime) => void;
  handleSellOnMarket: (slime: Slime, price: number) => void;
  activeSubTab: 'contracts' | 'market';
  setActiveSubTab: (subTab: 'contracts' | 'market') => void;
}

export function EconomyTab({
  state,
  handleDeliverContract,
  handleSellOnMarket,
  activeSubTab,
  setActiveSubTab
}: EconomyTabProps) {
  // Store the active contract and selected matching slime for confirmation
  const [confirmDelivery, setConfirmDelivery] = useState<{
    contract: CorporateContract;
    slime: Slime;
  } | null>(null);

  // Store the active slime for market sale confirmation
  const [confirmMarketSale, setConfirmMarketSale] = useState<{
    slime: Slime;
    price: number;
    recentCount: number;
  } | null>(null);

  const getRecentSalesCountForColor = (color: SlimeColor): number => {
    if (!state.recentMarketSales) return 0;
    const minCycle = state.cycle - 4;
    return state.recentMarketSales.filter(
      record => record.color === color && record.cycle >= minCycle
    ).length;
  };


  return (
    <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1">
      {/* Sub-tab Sidebar */}
      <div className="md:w-44 shrink-0 flex md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-800/50 pb-4 md:pb-0 md:pr-4">
        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer relative ${
            activeSubTab === 'contracts'
              ? 'bg-slate-800/80 text-white border border-slate-700/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Corp Contracts</span>
          {state.contracts.length > 0 && (
            <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('market')}
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer ${
            activeSubTab === 'market'
              ? 'bg-slate-800/80 text-white border border-slate-700/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Galactic Market</span>
          <span className="ml-auto text-[8px] px-1 bg-slate-900 text-slate-500 rounded font-normal uppercase font-mono tracking-widest border border-slate-800">STUB</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col">
        {activeSubTab === 'contracts' ? (
          <motion.div
            key="sub_contracts"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-4">
              <h2 className="text-base font-bold font-display text-white">Corporate Specifications Directory</h2>
              <p className="text-xs text-slate-400">Incoming black hole communications. Supply matching specimens before expiration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[480px] pr-1">
              {state.contracts.length > 0 ? (
                state.contracts.map((contract) => {
                  // Find all matching idle slimes in the container grids
                  const matchingSlimes = state.slimes.filter(
                    s => s.role === 'idle' && 
                    s.color === contract.requiredColor && 
                    s.pattern === contract.requiredPattern
                  );

                  const hasMatchingSlime = matchingSlimes.length > 0;
                  const specColor = COLOR_SPECS[contract.requiredColor];

                  return (
                    <div 
                      key={contract.id}
                      className="border border-slate-800/85 bg-slate-900/10 rounded-xl p-4 flex flex-col justify-between space-y-3.5 relative hover:border-slate-700 transition-all duration-200"
                    >
                      {/* Expiry Progress Indicator Line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 rounded-t-xl overflow-hidden">
                        <div 
                          className="bg-yellow-500 h-full transition-all"
                          style={{ width: `${(contract.cyclesRemaining / contract.totalCycles) * 100}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-start pt-1">
                        <div>
                          <h3 className="font-mono text-xs font-bold text-white tracking-widest uppercase">{contract.title}</h3>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">⌛ EXPIRES IN {contract.cyclesRemaining} CYCLES</p>
                        </div>
                        <div className="text-right font-mono text-xs text-yellow-400 font-bold bg-yellow-950/25 border border-yellow-500/20 px-2.5 py-0.5 rounded">
                          +{contract.creditsReward} Cr
                        </div>
                      </div>

                      {/* Flavor description */}
                      <div className="text-[10px] text-slate-400 italic bg-slate-950/40 p-2.5 rounded border border-slate-900/50 leading-relaxed font-mono">
                        "{contract.flavorText}"
                      </div>

                      {/* Requirements indicator */}
                      <div className="flex justify-between items-center text-[10px] font-mono border-t border-slate-900 pt-2.5">
                        <span className="text-slate-500 uppercase">SPECIFICATION TARGET:</span>
                        <div className="flex items-center space-x-1.5">
                          <span 
                            className="px-1.5 py-0.5 rounded border font-bold"
                            style={{ 
                              color: specColor.rgb,
                              borderColor: `${specColor.rgb}40`,
                              backgroundColor: `${specColor.rgb}10`
                            }}
                          >
                            {contract.requiredColor}
                          </span>
                          <span className="text-slate-400 border border-slate-700 bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                            {contract.requiredPattern}
                          </span>
                        </div>
                      </div>

                      {/* Matching specimens indicator */}
                      <div className="pt-1.5 border-t border-slate-900">
                        {hasMatchingSlime ? (
                          <div className="space-y-2">
                            <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block">Matching idle cells occupants:</span>
                            <div className="space-y-1.5 max-h-[90px] overflow-y-auto pr-1">
                              {matchingSlimes.map((slime) => (
                                <div 
                                  key={slime.id}
                                  className="flex items-center justify-between p-1.5 rounded bg-emerald-950/10 border border-emerald-900/20 text-[10px] font-mono text-emerald-300"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="font-bold text-white">{slime.name}</span>
                                    <span className="text-[8px] text-slate-500">Lv.{slime.level}</span>
                                  </div>
                                  <button
                                    onClick={() => setConfirmDelivery({ contract, slime })}
                                    className="px-2 py-0.5 rounded bg-emerald-900/20 border border-emerald-600/30 hover:bg-emerald-600 hover:text-white transition-all text-emerald-400 font-bold font-mono text-[9px] uppercase cursor-pointer"
                                  >
                                    Ship Core
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 p-2 bg-slate-950/20 border border-slate-900 rounded text-[9px] font-mono text-slate-500 italic">
                            <Info className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span>Qualifying idle specimen is currently absent from cells. Breed {contract.requiredColor} + {contract.requiredPattern} to satisfy.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center text-center py-12 border border-slate-850 rounded-xl bg-slate-950/5 min-h-[320px]">
                  <Briefcase className="w-10 h-10 text-slate-850 animate-pulse" />
                  <h3 className="text-xs font-mono font-bold text-slate-400 mt-2">COMMUNICATIONS TERMINAL STANDBY</h3>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1">Wait for next lab cycle shift to synchronize corporate directories.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sub_market"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col space-y-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold font-display text-white">Galactic Liquidity Terminal</h2>
                <p className="text-xs text-slate-400">Instantly liquidate any specimen at global spot price. High supply of a single strain depresses trade rates.</p>
              </div>
            </div>

            {/* Market Status Monitor */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {(['Red', 'Blue', 'Yellow', 'Purple', 'Orange', 'Green', 'Gray'] as SlimeColor[]).map(color => {
                const count = getRecentSalesCountForColor(color);
                const pct = Math.max(30, Math.round((1 - count * 0.12) * 100));
                const specColor = COLOR_SPECS[color];
                const isSaturated = count > 0;
                
                return (
                  <div 
                    key={color} 
                    className="p-2 border border-slate-800 bg-slate-900/10 rounded-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold" style={{ color: specColor.rgb }}>
                        {color}
                      </span>
                      {isSaturated && (
                        <span className="text-[8px] px-1 bg-amber-950/40 text-amber-400 border border-amber-900/30 rounded font-mono">
                          {count} sold
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {pct}% spot
                      </span>
                      <span className={`text-[9px] font-mono ${isSaturated ? 'text-amber-400' : 'text-slate-500'}`}>
                        {isSaturated ? 'Saturated' : 'Stable'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* List of idle slimes */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase mb-3">
                Containment Cell Specimens Available for Sale ({state.slimes.filter(s => s.role === 'idle').length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[360px] pr-1">
                {state.slimes.filter(s => s.role === 'idle').length > 0 ? (
                  state.slimes.filter(s => s.role === 'idle').map(slime => {
                    const count = getRecentSalesCountForColor(slime.color);
                    const currentPrice = calculateMarketPrice(slime, count);
                    
                    return (
                      <SpecimenListItem
                        key={slime.id}
                        slime={slime}
                        showChevron={false}
                        action={
                          <button
                            onClick={() => setConfirmMarketSale({ slime, price: currentPrice, recentCount: count })}
                            className="px-2.5 py-1.5 rounded bg-cyan-950/30 border border-cyan-700/50 hover:bg-cyan-600 hover:text-white transition-all text-cyan-400 font-bold font-mono text-[9px] uppercase cursor-pointer"
                          >
                            Sell: {currentPrice} Cr
                          </button>
                        }
                      />
                    );
                  })
                ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center text-center py-10 border border-slate-850 rounded-xl bg-slate-950/10 min-h-[220px]">
                    <Database className="w-8 h-8 text-slate-800 animate-pulse" />
                    <h3 className="text-xs font-mono font-bold text-slate-400 mt-2">NO IDLE SPECIMENS DETECTED</h3>
                    <p className="text-[10px] text-slate-500 max-w-xs mt-1">All specimens are either dispatched on orbit missions, deployed in active roles, or the roster is empty.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* DELIVERY CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmDelivery && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="border border-yellow-500/30 bg-[#0c1220] rounded-xl p-5 max-w-md w-full space-y-4 shadow-[0_0_50px_rgba(234,179,8,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
              
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-850">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Irreversible Export Authorization</h3>
                <button 
                  onClick={() => setConfirmDelivery(null)}
                  className="ml-auto text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-normal font-mono">
                You are authorizing the transhipment of biological assets through the event-horizon conveyor loop:
              </p>

              {/* Specific Transfer visualization */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SlimeVisual slime={confirmDelivery.slime} size="sm" />
                  <div>
                    <div className="font-mono text-xs font-bold text-white">{confirmDelivery.slime.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Lv. {confirmDelivery.slime.level} {confirmDelivery.slime.color} {confirmDelivery.slime.pattern}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 animate-pulse" />
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-yellow-400">{confirmDelivery.contract.title}</div>
                  <div className="text-[10px] text-emerald-400 font-bold font-mono mt-0.5">+{confirmDelivery.contract.creditsReward} Cr</div>
                </div>
              </div>

              {/* Extreme Warning Box */}
              <div className="p-3 bg-red-950/10 border border-red-900/20 rounded-lg flex items-start space-x-2 text-[10px] font-mono text-red-300 leading-normal">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">CRITICAL EXPORT PROTOCOL:</span> Shipment will permanently dissolve containment fields. Core cell matrix consumed at HQ destination. Biological lineage references and records will be deleted.
                </div>
              </div>

              {/* Choices */}
              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => setConfirmDelivery(null)}
                  className="flex-1 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 font-mono text-xs uppercase cursor-pointer transition-colors"
                >
                  Abort Shipment
                </button>
                <button 
                  onClick={() => {
                    handleDeliverContract(confirmDelivery.contract, confirmDelivery.slime);
                    setConfirmDelivery(null);
                  }}
                  className="flex-1 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[0_0_15px_rgba(234,179,8,0.25)] flex items-center justify-center space-x-1.5"
                >
                  <Ship className="w-3.5 h-3.5" />
                  <span>Confirm Transhipment</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MARKET SALE CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmMarketSale && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="border border-cyan-500/30 bg-[#0c1220] rounded-xl p-5 max-w-md w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
              
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-850">
                <AlertTriangle className="w-5 h-5 text-cyan-500" />
                <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Confirm Market Liquidation</h3>
                <button 
                  onClick={() => setConfirmMarketSale(null)}
                  className="ml-auto text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-normal font-mono">
                You are authorizing the immediate liquidation of this specimen at current Galactic spot rate:
              </p>

              {/* Specific Transfer visualization */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SlimeVisual slime={confirmMarketSale.slime} size="sm" />
                  <div>
                    <div className="font-mono text-xs font-bold text-white">{confirmMarketSale.slime.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Lv. {confirmMarketSale.slime.level} {confirmMarketSale.slime.color} {confirmMarketSale.slime.pattern}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 animate-pulse" />
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-cyan-400">GALACTIC SPOT</div>
                  <div className="text-[10px] text-emerald-400 font-bold font-mono mt-0.5">+{confirmMarketSale.price} Cr</div>
                </div>
              </div>

              {/* Saturated Warning if any recent sales of this color */}
              {confirmMarketSale.recentCount > 0 ? (
                <div className="p-3 bg-amber-950/10 border border-amber-900/20 rounded-lg flex items-start space-x-2 text-[10px] font-mono text-amber-300 leading-normal">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">MARKET SATURATION WARNING:</span> {confirmMarketSale.recentCount} recent sales of {confirmMarketSale.slime.color} have depressed prices to {(Math.max(0.3, 1 - confirmMarketSale.recentCount * 0.12) * 100).toFixed(0)}% of base value. This sale will increase saturation count to {confirmMarketSale.recentCount + 1}.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#0c1220]/60 border border-slate-800 rounded-lg flex items-start space-x-2 text-[10px] font-mono text-slate-400 leading-normal">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">MARKET CONDITIONS STABLE:</span> No recent sales of {confirmMarketSale.slime.color} have occurred. Selling will receive full spot value but will increase saturation for subsequent sales.
                  </div>
                </div>
              )}

              {/* Extreme Warning Box */}
              <div className="p-3 bg-red-950/10 border border-red-900/20 rounded-lg flex items-start space-x-2 text-[10px] font-mono text-red-300 leading-normal">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">CRITICAL EXPORT PROTOCOL:</span> Asset core will be processed for biological synthesis. This action is irreversible. All records will be wiped from lab systems.
                </div>
              </div>

              {/* Choices */}
              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => setConfirmMarketSale(null)}
                  className="flex-1 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 font-mono text-xs uppercase cursor-pointer transition-colors"
                >
                  Abort Sale
                </button>
                <button 
                  onClick={() => {
                    handleSellOnMarket(confirmMarketSale.slime, confirmMarketSale.price);
                    setConfirmMarketSale(null);
                  }}
                  className="flex-1 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center justify-center space-x-1.5"
                >
                  <Ship className="w-3.5 h-3.5" />
                  <span>Execute Liquidation</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

