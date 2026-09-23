import React, { useState } from 'react';
import { Landmark, ArrowRight, ShieldCheck, Forward, CheckCircle } from 'lucide-react';
import { RunState, BankedEssence } from '../types';

interface PassagePhaseProps {
  runState: RunState;
  onProceed: (newBanked?: BankedEssence, remainingEssence?: number) => void;
}

export default function PassagePhase({ runState, onProceed }: PassagePhaseProps) {
  const [chosen, setChosen] = useState<'none' | 'banked' | 'skipped'>('none');
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const currentEssence = runState.essence;
  const bankHalfAmount = Math.floor(currentEssence / 2);
  const remainingAfterBank = currentEssence - bankHalfAmount;

  const handleBank = () => {
    setChosen('banked');
    setConfirmationMessage(`Banked ${bankHalfAmount} ESS safely into persistent reserves! You will enter Floor ${runState.currentFloor + 1} with ${remainingAfterBank} ESS.`);
  };

  const handleSkip = () => {
    setChosen('skipped');
    setConfirmationMessage(`No Essence banked. Proceeding into Floor ${runState.currentFloor + 1} carrying full ${currentEssence} ESS.`);
  };

  const handleConfirmProceed = () => {
    if (chosen === 'banked') {
      const newBank: BankedEssence = {
        amount: bankHalfAmount,
        available: true
      };
      onProceed(newBank, remainingAfterBank);
    } else {
      onProceed(undefined, currentEssence);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative" id="viewport-passage-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none rounded-2xl" />

      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
          Floor {runState.currentFloor} Clear — Inter-Floor Passage
        </span>
        <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 mt-1">
          <Landmark className="text-amber-400 w-6 h-6" />
          The Resonant Threshold
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          You stand at the threshold between floors. You may choose to Bank half of your current Run Essence to reserve for a future fresh run start, or continue with full Essence into the next floor.
        </p>
      </div>

      {/* Essence Summary */}
      <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Current Run Essence</span>
          <span className="text-amber-400 text-xl font-bold font-mono">{currentEssence} ESSENCE</span>
        </div>
        <div className="text-right text-xs font-mono text-slate-400">
          Target Destination: <span className="text-emerald-400 font-bold">Floor {runState.currentFloor + 1}</span>
        </div>
      </div>

      {/* Confirmation Banner if choice made */}
      {confirmationMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs font-mono flex flex-col gap-3 shadow-lg animate-fade-in" id="passage-bank-confirmation">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Passage Calibration Confirmed</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {confirmationMessage}
          </p>
          <button
            onClick={handleConfirmProceed}
            className="self-end px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-display flex items-center gap-2 transition-all shadow-md"
            id="passage-confirm-proceed-btn"
          >
            Proceed into Floor {runState.currentFloor + 1}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bank Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: BANK */}
        <div 
          className="p-5 bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col justify-between gap-4 transition-all group"
          id="passage-option-bank"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 bg-amber-950/50 border border-amber-900/50 text-amber-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40">
                50% Reserve
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-200 mt-3 group-hover:text-amber-300 transition-colors">
              Bank Half Essence
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Store <strong className="text-amber-400 font-mono">{bankHalfAmount} ESS</strong> in persistent reserves (<span className="text-emerald-400">Available</span> for your next fresh start). Continue into Floor {runState.currentFloor + 1} with remaining <strong className="text-amber-400 font-mono">{remainingAfterBank} ESS</strong>.
            </p>
          </div>

          <button
            onClick={handleBank}
            disabled={chosen !== 'none'}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-display flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            Bank {bankHalfAmount} ESS & Proceed
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Option 2: SKIP */}
        <div 
          className="p-5 bg-slate-950/60 border border-slate-800 hover:border-sky-500/50 rounded-2xl flex flex-col justify-between gap-4 transition-all group"
          id="passage-option-skip"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 bg-sky-950/50 border border-sky-900/50 text-sky-400 rounded-xl">
                <Forward className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/30 px-2 py-0.5 rounded border border-sky-900/40">
                100% Momentum
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-200 mt-3 group-hover:text-sky-300 transition-colors">
              Skip Banking (Carry All)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Do not bank any Essence. Carry all <strong className="text-amber-400 font-mono">{currentEssence} ESS</strong> directly into Floor {runState.currentFloor + 1} to maximize current run momentum.
            </p>
          </div>

          <button
            onClick={handleSkip}
            disabled={chosen !== 'none'}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider font-display flex items-center justify-center gap-2 transition-all"
          >
            Carry All {currentEssence} ESS & Proceed
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
