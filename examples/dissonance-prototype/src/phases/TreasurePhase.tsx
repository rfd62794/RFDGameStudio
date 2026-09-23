import React, { useState, useEffect } from 'react';
import { Gift, ArrowRight, Sparkles, Gem, Award, ShieldAlert, Sparkle } from 'lucide-react';
import { RunState, Relic } from '../types';
import { RELIC_POOL } from '../utils';

interface TreasurePhaseProps {
  runState: RunState;
  onCollect: (choice: { type: 'essence'; value: number } | { type: 'relic'; relicId: string }) => void;
}

export default function TreasurePhase({ runState, onCollect }: TreasurePhaseProps) {
  const [opened, setOpened] = useState(false);
  const [offeredRelic, setOfferedRelic] = useState<Relic | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<'essence' | 'relic' | null>(null);
  const [isResolved, setIsResolved] = useState<boolean>(false);

  const hasLedger = runState.relics?.includes('merchants_ledger');
  const baseEssence = 50;
  const essenceReward = hasLedger ? Math.round(baseEssence * 1.5) : baseEssence;

  useEffect(() => {
    const eligible = RELIC_POOL.filter(r => !runState.relics?.includes(r.id));
    if (eligible.length > 0) {
      const randomRelic = eligible[Math.floor(Math.random() * eligible.length)];
      setOfferedRelic(randomRelic);
    }
  }, [runState.relics]);

  const handleOpenCache = () => {
    setOpened(true);
  };

  const handleConfirmChoice = () => {
    if (isResolved) return;
    if (selectedChoice === 'essence') {
      setIsResolved(true);
      onCollect({ type: 'essence', value: essenceReward });
    } else if (selectedChoice === 'relic' && offeredRelic) {
      setIsResolved(true);
      onCollect({ type: 'relic', relicId: offeredRelic.id });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative text-center" id="viewport-treasure-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
      
      <div className="max-w-xl mx-auto my-6 flex flex-col items-center gap-6 w-full">
        {/* Animated Cache Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl animate-pulse scale-150" />
          <div className={`p-6 rounded-2xl border transition-all duration-500 ${
            opened 
              ? 'bg-amber-950/20 border-amber-400 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)]' 
              : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400 cursor-pointer'
          }`}
          onClick={!opened ? handleOpenCache : undefined}
          >
            <Gift className={`w-16 h-16 ${!opened ? 'animate-bounce' : ''}`} />
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">Unstable Node Cache</span>
          <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight mt-1">
            {opened ? 'Select Resonance Alignment' : 'Anomalous Frequency Cache'}
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {opened 
              ? 'Synchronized! The cache contains two powerful pathways. Select one frequency alignment to integrate into this run.' 
              : 'Our probes detect no active hostile interference in this segment. An uncalibrated energy cluster sits intact ahead.'}
          </p>
        </div>

        {!opened ? (
          <button
            onClick={handleOpenCache}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-display uppercase tracking-wider text-xs rounded-xl transition-all shadow-lg shadow-amber-950/20 flex items-center gap-2"
          >
            Open Frequency Cache
            <Sparkles className="w-4 h-4 animate-spin" />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
            
            {/* The Choice Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              
              {/* Choice A: Essence */}
              <div 
                onClick={() => !isResolved && setSelectedChoice('essence')}
                className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-44 ${
                  isResolved 
                    ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-950/20' 
                    : selectedChoice === 'essence'
                    ? 'border-amber-400 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-750 hover:bg-slate-950/60 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Gem className="w-5 h-5" />
                    </span>
                    {hasLedger && (
                      <span className="px-1.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-900/50 text-[8px] font-mono font-bold rounded uppercase">
                        +50% Ledger Bonus
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 mt-3">Essence Absorption</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Instantly harness energy from the cache. Adds pure, unspent Run Essence to your calibrations.
                  </p>
                </div>
                <div className="text-base font-bold text-amber-400 font-mono mt-2">
                  +{essenceReward} Run Essence
                </div>
              </div>

              {/* Choice B: Relic */}
              {offeredRelic ? (
                <div 
                  onClick={() => !isResolved && setSelectedChoice('relic')}
                  className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-44 ${
                    isResolved 
                      ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-950/20'
                      : selectedChoice === 'relic'
                      ? 'border-teal-400 bg-teal-950/10 shadow-[0_0_15px_rgba(45,212,191,0.15)] cursor-pointer'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-750 hover:bg-slate-950/60 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                        <Award className="w-5 h-5" />
                      </span>
                      <span className="px-1.5 py-0.5 bg-teal-950 text-teal-400 border border-teal-900/50 text-[8px] font-mono font-bold rounded uppercase">
                        {offeredRelic.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 mt-3">{offeredRelic.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-3">
                      {offeredRelic.description}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-teal-400 font-mono mt-2">
                    Calibrate Relic Construct
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-slate-850 bg-slate-950/20 text-slate-600 flex flex-col items-center justify-center text-xs">
                  <ShieldAlert className="w-8 h-8 text-slate-650 mb-2" />
                  All Relics Already Calibrated
                </div>
              )}
            </div>

            {/* Confirm Action Button */}
            <button
              onClick={handleConfirmChoice}
              disabled={!selectedChoice || isResolved}
              className={`w-full px-6 py-4 font-bold font-display uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${
                isResolved
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 border border-slate-850'
                  : selectedChoice
                  ? selectedChoice === 'essence'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/20'
                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-950/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
              }`}
            >
              <span>{isResolved ? 'Frequency Integrated' : selectedChoice ? `Integrate Selected Frequency` : 'Select an Alignment Option'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
