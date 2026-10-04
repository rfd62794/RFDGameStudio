import React from 'react';
import { Crown } from 'lucide-react';
import { GameState } from '../types';

interface CoronationBannerProps {
  event: GameState['lastCoronationEvent'];
  onDismiss: () => void;
}

export function CoronationBanner({ event, onDismiss }: CoronationBannerProps) {
  if (!event) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-b border-amber-500/50 py-2.5 px-4 text-center text-xs text-amber-200 font-serif flex items-center justify-center gap-2 shadow-lg animate-fade-in">
      <Crown className="w-4 h-4 text-amber-400 fill-current" />
      <span>
        <strong>MANDATORY LEADERSHIP:</strong> {event.unitName} has stepped up as Cell Leader! ({event.reason})
      </span>
      <button
        onClick={onDismiss}
        className="ml-3 text-zinc-400 hover:text-amber-200 text-xs font-mono underline"
      >
        Dismiss
      </button>
    </div>
  );
}
