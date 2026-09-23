import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, ArrowLeft, ShieldAlert, Zap, Landmark, CheckCircle, Compass } from 'lucide-react';
import { FLOOR_CONFIG, FLOOR_FLAVOR, BankedEssence } from '../types';
import { POWER_LEVEL_CAP } from '../utils';

interface FloorChoicePhaseProps {
  unlockedCardIds: string[];
  highestFloorUnlocked: number;
  selectedFloor: number;
  onSelectFloor: (floor: number) => void;
  onConfirmFloor: () => void;
  onBack: () => void;
  bankedEssence?: BankedEssence;
}

export default function FloorChoicePhase({
  unlockedCardIds,
  highestFloorUnlocked,
  selectedFloor,
  onSelectFloor,
  onConfirmFloor,
  onBack,
  bankedEssence
}: FloorChoicePhaseProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentCfg = FLOOR_CONFIG[selectedFloor] || FLOOR_CONFIG[1];
  const isSelectedUnlocked = selectedFloor <= highestFloorUnlocked;
  const isSelectedMinRosterMet = currentCfg.gateType === 'minRoster' ? unlockedCardIds.length >= currentCfg.gateValue : true;
  const canProceed = isSelectedUnlocked && isSelectedMinRosterMet;

  const handleSelect = (floorNum: number) => {
    const cfg = FLOOR_CONFIG[floorNum];
    if (!cfg) return;

    if (floorNum > highestFloorUnlocked) {
      setErrorMessage(`Floor ${floorNum} is locked. Defeat Floor ${floorNum - 1} Boss to unlock.`);
      onSelectFloor(floorNum);
      return;
    }

    if (cfg.gateType === 'minRoster' && unlockedCardIds.length < cfg.gateValue) {
      setErrorMessage(`Floor ${floorNum} requires at least ${cfg.gateValue} cards unlocked in Roster (you currently have ${unlockedCardIds.length}).`);
      onSelectFloor(floorNum);
      return;
    }

    setErrorMessage('');
    onSelectFloor(floorNum);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative" id="viewport-floor-choice-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none rounded-2xl" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all border border-slate-800 cursor-pointer"
            title="Go back to Roster Hub"
            id="floor-choice-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">Sequence Initialization • Step 1</span>
            <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 mt-0.5">
              <Layers className="text-amber-400 w-6 h-6" />
              Floor Alignment & Depth Choice
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select target Floor depth and inspect gate requirements before configuring your deck.
            </p>
          </div>
        </div>

        <button 
          onClick={() => canProceed && onConfirmFloor()}
          disabled={!canProceed}
          className={`px-6 py-3 font-bold rounded-xl transition-all flex items-center gap-2 uppercase tracking-wide text-xs shrink-0 cursor-pointer ${
            canProceed
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_4px_14px_rgba(245,158,11,0.2)]'
              : 'bg-slate-800 text-slate-600 border border-slate-750 cursor-not-allowed'
          }`}
          id="confirm-floor-btn"
        >
          <span>Confirm Floor {selectedFloor} & Configure Deck</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* BANKED ESSENCE BONUS PREVIEW */}
      {selectedFloor === 1 && bankedEssence && bankedEssence.available && bankedEssence.amount > 0 && (
        <div className="bg-amber-950/70 border border-amber-500/50 rounded-xl p-3 text-amber-300 font-mono text-xs flex items-center gap-2 shadow-md animate-fade-in" id="floorchoice-banked-bonus-preview">
          <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Banked Reserve Bonus: <strong className="text-amber-200 font-bold">+{bankedEssence.amount} ESS</strong> will be added to your starting Run Essence when launching Floor 1.</span>
        </div>
      )}

      {/* ERROR / WARNING BANNER */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl font-mono flex items-center gap-2 animate-fade-in">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FLOOR SELECTION GRID */}
      <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800/80 flex flex-col gap-4" id="floor-grid-container">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            Target Floor Selection (Highest Unlocked: Floor {highestFloorUnlocked})
          </span>
          <span className="text-slate-500">Click a floor card to inspect alignment specs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(floorNum => {
            const cfg = FLOOR_CONFIG[floorNum];
            const flavor = FLOOR_FLAVOR[floorNum];
            const isUnlocked = floorNum <= highestFloorUnlocked;
            const isMinRosterMet = cfg.gateType === 'minRoster' ? unlockedCardIds.length >= cfg.gateValue : true;
            const isSelectable = isUnlocked && isMinRosterMet;
            const isSelected = selectedFloor === floorNum;
            const pwrCap = POWER_LEVEL_CAP[floorNum];

            return (
              <div 
                key={`floor-card-${floorNum}`}
                onClick={() => handleSelect(floorNum)}
                id={`floor-choice-card-${floorNum}`}
                className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between min-h-56 relative group cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/50'
                    : isSelectable
                    ? 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/40'
                    : 'border-slate-850 bg-slate-950/20 opacity-50 cursor-not-allowed'
                }`}
              >
                {isUnlocked ? (
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className={`text-sm font-bold font-display block ${isSelected ? 'text-amber-400' : 'text-slate-100'}`}>
                          Floor {floorNum}: {flavor.name}
                        </span>
                      </div>
                      {!isMinRosterMet ? (
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 italic mb-2.5 leading-tight">
                      "{flavor.description}"
                    </p>

                    <div className="space-y-1 border-t border-slate-850 pt-2">
                      <span className="text-xs font-mono block text-slate-300">
                        {cfg.numLayers} Layers Map
                      </span>

                      {cfg.gateType === 'minRoster' ? (
                        <span className={`text-[10px] font-mono block ${isMinRosterMet ? 'text-slate-400' : 'text-rose-400 font-bold'}`}>
                          {cfg.gateValue === 0 ? 'Introductory (No Roster Gate)' : `Gate: Min ${cfg.gateValue} Roster Cards`}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono block text-sky-400 font-bold">
                          Gate: Max {cfg.gateValue} Deck Cap
                        </span>
                      )}

                      <span className="text-[10px] font-mono block text-amber-400">
                        Power Cap: {pwrCap !== null ? `${pwrCap.toFixed(1)} PWR` : 'Unlimited'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full py-4">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold font-display text-slate-500">
                        Floor {floorNum}: {flavor.name}
                      </span>
                      <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 italic mt-auto">
                      Defeat Floor {floorNum - 1} Boss to unlock
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center mt-2">
                  <span className={`text-[9px] font-mono uppercase font-bold ${
                    isSelected ? 'text-amber-400' : isSelectable ? 'text-emerald-400' : 'text-rose-500'
                  }`}>
                    {isSelected ? 'Selected' : isSelectable ? 'Selectable' : !isUnlocked ? 'Locked' : 'Gated'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    Depth {floorNum}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
