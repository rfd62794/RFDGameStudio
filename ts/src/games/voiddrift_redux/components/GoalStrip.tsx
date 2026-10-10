import React from 'react';
import { h3GoalProgress } from '../simulation/goal';

interface GoalStripProps {
  h3Gas: number;
}

export const GoalStrip: React.FC<GoalStripProps> = ({ h3Gas }) => {
  const goal = h3GoalProgress(h3Gas);
  return (
    <div id="voiddrift-goal-strip" className="bg-slate-900 border border-pink-900/50 rounded-xl px-4 py-3 font-mono text-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-pink-300 font-bold uppercase tracking-wider">Goal: collect 100 H3 Gas</span>
        <span className="text-slate-200">{goal.current} / {goal.target}</span>
      </div>
      <div className="mt-2 h-1.5 rounded bg-slate-800 overflow-hidden">
        <div className="h-full bg-pink-400" style={{ width: `${goal.percent}%` }} />
      </div>
      {goal.reached && (
        <p className="mt-2 text-emerald-300">Goal reached. The drift has no end, so keep mining as long as you like.</p>
      )}
    </div>
  );
};
