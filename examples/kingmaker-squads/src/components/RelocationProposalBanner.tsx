import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { GameState } from '../types';

interface RelocationProposalBannerProps {
  proposal: GameState['proposedDefenseRelocation'];
  onAccept: () => void;
  onReject: () => void;
}

export function RelocationProposalBanner({
  proposal,
  onAccept,
  onReject,
}: RelocationProposalBannerProps) {
  if (!proposal) return null;

  return (
    <div className="bg-gradient-to-r from-blue-950 via-zinc-900 to-blue-950 border-b border-blue-500/50 py-2.5 px-4 text-center text-xs text-blue-200 font-serif flex items-center justify-center gap-3 shadow-lg animate-fade-in">
      <ShieldAlert className="w-4 h-4 text-blue-400 fill-current" />
      <span>
        <strong>DEFENSE FORCE RELOCATION PROPOSAL:</strong> An exposed territory cell requires coverage! Relocate freed Defense Force?
      </span>
      <div className="flex items-center gap-2 ml-2">
        <button
          onClick={onAccept}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-zinc-100 font-mono text-xs rounded transition font-bold"
        >
          Accept Relocation
        </button>
        <button
          onClick={onReject}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs rounded transition"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
