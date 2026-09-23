import React, { useState } from 'react';
import { Sparkles, Play, RotateCcw, BookOpen, Settings, HelpCircle, Landmark } from 'lucide-react';
import InstructionsModal from '../components/InstructionsModal';
import { BankedEssence } from '../types';

interface TitlePhaseProps {
  hasSave: boolean;
  onNewRun: () => void;
  onContinue: () => void;
  onCodex: () => void;
  onSettings: () => void;
  bankedEssence?: BankedEssence;
}

export default function TitlePhase({
  hasSave,
  onNewRun,
  onContinue,
  onCodex,
  onSettings,
  bankedEssence
}: TitlePhaseProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 flex flex-col items-center text-center gap-8 shadow-2xl relative max-w-2xl mx-auto my-4 overflow-hidden" id="viewport-title-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-slate-900/40 to-slate-950 pointer-events-none rounded-2xl" />

      {/* Decorative Branding Badge */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-500/40 rounded-full text-[10px] font-mono text-amber-400 uppercase tracking-widest">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Card-Combination Roguelike</span>
      </div>

      {/* Title Header */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <h1 className="text-4xl md:text-5xl font-display font-black text-slate-100 tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent drop-shadow-md">
          DISSONANCE
        </h1>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent my-1" />
      </div>

      {/* Banked Essence Notice */}
      {bankedEssence && bankedEssence.available && bankedEssence.amount > 0 && (
        <div className="relative z-10 flex items-center gap-2 px-4 py-2 bg-amber-950/80 border border-amber-500/50 rounded-xl text-xs font-mono text-amber-300 shadow-md animate-fade-in" id="title-banked-essence-notice">
          <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Banked Reserve: <strong className="text-amber-200 font-bold">{bankedEssence.amount} ESS</strong> (available for your next fresh start)</span>
        </div>
      )}

      {/* EXACT LOCKED COPY - IN STRICT SPECIFIED ORDER */}
      <div className="relative z-10 flex flex-col gap-4 max-w-lg leading-relaxed text-slate-300">
        {/* Line 1: Genre subtitle */}
        <p className="text-sm text-slate-300 font-sans font-medium">
          A card-combination roguelike. Descend the floors of a dying station, floor by floor, run by run.
        </p>

        {/* Line 2: Pitch line */}
        <p className="text-sm text-slate-300 font-sans">
          She's fracturing, and she's still your guide — recore her before she floors you, and keep everything you find along the way.
        </p>

        {/* Line 3: ECHO's quote (LAST) */}
        <p className="italic text-slate-400 text-xs font-serif bg-slate-950/60 border-l-2 border-amber-500/60 p-3.5 rounded-r-xl text-left shadow-inner">
          "Please piece me back together, every floor costs us something. I can only guide you so long as you hold me together."
        </p>
      </div>

      {/* Navigation Buttons */}
      <nav className="relative z-10 flex flex-col gap-3 w-full max-w-xs mt-2" id="title-navigation-menu">
        <button
          onClick={onNewRun}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs font-display cursor-pointer"
          id="title-new-run-btn"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          New Run
        </button>

        {hasSave && (
          <button
            onClick={onContinue}
            className="w-full py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold border border-amber-500/40 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs font-display cursor-pointer"
            id="title-continue-btn"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Continue
          </button>
        )}

        <button
          onClick={onCodex}
          className="w-full py-3 px-6 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 font-semibold border border-slate-800 rounded-xl transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs font-display cursor-pointer"
          id="title-codex-btn"
        >
          <BookOpen className="w-4 h-4 text-sky-400" />
          Codex
        </button>

        <button
          onClick={() => setShowInstructionsModal(true)}
          className="w-full py-3 px-6 bg-slate-950/80 hover:bg-slate-800 text-sky-300 hover:text-sky-100 font-semibold border border-slate-800 rounded-xl transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs font-display cursor-pointer"
          id="title-instructions-btn"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
          Instructions
        </button>

        <button
          onClick={() => {
            onSettings();
            setShowSettingsModal(true);
          }}
          className="w-full py-3 px-6 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold border border-slate-800 rounded-xl transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs font-display cursor-pointer"
          id="title-settings-btn"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          Settings
        </button>
      </nav>

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <InstructionsModal onClose={() => setShowInstructionsModal(false)} />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 text-left shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-display font-bold text-slate-200 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Station Calibrations
              </span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-mono"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-400 font-mono flex flex-col gap-2">
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-850">
                <span>Audio Synthesis</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-850">
                <span>Fast Combat Animations</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-850">
                <span>Display Resolution</span>
                <span className="text-sky-400 font-bold">Adaptive</span>
              </div>
            </div>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
