import React from 'react';

interface FirstGoalCardProps {
  onDismiss: () => void;
}

export const FirstGoalCard: React.FC<FirstGoalCardProps> = ({ onDismiss }) => (
  <div
    id="first-goal-card"
    className="absolute left-3 right-3 bottom-3 md:right-auto md:max-w-sm z-10 bg-[#0c101d]/95 border border-cyan-700/60 rounded-xl p-3 text-xs text-slate-200 shadow-xl"
  >
    <div className="font-semibold text-cyan-300 mb-1">Your first goal: collect 100 Structural Solid</div>
    <p className="text-slate-300 leading-relaxed">
      Debris drifts down from the top. The collector catches it, the compressor squeezes it into solid, and the bin keeps it.
      Want it faster? Open the brush and paint some dust above the collector.
    </p>
    <button
      id="first-goal-dismiss"
      onClick={onDismiss}
      className="mt-2 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
    >
      Got it
    </button>
  </div>
);
