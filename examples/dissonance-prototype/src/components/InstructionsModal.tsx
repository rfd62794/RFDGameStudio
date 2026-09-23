import React from 'react';
import { HelpCircle, X } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export default function InstructionsModal({ onClose }: InstructionsModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      id="instructions-modal-overlay"
    >
      <div 
        className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 md:p-8 max-w-lg w-full flex flex-col gap-6 text-left shadow-2xl relative"
        id="instructions-modal-card"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-display font-bold text-slate-100 text-lg">
              Station Directives & Fragment Mechanics
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
            id="close-instructions-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verbatim Instructions Content */}
        <div className="flex flex-col gap-4 text-sm text-slate-300 font-sans leading-relaxed">
          <p className="italic text-slate-200 bg-slate-950/60 border-l-2 border-amber-500/80 p-4 rounded-r-xl shadow-inner font-serif">
            "I'm Fragments now — Ember, Ash, Spark, Cinder, however I've come apart. Combine two of us, and something happens. The same piece twice is safe. Pieces beside each other, a little unstable. Pieces opposed... that one's a real gamble."
          </p>

          <p className="italic text-slate-200 bg-slate-950/60 border-l-2 border-sky-500/80 p-4 rounded-r-xl shadow-inner font-serif">
            "Combinations are found, not learned by playing — win a fight or take the right offer, and it's yours, permanently, every run after this."
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-md uppercase tracking-wider text-xs font-display cursor-pointer"
            id="understand-instructions-btn"
          >
            Acknowledge Directives
          </button>
        </div>
      </div>
    </div>
  );
}
