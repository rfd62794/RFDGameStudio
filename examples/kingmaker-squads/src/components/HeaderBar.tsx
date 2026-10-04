/**
 * Header Bar for KingMaker Squads
 */

import React, { useEffect } from 'react';
import { ChessIcon } from './ChessIcon';
import { RestartButton } from './RestartButton';
import { soundFx } from '../utils/audio';
import { Shield, Volume2, VolumeX, HelpCircle, Crown, Sparkles, Swords, ShieldAlert } from 'lucide-react';
import { DefenseForce, UnitState } from '../types';

interface HeaderBarProps {
  turn: number;
  gold: number;
  territoryPercent: number;
  kingUnit: UnitState | null;
  kingSettlingTurns: number;
  hasEscort: boolean;
  isMuted: boolean;
  defenseForces?: DefenseForce[];
  selectedSquadId?: string;
  onSelectSquad?: (squadId: string) => void;
  onToggleMute: () => void;
  onOpenCodex: () => void;
  onRestartGame: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  turn,
  gold,
  territoryPercent,
  kingUnit,
  kingSettlingTurns,
  hasEscort,
  isMuted,
  defenseForces = [],
  selectedSquadId = 'forward',
  onSelectSquad,
  onToggleMute,
  onOpenCodex,
  onRestartGame,
}) => {
  // RTS Control Groups keyboard hotkeys (Key1 to Key9, Key0 for All)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === '0' || e.key === '`') {
        onSelectSquad?.('all');
        soundFx.playBuy();
        return;
      }

      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
        if (keyNum === 1) {
          onSelectSquad?.('forward');
          soundFx.playBuy();
        } else {
          const dfIndex = keyNum - 2;
          if (dfIndex < defenseForces.length) {
            onSelectSquad?.(defenseForces[dfIndex].id);
            soundFx.playBuy();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [defenseForces, onSelectSquad]);

  return (
    <header className="bg-zinc-950/90 border-b border-amber-900/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-zinc-200 shadow-md backdrop-blur-md sticky top-0 z-40">
      {/* Title / Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-900 flex items-center justify-center shadow-lg shadow-amber-950/50 border border-amber-400/30">
          <ChessIcon type="crown" className="w-5 h-5 text-amber-100" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-wider text-amber-200 uppercase font-serif flex items-center gap-1.5 leading-none">
            KingMaker <span className="text-zinc-400 text-xs font-sans tracking-normal font-medium">Squads</span>
          </h1>
          <p className="text-[10px] text-zinc-500 font-mono leading-none mt-1">The Front • Turn {turn}</p>
        </div>
      </div>

      {/* RTS Persistent Squad Strip */}
      <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded-lg shadow-inner">
        <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Forces:</span>
        {/* All Squads Overview */}
        <button
          onClick={() => onSelectSquad?.('all')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition border ${
            selectedSquadId === 'all'
              ? 'bg-purple-600 text-zinc-100 border-purple-400 font-bold shadow-sm'
              : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
          }`}
          title="All Squads Overview (Hotkey [0])"
        >
          <span className="text-[9px] bg-zinc-900/80 text-purple-300 px-1 rounded border border-purple-500/30">0</span>
          <Shield className="w-3 h-3 text-purple-400" />
          <span>All</span>
        </button>

        {/* Forward Squad (Group 1) */}
        <button
          onClick={() => onSelectSquad?.('forward')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition border ${
            selectedSquadId === 'forward'
              ? 'bg-amber-600 text-zinc-950 border-amber-400 font-bold shadow-sm'
              : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
          }`}
          title="Forward Vanguard Squad (Hotkey [1])"
        >
          <span className="text-[9px] bg-zinc-900/80 text-amber-300 px-1 rounded border border-amber-500/30">1</span>
          <Swords className="w-3 h-3" />
          <span>Forward</span>
        </button>

        {/* Defense Forces (Groups 2-9) */}
        {defenseForces.map((df, idx) => {
          const isSelected = selectedSquadId === df.id;
          const hotkeyNum = idx + 2;
          return (
            <button
              key={df.id}
              onClick={() => onSelectSquad?.(df.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition border ${
                isSelected
                  ? 'bg-blue-600 text-zinc-100 border-blue-400 font-bold shadow-sm'
                  : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
              title={`${df.name} (Hotkey [${hotkeyNum}])`}
            >
              <span className="text-[9px] bg-zinc-900/80 text-blue-300 px-1 rounded border border-blue-500/30">{hotkeyNum}</span>
              <ShieldAlert className="w-3 h-3 text-blue-400" />
              <span className="max-w-[70px] truncate">{df.name.replace('Defense Force', 'DF')}</span>
            </button>
          );
        })}
      </div>

      {/* Main Indicators */}
      <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
        {/* Gold */}
        <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-md border border-amber-500/30 shadow-inner">
          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/40">
            $
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-400 block leading-none">Gold</span>
            <span className="text-sm font-bold text-amber-300 font-mono leading-none">{gold}g</span>
          </div>
        </div>

        {/* Territory Control */}
        <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-md border border-zinc-800 shadow-inner">
          <Shield className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-xs font-medium text-zinc-400 block leading-none">Territory</span>
            <span className="text-sm font-bold text-emerald-400 font-mono leading-none">{territoryPercent}%</span>
          </div>
        </div>

        {/* King Status Badge */}
        <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-md border border-amber-600/40 shadow-inner">
          <ChessIcon type="crown" className="w-4 h-4 text-amber-400" />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-zinc-300">Leader:</span>
              <span className="text-xs font-bold text-amber-300 truncate max-w-[100px]">
                {kingUnit ? kingUnit.name : 'No Leader'}
              </span>
            </div>
            <div className="text-[10px] font-mono leading-none mt-0.5">
              {kingSettlingTurns > 0 ? (
                <span className="text-rose-400 font-bold animate-pulse flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Settling ({kingSettlingTurns}t vulnerable)
                </span>
              ) : hasEscort ? (
                <span className="text-blue-400 font-medium flex items-center gap-0.5">
                  🛡️ Escorted (Knight)
                </span>
              ) : (
                <span className="text-zinc-500">Hidden (Secure)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className="p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={onOpenCodex}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-600/40 text-xs font-medium transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Codex</span>
        </button>

        <RestartButton onConfirm={onRestartGame} />
      </div>
    </header>
  );
};
