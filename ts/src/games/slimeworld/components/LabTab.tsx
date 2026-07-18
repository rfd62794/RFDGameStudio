// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Dna, Info, Edit2, Trash2, Sliders, Beaker, Plus, RotateCcw, ChevronRight, BookOpen,
  FlaskConical, Layers, Sparkles, Briefcase, TrendingUp, AlertTriangle, Ship, Check, ArrowRight, X
} from 'lucide-react';
import { Slime, LabState, SlimeColor, SlimePattern, CorporateContract } from '../types';
import { COLOR_SPECS, PATTERN_DESCRIPTIONS, stageFromLevel, calculateMarketPrice, getHueDeviation } from '../gameLogic';
import { SlimeVisual } from './SlimeVisual';
import { SpecimenListItem } from './SpecimenListItem';
import { SlimeDexTab } from './SlimeDexTab';
import { Button, StatBar } from '../../../ui/components';

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
  
  // Combined activeSubTab and setActiveSubTab

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

  const activeSubTab = 'upgrades' as const;
  return (
    <div className="flex flex-col flex-1">        {activeSubTab === 'upgrades' && (
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
    </div>
  );
}
