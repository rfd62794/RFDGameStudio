// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Dna, Info, Edit2, Trash2, Sliders, Beaker, Plus, RotateCcw, ChevronRight, BookOpen,
  FlaskConical, Layers, Sparkles, Briefcase, TrendingUp, AlertTriangle, Ship, Check, ArrowRight, X
} from 'lucide-react';
import { Slime, LabState, SlimeColor, SlimePattern, CorporateContract } from '../types';
import { COLOR_SPECS, PATTERN_DESCRIPTIONS, stageFromLevel, calculateMarketPrice, getHueDeviation, COLOR_TARGETS } from '../gameLogic';
import { SlimeVisual } from './SlimeVisual';
import { SpecimenListItem } from './SpecimenListItem';
import { SlimeDexTab } from './SlimeDexTab';

interface LabTabProps {
  key?: any;
  state: LabState;
  
  // From LabTab (Upgrades)
  handleBuyUpgrade: (type: 'capacity' | 'stabilizer' | 'autofeeder') => void;
  handlePurchaseSeedSlime: (color: SlimeColor) => void;
  
  // From RosterTab
  selectedSlimeId: string | null;
  setSelectedSlimeId: (id: string | null) => void;
  setRenameSlimeId: (id: string | null) => void;
  setNewNameInput: (name: string) => void;
  handleRecycleSlime: (id: string) => void;
  parentAId: string | null;
  parentBId: string | null;
  setParentAId: (id: string | null) => void;
  setParentBId: (id: string | null) => void;
  isBreedingHatching: boolean;
  handleInitiateBreeding: () => void;
  activeRegentPattern: SlimePattern | null;
  setActiveRegentPattern: (pattern: SlimePattern | null) => void;
  onBuyRegent: (pattern: SlimePattern) => void;
  activeRegentColor: SlimeColor | null;
  setActiveRegentColor: (color: SlimeColor | null) => void;
  onBuyColorRegent: (color: SlimeColor) => void;
  activeTargetRegent: string | null;
  setActiveTargetRegent: (targetId: string | null) => void;
  onBuyTargetRegent: (targetId: string) => void;
  handleToggleWorkerRole?: (slimeId: string) => void;
  
  // Combined activeSubTab and setActiveSubTab
  activeSubTab: 'collection' | 'breeding' | 'slimedex' | 'upgrades' | 'requisitions';
  setActiveSubTab: (subTab: 'collection' | 'breeding' | 'slimedex' | 'upgrades' | 'requisitions') => void;

  // From EconomyTab
  handleDeliverContract: (contract: CorporateContract, targetSlime: Slime) => void;
  handleSellOnMarket: (slime: Slime, price: number) => void;
}

export function LabTab({
  state,
  handleBuyUpgrade,
  handlePurchaseSeedSlime,
  selectedSlimeId,
  setSelectedSlimeId,
  setRenameSlimeId,
  setNewNameInput,
  handleRecycleSlime,
  parentAId,
  parentBId,
  setParentAId,
  setParentBId,
  isBreedingHatching,
  handleInitiateBreeding,
  activeRegentPattern,
  setActiveRegentPattern,
  onBuyRegent,
  activeRegentColor,
  setActiveRegentColor,
  onBuyColorRegent,
  activeTargetRegent,
  setActiveTargetRegent,
  onBuyTargetRegent,
  handleToggleWorkerRole,
  activeSubTab,
  setActiveSubTab,
  handleDeliverContract,
  handleSellOnMarket
}: LabTabProps) {
  // Local Economy states (moved from EconomyTab/App state)
  const [economySubTab, setEconomySubTab] = useState<'contracts' | 'market'>('contracts');
  const [confirmDelivery, setConfirmDelivery] = useState<{
    contract: CorporateContract;
    slime: Slime;
  } | null>(null);

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
  const currentlySelectedSlime = state.slimes.find(s => s.id === selectedSlimeId);
  const idleSlimes = state.slimes.filter(s => s.role === 'idle');

  // Breeding prediction info helper
  const getBreedingPrediction = () => {
    if (!parentAId || !parentBId) return null;
    const pA = state.slimes.find(s => s.id === parentAId);
    const pB = state.slimes.find(s => s.id === parentBId);
    if (!pA || !pB) return null;
    
    let predictedColor = 'Unknown';
    let specialtyText = 'None';
    if (pA.color === pB.color) {
      predictedColor = pA.color;
      specialtyText = COLOR_SPECS[pA.color].specialty;
    } else {
      const pair = [pA.color, pB.color].sort().join('+');
      if (pair === 'Blue+Red') {
        predictedColor = 'Purple';
        specialtyText = COLOR_SPECS['Purple'].specialty;
      } else if (pair === 'Red+Yellow') {
        predictedColor = 'Orange';
        specialtyText = COLOR_SPECS['Orange'].specialty;
      } else if (pair === 'Blue+Yellow') {
        predictedColor = 'Green';
        specialtyText = COLOR_SPECS['Green'].specialty;
      } else {
        predictedColor = `${pA.color} (40%) / ${pB.color} (40%) / Gray (20% Void Mutation)`;
        specialtyText = 'High chance of inheriting parental traits; minor chance of extreme Void mutation.';
      }
    }

    let patternText = 'Standard Blend';
    if (pA.pattern === pB.pattern) {
      if (pA.pattern === 'Solid') patternText = 'Solid (80%) / Stripe (20% parallel banding)';
      else patternText = `${pA.pattern} (60%) / Upgraded Mutation (30%)`;
    } else {
      patternText = `${pA.pattern} (45%) / ${pB.pattern} (45%) / Hybrid splice (10%)`;
    }

    return {
      color: predictedColor,
      pattern: patternText,
      specialty: specialtyText,
      pA, pB
    };
  };

  const prediction = getBreedingPrediction();

  return (
    <div className="flex flex-col flex-1">
      {activeSubTab === 'collection' && (
          <motion.div
            key="sub_collection"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold font-display text-white">Containment Cells</h2>
                <p className="text-xs text-slate-400">Biological inventory of specimens currently housed on Asteroid-317.</p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
                Grids occupied: {state.slimes.length}/{state.rosterCap}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
              {/* Left Column: Specimen list */}
              <div className="lg:col-span-6 flex flex-col space-y-3 overflow-y-auto max-h-[480px] pr-1">
                {state.slimes.map((slime) => (
                  <SpecimenListItem
                    key={slime.id}
                    slime={slime}
                    isSelected={slime.id === selectedSlimeId}
                    onClick={() => setSelectedSlimeId(slime.id)}
                  />
                ))}
              </div>

              {/* Right Column: Specimen Details */}
              <div className="lg:col-span-6 border border-slate-850 bg-slate-900/20 p-5 rounded-xl flex flex-col justify-between">
                {currentlySelectedSlime ? (
                  <div className="space-y-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top profile view */}
                      <div className="flex items-center space-x-4 pb-4 border-b border-slate-850">
                        <SlimeVisual slime={currentlySelectedSlime} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white font-mono truncate">{currentlySelectedSlime.name}</h3>
                            <div className="flex items-center space-x-1.5 ml-2">
                              <button 
                                onClick={() => {
                                  setRenameSlimeId(currentlySelectedSlime.id);
                                  setNewNameInput(currentlySelectedSlime.name);
                                }}
                                className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Rename specimen"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleRecycleSlime(currentlySelectedSlime.id)}
                                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                                title="Decommission and recycle bio-mass (+15 Credits)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">Generation {currentlySelectedSlime.generation} • Level {currentlySelectedSlime.level} ({stageFromLevel(currentlySelectedSlime.level)})</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold border border-slate-850" style={{ color: COLOR_SPECS[currentlySelectedSlime.color].rgb, backgroundColor: `${COLOR_SPECS[currentlySelectedSlime.color].rgb}10` }}>
                              {currentlySelectedSlime.color} Strain
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800">
                              {currentlySelectedSlime.pattern} Pattern
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-slate-950 text-indigo-400 border border-indigo-900/30">
                              {stageFromLevel(currentlySelectedSlime.level)} Stage
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats and characteristics */}
                      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
                        {[
                          { label: 'HP', val: currentlySelectedSlime.stats.hp, max: 200 },
                          { label: 'ATK', val: currentlySelectedSlime.stats.atk, max: 50 },
                          { label: 'DEF', val: currentlySelectedSlime.stats.def, max: 50 },
                          { label: 'AGI', val: currentlySelectedSlime.stats.agi, max: 50 },
                          { label: 'INT', val: currentlySelectedSlime.stats.int, max: 50 },
                        ].map((s) => (
                          <div key={s.label} className="bg-slate-950/40 p-2 rounded border border-slate-900">
                            <div className="text-[8px] font-mono text-slate-500 font-bold">{s.label}</div>
                            <div className="text-xs font-bold font-mono text-slate-300 mt-0.5">{Math.round(s.val)}</div>
                          </div>
                        ))}
                      </div>

                      {/* Bio strain summary */}
                      <div className="mt-5 space-y-3.5">
                        <div className="border border-slate-800 bg-slate-950/30 p-3.5 rounded-lg">
                          <h4 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                            <Info className="w-3.5 h-3.5 mr-1.5" />
                            Core Specialty
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            This {currentlySelectedSlime.color} strain biological asset boasts <span className="font-semibold text-white">{COLOR_SPECS[currentlySelectedSlime.color].specialty}</span>. 
                            Its cellular grid hosts <span className="font-semibold text-white">{currentlySelectedSlime.pattern} membrane patterns</span>, boosting attributes by: <span className="font-semibold text-cyan-300">{PATTERN_DESCRIPTIONS[currentlySelectedSlime.pattern].bonus}</span>.
                          </p>
                        </div>

                        <div className="border border-slate-800 bg-slate-950/30 p-3.5 rounded-lg">
                          <h4 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                            <Dna className="w-3.5 h-3.5 mr-1.5" />
                            Genealogy Node
                          </h4>
                          <div className="mt-2.5 space-y-1.5 font-mono text-[11px] text-slate-400">
                            <div className="flex justify-between border-b border-slate-950 pb-1">
                              <span>Parent Core Alpha</span>
                              <span className="text-slate-300 font-semibold">{currentlySelectedSlime.parentA ? "Verified Splice" : "Original Seed Asset"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Parent Core Beta</span>
                              <span className="text-slate-300 font-semibold">{currentlySelectedSlime.parentB ? "Verified Splice" : "Original Seed Asset"}</span>
                            </div>
                            {currentlySelectedSlime.hue !== undefined && (
                              <div className="flex justify-between border-t border-slate-950 pt-1.5 mt-1 text-slate-400">
                                <span>Spectral Coordinates</span>
                                <span className="text-cyan-300 font-semibold font-mono">
                                  H: {Math.round(currentlySelectedSlime.hue)}° • S: {Math.round(currentlySelectedSlime.saturation ?? 100)}%
                                </span>
                              </div>
                            )}
                            {currentlySelectedSlime.hue !== undefined && (() => {
                              const devInfo = getHueDeviation(currentlySelectedSlime.hue);
                              return (
                                <div className="flex justify-between text-slate-400">
                                  <span>Anchor Deviation</span>
                                  <span className="text-slate-300 font-semibold font-mono">
                                    {devInfo.baseColor} ({devInfo.deviation >= 0 ? `+${devInfo.deviation}` : devInfo.deviation}°)
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Worker Assignment Card */}
                        {handleToggleWorkerRole && (
                          <div className="border border-slate-800 bg-[#0c1220]/40 p-3.5 rounded-lg space-y-2.5">
                            <h4 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                              <Sliders className="w-3.5 h-3.5 mr-1.5" />
                              Worker Assignment
                            </h4>
                            
                            {currentlySelectedSlime.lockedRole && currentlySelectedSlime.lockedRole !== 'worker' ? (
                              <div className="p-2.5 bg-red-950/15 border border-red-900/20 rounded text-[10px] font-mono text-red-300 leading-normal">
                                🔒 This specimen's role is permanently locked to <span className="font-bold text-white uppercase">{currentlySelectedSlime.lockedRole}</span> and cannot be assigned to laboratory worker duties.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {currentlySelectedSlime.lockedRole === 'worker' ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-mono">
                                      <span className="text-slate-400">Worker Status:</span>
                                      <span className="text-emerald-400 font-bold uppercase animate-pulse">● Active Lab Worker</span>
                                    </div>
                                    
                                    {(() => {
                                      const base = 5;
                                      const hasFeeder = !!state.hasAutoFeeder;
                                      const matchesEnv = state.planetRegion ? state.planetRegion.nodes.some(n => n.ownerColor === currentlySelectedSlime.color) : false;
                                      const feederMult = hasFeeder ? 2 : 1;
                                      const cultureMult = matchesEnv ? 2 : 1;
                                      const realized = base * feederMult * cultureMult;
                                      
                                      return (
                                        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900 font-mono text-[10px] space-y-1">
                                          <div className="flex justify-between text-slate-400">
                                            <span>Base Income:</span>
                                            <span className="text-slate-200">+{base} Cr/cycle</span>
                                          </div>
                                          <div className="flex justify-between text-slate-400">
                                            <span>Auto-Feeder Module:</span>
                                            <span className={hasFeeder ? "text-emerald-400 font-bold" : "text-slate-500"}>
                                              {hasFeeder ? "x2 multiplier active" : "Not installed"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-slate-400">
                                            <span>Culture Environment Match:</span>
                                            <span className={matchesEnv ? "text-emerald-400 font-bold" : "text-slate-500"}>
                                              {matchesEnv ? `x2 (${currentlySelectedSlime.color} owned)` : `x1 (No ${currentlySelectedSlime.color} owned)`}
                                            </span>
                                          </div>
                                          <div className="border-t border-slate-900 pt-1 flex justify-between text-yellow-400 font-bold text-xs mt-1">
                                            <span>Realized Output:</span>
                                            <span>+{realized} Cr/cycle</span>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                    
                                    <button
                                      onClick={() => handleToggleWorkerRole(currentlySelectedSlime.id)}
                                      className="w-full py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 hover:text-white text-red-400 transition-colors cursor-pointer"
                                    >
                                      Decommission from Worker Duties
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-[10px] text-slate-400 leading-normal font-mono">
                                      Assigning this specimen to Worker Duties will lock its role as a Lab Worker. It will generate a steady stream of Credits each cycle, boosted by Auto-Feeders and owned territory matching its color.
                                    </p>
                                    <button
                                      onClick={() => handleToggleWorkerRole(currentlySelectedSlime.id)}
                                      className="w-full py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded bg-cyan-950/20 border border-cyan-800/40 hover:bg-cyan-600 hover:text-white text-cyan-400 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                                    >
                                      Assign as Lab Worker
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Exp Tracker */}
                    <div className="pt-3 border-t border-slate-850 flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 pb-1">
                          <span>EXP STATUS</span>
                          <span className="text-slate-300">{currentlySelectedSlime.xp} / {currentlySelectedSlime.level * 100} XP</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (currentlySelectedSlime.xp / (currentlySelectedSlime.level * 100)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveSubTab('breeding')}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono uppercase rounded-lg border border-slate-700 cursor-pointer transition-all shrink-0"
                      >
                        <Dna className="w-3.5 h-3.5" />
                        <span>Splicing</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <Database className="w-10 h-10 text-slate-800 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-400 mt-2 font-mono uppercase">Containment Empty</h3>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-1">Select a core unit from containment cells list to scan.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'breeding' && (
          <motion.div
            key="sub_breeding"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-4">
              <h2 className="text-base font-bold font-display text-white">Splicing Incubator</h2>
              <p className="text-xs text-slate-400">Fuse the protoplasmic cells of two active specimens to hatch a mutated offspring.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Left Column: Splicers Selection */}
              <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Parent A */}
                  <div className="border border-slate-800 bg-[#080d16]/50 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[160px]">
                    <span className="absolute top-2 left-2 text-[9px] font-mono tracking-wider bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase">Parent Alpha</span>
                    {parentAId ? (
                      <div className="text-center flex flex-col items-center">
                        <button 
                          onClick={() => setParentAId(null)}
                          className="absolute top-2 right-2 p-1 rounded hover:bg-red-950/20 text-slate-500 hover:text-red-400 cursor-pointer"
                          title="Remove parent"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        {(() => {
                          const parent = state.slimes.find(s => s.id === parentAId)!;
                          return (
                            <>
                              <SlimeVisual slime={parent} size="md" />
                              <div className="font-mono text-xs font-bold text-white mt-3 truncate max-w-[120px]">{parent.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Lv. {parent.level} {parent.color} ({stageFromLevel(parent.level)})</div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Plus className="w-6 h-6 text-slate-700 mx-auto animate-pulse" />
                        <div className="text-[10px] text-slate-500 font-mono mt-2">Select Candidate Below</div>
                      </div>
                    )}
                  </div>

                  {/* Parent B */}
                  <div className="border border-slate-800 bg-[#080d16]/50 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[160px]">
                    <span className="absolute top-2 left-2 text-[9px] font-mono tracking-wider bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase">Parent Beta</span>
                    {parentBId ? (
                      <div className="text-center flex flex-col items-center">
                        <button 
                          onClick={() => setParentBId(null)}
                          className="absolute top-2 right-2 p-1 rounded hover:bg-red-950/20 text-slate-500 hover:text-red-400 cursor-pointer"
                          title="Remove parent"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        {(() => {
                          const parent = state.slimes.find(s => s.id === parentBId)!;
                          return (
                            <>
                              <SlimeVisual slime={parent} size="md" />
                              <div className="font-mono text-xs font-bold text-white mt-3 truncate max-w-[120px]">{parent.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Lv. {parent.level} {parent.color} ({stageFromLevel(parent.level)})</div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Plus className="w-6 h-6 text-slate-700 mx-auto animate-pulse" />
                        <div className="text-[10px] text-slate-500 font-mono mt-2">Select Candidate Below</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent Candidate Pool */}
                <div className="border border-slate-850 bg-slate-950/30 p-4 rounded-xl flex-1 flex flex-col">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase mb-2.5 block">Idle Candidates Pool</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[180px] pr-1">
                    {idleSlimes.length > 0 ? (
                      idleSlimes.map((slime) => {
                        const isSelectedA = slime.id === parentAId;
                        const isSelectedB = slime.id === parentBId;
                        const isAnySelected = isSelectedA || isSelectedB;

                        return (
                          <div
                            key={slime.id}
                            onClick={() => {
                              if (isAnySelected) {
                                  if (isSelectedA) setParentAId(null);
                                  if (isSelectedB) setParentBId(null);
                              } else {
                                  if (!parentAId) setParentAId(slime.id);
                                  else if (!parentBId) setParentBId(slime.id);
                              }
                            }}
                            className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all duration-200 ${
                              isAnySelected
                                ? 'border-cyan-500 bg-cyan-950/25'
                                : 'border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <SlimeVisual slime={slime} size="xs" />
                              <div className="min-w-0">
                                <div className="font-mono text-[10px] text-white truncate max-w-[80px]">{slime.name}</div>
                                <div className="text-[8px] text-slate-500 font-mono">Lv. {slime.level} {slime.color} ({stageFromLevel(slime.level)})</div>
                              </div>
                            </div>
                            <Plus className={`w-3.5 h-3.5 text-slate-500 shrink-0 ml-1 transition-transform ${isAnySelected ? 'rotate-45 text-cyan-400' : ''}`} />
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center py-6 text-xs font-mono text-slate-500">
                        No idle containment units ready. Decommission active assignments first.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Prediction Forecast */}
              <div className="border border-slate-800 bg-[#080d16]/30 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2 flex items-center">
                    <Beaker className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                    Gene Predictions
                  </h3>

                  {prediction ? (
                    <div className="mt-3.5 space-y-4 font-mono text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Core Culture Blend</div>
                        <div className="text-slate-200 font-bold mt-0.5 flex items-center">
                          <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: COLOR_SPECS[prediction.pA.color].rgb }} />
                          {prediction.pA.color}
                          <span className="mx-1.5 text-slate-600">+</span>
                          <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: COLOR_SPECS[prediction.pB.color].rgb }} />
                          {prediction.pB.color}
                        </div>
                        <div className="text-[10px] text-cyan-400 font-bold mt-1 uppercase">Offspring forecast: {prediction.color}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Specialty Inheritance</div>
                        <div className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{prediction.specialty}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Membrane Pattern Mutation</div>
                        <div className="text-slate-300 text-[11px] mt-0.5">{prediction.pattern}</div>
                      </div>

                      {/* Pattern Regent Selector */}
                      <div className="pt-2 border-t border-slate-850/50 mt-2 space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase block font-bold">Apply Pattern Regent (Optional)</label>
                        {Object.entries(state.regentInventory || {}).filter(([_, count]) => (count || 0) > 0).length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={activeRegentPattern || ""}
                              onChange={(e) => setActiveRegentPattern(e.target.value ? e.target.value as SlimePattern : null)}
                              className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs w-full focus:outline-none focus:border-cyan-500"
                            >
                              <option value="">-- Select Regent (None) --</option>
                              {Object.entries(state.regentInventory || {})
                                .filter(([_, count]) => (count || 0) > 0)
                                .map(([pattern, count]) => (
                                  <option key={pattern} value={pattern}>
                                    {pattern} Regent ({count} available)
                                  </option>
                                ))}
                            </select>
                            {activeRegentPattern && (
                              <div className="text-[10px] text-yellow-400 font-mono bg-yellow-950/15 border border-yellow-900/20 rounded p-1.5 leading-normal">
                                ⚠️ <span className="font-bold">Regent Active:</span> Born offspring is guaranteed to have the <span className="font-bold text-white">{activeRegentPattern}</span> pattern. 1 Regent will be consumed.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600 bg-slate-950/40 p-2 rounded border border-slate-900/60 leading-normal">
                            No Pattern Regents available in current inventory. Buy them in the <span className="text-cyan-400 font-bold hover:underline cursor-pointer" onClick={() => setActiveSubTab('slimedex')}>SlimeDex</span> tab.
                          </div>
                        )}
                      </div>

                      {/* Color Regent Selector */}
                      <div className="pt-2 border-t border-slate-850/50 mt-1 space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase block font-bold">Apply Color Regent (Optional)</label>
                        {Object.entries(state.colorRegentInventory || {}).filter(([_, count]) => (count || 0) > 0).length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={activeRegentColor || ""}
                              onChange={(e) => setActiveRegentColor(e.target.value ? e.target.value as SlimeColor : null)}
                              className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs w-full focus:outline-none focus:border-cyan-500"
                            >
                              <option value="">-- Select Regent (None) --</option>
                              {Object.entries(state.colorRegentInventory || {})
                                .filter(([_, count]) => (count || 0) > 0)
                                .map(([color, count]) => (
                                  <option key={color} value={color}>
                                    {color} Regent ({count} available)
                                  </option>
                                ))}
                            </select>
                            {activeRegentColor && (
                              <div className="text-[10px] text-yellow-400 font-mono bg-yellow-950/15 border border-yellow-900/20 rounded p-1.5 leading-normal">
                                ⚠️ <span className="font-bold">Regent Active:</span> Born offspring is guaranteed to have the <span className="font-bold text-white">{activeRegentColor}</span> strain. 1 Regent will be consumed.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600 bg-slate-950/40 p-2 rounded border border-slate-900/60 leading-normal">
                            No Color Regents available in current inventory. Buy them in the <span className="text-cyan-400 font-bold hover:underline cursor-pointer" onClick={() => setActiveSubTab('slimedex')}>SlimeDex</span> tab.
                          </div>
                        )}
                      </div>

                      {/* Color Target Regent Selector */}
                      <div className="pt-2 border-t border-slate-850/50 mt-1 space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase block font-bold">Apply Target Regent (Optional)</label>
                        {Object.entries(state.targetRegentInventory || {}).filter(([_, count]) => (count || 0) > 0).length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={activeTargetRegent || ""}
                              onChange={(e) => setActiveTargetRegent(e.target.value || null)}
                              className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs w-full focus:outline-none focus:border-cyan-500"
                            >
                              <option value="">-- Select Target Regent (None) --</option>
                              {Object.entries(state.targetRegentInventory || {})
                                .filter(([_, count]) => (count || 0) > 0)
                                .map(([targetId, count]) => {
                                  const tName = COLOR_TARGETS.find(t => t.id === targetId)?.name || targetId;
                                  return (
                                    <option key={targetId} value={targetId}>
                                      {tName} Target Regent ({count} available)
                                    </option>
                                  );
                                })}
                            </select>
                            {activeTargetRegent && (() => {
                              const tName = COLOR_TARGETS.find(t => t.id === activeTargetRegent)?.name || 'Target';
                              return (
                                <div className="text-[10px] text-yellow-400 font-mono bg-yellow-950/15 border border-yellow-900/20 rounded p-1.5 leading-normal">
                                  ⚠️ <span className="font-bold">Target Regent Active:</span> Born offspring's Hue and Saturation will be nudged 60% towards the <span className="font-bold text-white">{tName}</span> target range. 1 Regent will be consumed.
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600 bg-slate-950/40 p-2 rounded border border-slate-900/60 leading-normal">
                            No Target Regents available. Buy them in the <span className="text-cyan-400 font-bold hover:underline cursor-pointer" onClick={() => setActiveSubTab('slimedex')}>SlimeDex</span> tab once discovered!
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Breeding Tax:</span>
                        <span className="text-xs font-bold text-yellow-400 font-mono">10 Credits</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 text-center text-slate-500 py-12">
                      <Sliders className="w-8 h-8 text-slate-850 mx-auto mb-2 animate-pulse" />
                      <p className="text-[11px] font-mono leading-relaxed">Load Parent Alpha and Parent Beta into active cells to initiate prognosis analysis.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  {isBreedingHatching ? (
                    <div className="w-full bg-slate-900 border border-slate-800 py-3 rounded-lg text-center space-y-2">
                      <Plus className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
                      <div className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase animate-pulse">Bio-splicing cells...</div>
                    </div>
                  ) : (
                    <button
                      disabled={!parentAId || !parentBId}
                      onClick={handleInitiateBreeding}
                      className={`w-full py-3 text-xs font-bold font-mono uppercase tracking-wider rounded-lg border transition-all ${
                        parentAId && parentBId
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500 cursor-pointer shadow-[0_0_15px_rgba(8,145,178,0.3)]'
                          : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      Hatch Spliced Specimen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'slimedex' && (
          <motion.div
            key="sub_slimedex"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <SlimeDexTab state={state} onBuyRegent={onBuyRegent} onBuyColorRegent={onBuyColorRegent} onBuyTargetRegent={onBuyTargetRegent} />
          </motion.div>
        )}

        {activeSubTab === 'upgrades' && (
          <motion.div
            key="sub_upgrades"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-4">
              <h2 className="text-base font-bold font-display text-white">Laboratory Infrastructure</h2>
              <p className="text-xs text-slate-400">Upgrade containment systems or purchase pure genetic strain stock from Headquarters.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Left Side: Upgrades */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2 flex items-center">
                  <Layers className="w-3.5 h-3.5 text-cyan-400 mr-2" />
                  Facility Modules
                </h3>
                
                {/* Grid Cap Expansion */}
                <div className="border border-slate-800 bg-slate-900/10 p-4 rounded-xl flex justify-between items-center relative overflow-hidden hover:border-slate-700 transition-colors">
                  <div className="space-y-1.5 pr-4">
                    <h4 className="font-mono text-xs font-bold text-white uppercase">Soma Grid Expansion</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Adds +5 auxiliary biological containment slots. Accommodates a larger genetic roster.</p>
                    <div className="text-[9px] text-slate-500 font-mono font-semibold">Current Limit: {state.rosterCap} specimens</div>
                  </div>
                  <button
                    disabled={state.credits < 150}
                    onClick={() => handleBuyUpgrade('capacity')}
                    className={`flex-shrink-0 px-3.5 py-2 font-mono text-[10px] font-bold uppercase border rounded-lg transition-all ${
                      state.credits >= 150
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30 text-emerald-300 cursor-pointer shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Buy [150 Cr]
                  </button>
                </div>

                {/* Splicer Stabilizer */}
                <div className="border border-slate-800 bg-slate-900/10 p-4 rounded-xl flex justify-between items-center relative overflow-hidden hover:border-slate-700 transition-colors">
                  <div className="space-y-1.5 pr-4">
                    <h4 className="font-mono text-xs font-bold text-white uppercase">Protoplasmic Stabilizer</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Increases offspring mutation consistency. Unlocks superior pattern blending formulas.</p>
                    <div className="text-[9px] text-slate-500 font-mono font-semibold">Current Focus Bonus: +{(state.breedingSuccessRateModifier * 100).toFixed(0)}% stability</div>
                  </div>
                  <button
                    disabled={state.credits < 200}
                    onClick={() => handleBuyUpgrade('stabilizer')}
                    className={`flex-shrink-0 px-3.5 py-2 font-mono text-[10px] font-bold uppercase border rounded-lg transition-all ${
                      state.credits >= 200
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30 text-emerald-300 cursor-pointer shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Buy [200 Cr]
                  </button>
                </div>

                {/* Auto-Feeder */}
                <div className="border border-slate-800 bg-slate-900/10 p-4 rounded-xl flex justify-between items-center relative overflow-hidden hover:border-slate-700 transition-colors">
                  <div className="space-y-1.5 pr-4">
                    <h4 className="font-mono text-xs font-bold text-white uppercase">Global Auto-Feeder</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Releases continuous bio-plort nutrient streams, globally doubling baseline credit generation for all Lab Workers.</p>
                    <div className="text-[9px] text-slate-500 font-mono font-semibold">
                      Current Status: {state.hasAutoFeeder ? <span className="text-emerald-400 font-bold">Active (2x multiplier)</span> : <span className="text-slate-500">Not Installed</span>}
                    </div>
                  </div>
                  <button
                    disabled={!!state.hasAutoFeeder || state.credits < 250}
                    onClick={() => handleBuyUpgrade('autofeeder')}
                    className={`flex-shrink-0 px-3.5 py-2 font-mono text-[10px] font-bold uppercase border rounded-lg transition-all ${
                      state.hasAutoFeeder
                        ? 'bg-slate-950 border-slate-800 text-emerald-400 font-bold'
                        : state.credits >= 250
                          ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30 text-emerald-300 cursor-pointer shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {state.hasAutoFeeder ? 'Active' : 'Buy [250 Cr]'}
                  </button>
                </div>
              </div>

              {/* Right Side: Requisition Stocks */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2 flex items-center">
                  <FlaskConical className="w-3.5 h-3.5 text-cyan-400 mr-2" />
                  Requisition Seed Stocks
                </h3>
                <div className="border border-slate-800 bg-slate-900/10 p-4 rounded-xl space-y-4">
                  <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                    Import pristine pure-breed starter specimens from orbital bio-conglomerates. Crucial stock when current strains are depleted.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Red Seed */}
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">RED CINDER SEED</span>
                      </div>
                      <button
                        disabled={state.credits < 50}
                        onClick={() => handlePurchaseSeedSlime('Red')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] border border-slate-800 hover:border-slate-700 text-yellow-400 font-bold font-mono uppercase rounded cursor-pointer disabled:opacity-40 transition-colors"
                      >
                        Order [50 Cr]
                      </button>
                    </div>

                    {/* Yellow Seed */}
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">YELLOW SULPHUR SEED</span>
                      </div>
                      <button
                        disabled={state.credits < 50}
                        onClick={() => handlePurchaseSeedSlime('Yellow')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] border border-slate-800 hover:border-slate-700 text-yellow-400 font-bold font-mono uppercase rounded cursor-pointer disabled:opacity-40 transition-colors"
                      >
                        Order [50 Cr]
                      </button>
                    </div>

                    {/* Blue Seed */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">BLUE ABYSSAL SEED</span>
                      </div>
                      <button
                        disabled={state.credits < 50}
                        onClick={() => handlePurchaseSeedSlime('Blue')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] border border-slate-800 hover:border-slate-700 text-yellow-400 font-bold font-mono uppercase rounded cursor-pointer disabled:opacity-40 transition-colors"
                      >
                        Order [50 Cr]
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'requisitions' && (
          <motion.div
            key="sub_requisitions"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1">
              {/* Sub-tab Sidebar */}
              <div className="md:w-44 shrink-0 flex md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-800/50 pb-4 md:pb-0 md:pr-4">
                <button
                  onClick={() => setEconomySubTab('contracts')}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer relative ${
                    economySubTab === 'contracts'
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
                  onClick={() => setEconomySubTab('market')}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer ${
                    economySubTab === 'market'
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
                {economySubTab === 'contracts' ? (
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
                            const marketAvailable = Number.isFinite(currentPrice);
                            
                            return (
                              <SpecimenListItem
                                key={slime.id}
                                slime={slime}
                                showChevron={false}
                                action={
                                  <button
                                    disabled={!marketAvailable}
                                    onClick={() => { if (marketAvailable) setConfirmMarketSale({ slime, price: currentPrice, recentCount: count }); }}
                                    className="px-2.5 py-1.5 rounded bg-cyan-950/30 border border-cyan-700/50 hover:bg-cyan-600 hover:text-white transition-all text-cyan-400 font-bold font-mono text-[9px] uppercase cursor-pointer disabled:opacity-50"
                                  >
                                    {marketAvailable ? `Sell: ${currentPrice} Cr` : 'Market pricing unavailable'}
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
                        className="ml-auto text-slate-500 hover:text-white cursor-pointer"
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
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold">Lv. {confirmDelivery.slime.level} {confirmDelivery.slime.color} {confirmDelivery.slime.pattern}</div>
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
                        className="ml-auto text-slate-500 hover:text-white cursor-pointer"
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
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold">Lv. {confirmMarketSale.slime.level} {confirmMarketSale.slime.color} {confirmMarketSale.slime.pattern}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 animate-pulse" />
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-cyan-400">GALACTIC SPOT</div>
                        <div className="text-[10px] text-emerald-400 font-bold font-mono mt-0.5 font-bold">+{confirmMarketSale.price} Cr</div>
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
          </motion.div>
        )}
    </div>
  );
}
