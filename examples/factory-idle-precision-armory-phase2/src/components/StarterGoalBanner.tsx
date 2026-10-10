// new: examples/factory-idle-precision-armory-phase2/src/components/StarterGoalBanner.tsx
import React from 'react';
import { starterGoalProgress, starterHint } from '../engine/starterGoal';
import type { GameMetrics } from '../types';

interface StarterGoalBannerProps {
  metrics: Pick<GameMetrics, 'fulfilledOrders'>;
  onDismiss: () => void;
}

export const StarterGoalBanner: React.FC<StarterGoalBannerProps> = ({ metrics, onDismiss }) => {
  const progress = starterGoalProgress(metrics);
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 px-4 py-2 text-xs bg-amber-950/60 border-b border-amber-800/70 text-amber-100"
    >
      <span>{starterHint(progress)}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 px-2 py-0.5 rounded border border-amber-700 text-amber-200 hover:bg-amber-900/60"
      >
        Got it
      </button>
    </div>
  );
};
