// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Dna, Info, Edit2, Trash2, Sliders, Beaker, Plus, RotateCcw, ChevronRight, BookOpen,
  FlaskConical, Layers, Sparkles, Briefcase, TrendingUp, AlertTriangle, Ship, Check, ArrowRight, X
} from 'lucide-react';
import { Slime, LabState, SlimeColor, SlimePattern, CorporateContract } from '../types';
import { COLOR_SPECS, PATTERN_DESCRIPTIONS, stageFromLevel, calculateMarketPrice, getHueDeviation, RawColorTarget } from '../gameLogic';
import { getStaticList } from '../../engine/runtime';
import type { GameSession } from '../../engine/types';
import { SlimeVisual } from './SlimeVisual';
import { SpecimenListItem } from './SpecimenListItem';
import { SlimeDexTab } from './SlimeDexTab';
import { Button, StatBar } from '../../../ui/components';
import { TabBar } from '../../../ui/components/TabBar';

interface RosterTabProps {
  key?: any;
  state: LabState;
  
  // From RosterTab
  selectedSlimeId: string | null;
  setSelectedSlimeId: (id: string | null) => void;
  setRenameSlimeId: (id: string | null) => void;
  setNewNameInput: (name: string) => void;
  handleRenameSlime?: (id: string, newName: string) => void;
  renameSlimeId?: string | null;
  newNameInput?: string;
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
  lastConsumedSlimeId?: string | null;
  session: GameSession;
}

export function RosterTab({
  state,
  selectedSlimeId,
  setSelectedSlimeId,
  setRenameSlimeId,
  setNewNameInput,
  handleRenameSlime,
  renameSlimeId,
  newNameInput,
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
  lastConsumedSlimeId,
  session
}: RosterTabProps) {
  const currentlySelectedSlime = state.slimes.find(s => s.id === selectedSlimeId);
  const idleSlimes = state.slimes.filter(s => s.role === 'idle');
  const colorTargets = getStaticList(session, 'color_targets') as RawColorTarget[];

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

  const [activeSubTab, setActiveSubTab] = useState<'collection' | 'breeding' | 'slimedex'>('collection');
  return (
    <div className="flex flex-col flex-1">
      <TabBar
        tabs={[{ id: 'collection', label: 'COLLECTION' }, { id: 'breeding', label: 'SPLICING' }, { id: 'slimedex', label: 'SLIMEDEX' }]}
        active={activeSubTab}
        onSelect={id => setActiveSubTab(id as 'collection' | 'breeding' | 'slimedex')}
      />      {activeSubTab === 'collection' && (
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
                              {renameSlimeId === currentlySelectedSlime.id && handleRenameSlime && (
                                <div className="flex items-center space-x-1 ml-1">
                                  <input
                                    type="text"
                                    value={newNameInput ?? ''}
                                    onChange={(e) => setNewNameInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && newNameInput?.trim()) handleRenameSlime(currentlySelectedSlime.id, newNameInput); if (e.key === 'Escape') setRenameSlimeId(null); }}
                                    className="w-32 px-2 py-0.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-yellow-500"
                                    placeholder="New name..."
                                    autoFocus
                                  />
                                  <Button
                                    icon={<Check className="w-3.5 h-3.5" />}
                                    onClick={() => { if (newNameInput?.trim()) handleRenameSlime(currentlySelectedSlime.id, newNameInput); }}
                                    variant="neutral"
                                    title="Confirm rename"
                                    className="!border-0 !bg-transparent !p-0.5 rounded !text-green-400 hover:!bg-green-950/30 cursor-pointer"
                                  />
                                  <Button
                                    icon={<X className="w-3.5 h-3.5" />}
                                    onClick={() => setRenameSlimeId(null)}
                                    variant="neutral"
                                    title="Cancel"
                                    className="!border-0 !bg-transparent !p-0.5 rounded !text-slate-500 hover:!text-red-400 cursor-pointer"
                                  />
                                </div>
                              )}
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
                        <div className="bg-slate-950/40 p-2 rounded border border-slate-900">
                          <StatBar label="HP" value={Math.round(currentlySelectedSlime.stats.hp)} max={200} color="#cbd5e1" />
                        </div>
                        {[
                          { label: 'ATK', val: currentlySelectedSlime.stats.atk },
                          { label: 'DEF', val: currentlySelectedSlime.stats.def },
                          { label: 'AGI', val: currentlySelectedSlime.stats.agi },
                          { label: 'INT', val: currentlySelectedSlime.stats.int },
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
                                    
                                    <Button
                                      label="Decommission from Worker Duties"
                                      onClick={() => handleToggleWorkerRole(currentlySelectedSlime.id)}
                                      variant="neutral"
                                      className="w-full !border-red-900/30 !bg-red-950/20 !px-0 !py-1.5 !text-[10px] !font-mono !font-bold uppercase tracking-wider rounded hover:!bg-red-900/20 hover:!text-white text-red-400 transition-colors cursor-pointer"
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-[10px] text-slate-400 leading-normal font-mono">
                                      Assigning this specimen to Worker Duties will lock its role as a Lab Worker. It will generate a steady stream of Credits each cycle, boosted by Auto-Feeders and owned territory matching its color.
                                    </p>
                                    <Button
                                      label="Assign as Lab Worker"
                                      onClick={() => handleToggleWorkerRole(currentlySelectedSlime.id)}
                                      variant="neutral"
                                      className="w-full !border-cyan-800/40 !bg-cyan-950/20 !px-0 !py-2 !text-[10px] !font-mono !font-bold uppercase tracking-wider rounded hover:!bg-cyan-600 hover:!text-white text-cyan-400 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                                    />
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
                                  const tName = colorTargets.find(t => t.id === targetId)?.name || targetId;
                                  return (
                                    <option key={targetId} value={targetId}>
                                      {tName} Target Regent ({count} available)
                                    </option>
                                  );
                                })}
                            </select>
                            {activeTargetRegent && (() => {
                              const tName2 = colorTargets.find(t => t.id === activeTargetRegent)?.name || 'Target';
                              return (
                                <div className="text-[10px] text-yellow-400 font-mono bg-yellow-950/15 border border-yellow-900/20 rounded p-1.5 leading-normal">
                                  ⚠️ <span className="font-bold">Target Regent Active:</span> Born offspring's Hue and Saturation will be nudged 60% towards the <span className="font-bold text-white">{tName2}</span> target range. 1 Regent will be consumed.
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

                {lastConsumedSlimeId && !isBreedingHatching && (
                  <div className="mt-3 px-3 py-2 bg-amber-950/40 border border-amber-800/50 rounded-lg">
                    <div className="text-[10px] font-mono text-amber-400 tracking-wider uppercase">
                      Specimen Consumed: {lastConsumedSlimeId}
                    </div>
                  </div>
                )}
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
            <SlimeDexTab state={state} session={session} onBuyRegent={onBuyRegent} onBuyColorRegent={onBuyColorRegent} onBuyTargetRegent={onBuyTargetRegent} />
          </motion.div>
        )}
    </div>
  );
}
