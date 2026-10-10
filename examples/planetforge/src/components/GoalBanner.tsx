import React from 'react';
import { goalLine, WIN_TITLE, WIN_BODY, LOSE_TITLE, LOSE_BODY, type GoalProgress } from '../goal';

interface GoalBannerProps {
  goal: GoalProgress;
  onRestart: () => void;
}

export const GoalBanner: React.FC<GoalBannerProps> = ({ goal, onRestart }) => {
  const finished = goal.status !== 'playing';
  return (
    <>
      <div role="status" className="w-full px-4 lg:px-8 py-2 text-xs bg-indigo-950/60 border-b border-indigo-800/60 text-indigo-100">
        {goalLine(goal)}
      </div>
      {finished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4" data-testid="pf-goal-finished">
          <div className="max-w-md w-full rounded-2xl border border-indigo-700/60 bg-slate-900 p-6 text-center shadow-2xl">
            <h2 className="text-xl font-extrabold text-white">{goal.status === 'won' ? WIN_TITLE : LOSE_TITLE}</h2>
            <p className="mt-2 text-sm text-slate-300">{goal.status === 'won' ? WIN_BODY : LOSE_BODY}</p>
            <button
              onClick={onRestart}
              className="mt-5 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-bold text-white"
              data-testid="pf-goal-restart"
            >
              {goal.status === 'won' ? 'Play again' : 'Start over'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
