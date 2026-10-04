import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { GameState } from '../types';

interface BrokenForceBannerProps {
  event: GameState['lastBrokenForceEvent'];
  onDismiss: () => void;
}

export function BrokenForceBanner({ event, onDismiss }: BrokenForceBannerProps) {
  if (!event) return null;

  return (
    <div className="bg-gradient-to-r from-rose-950 via-zinc-900 to-rose-950 border-b border-rose-500/80 py-2.5 px-4 text-center text-xs text-rose-200 font-serif flex items-center justify-center gap-2 shadow-lg animate-fade-in">
      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
      <span>
        <strong className="text-rose-300">GARRISON LOYALTY COLLAPSED:</strong> {event.forceName} at {event.cellName} broke under unreinforced threat! The district fell to opposing forces without combat.
      </span>
      <button
        onClick={onDismiss}
        className="ml-3 text-zinc-400 hover:text-rose-200 text-xs font-mono underline shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}
