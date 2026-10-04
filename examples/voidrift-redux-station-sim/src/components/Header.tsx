import React from 'react';
import { GameState } from '../services/simulation';
import { soundEngine } from '../services/audio';
import {
  Zap,
  Layers,
  Volume2,
  VolumeX,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Save,
} from 'lucide-react';

interface Props {
  gameState: GameState;
  onSetGameSpeed: (speed: number) => void;
  onTogglePause: () => void;
  onResetGame: () => void;
  onSaveGame: () => void;
  onOpenHelp: () => void;
  onOpenCollisionLogs: () => void;
}

export const Header: React.FC<Props> = ({
  gameState,
  onSetGameSpeed,
  onTogglePause,
  onResetGame,
  onSaveGame,
  onOpenHelp,
  onOpenCollisionLogs,
}) => {
  const isMuted = soundEngine.getMuted();
  const powerBalance = gameState.totalPowerGenerated - gameState.totalPowerConsumed;
  const isPowerDeficit = powerBalance < 0;

  const unresolvedCollisions = gameState.collisionLogs.filter((c) => !c.resolved).length;

  return (
    <header className="w-full bg-[#080d1a] border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 select-none z-30">
      {/* Brand & Station Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-mono font-bold text-sm shadow-inner">
          VR
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-100 tracking-wide">VOIDRIFT REDUX</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              RECONSTRUCTION PROTOCOL
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Directives loaded • Horizon Sector Omega
          </p>
        </div>
      </div>

      {/* Core Resources: Dust, Power, Prestige Multiplier */}
      <div className="flex items-center gap-3 md:gap-6 flex-wrap">
        {/* Dust Feedstock */}
        <div
          id="res-dust-counter"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/60 shadow-sm"
          title="Universal Carbon Dust feedstock for station construction & repairs"
        >
          <Layers className="w-4 h-4 text-slate-300" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-medium leading-none">
              Carbon Dust
            </span>
            <div className="text-sm font-mono font-bold text-slate-100 flex items-baseline gap-1">
              <span>{Math.floor(gameState.dust)}</span>
              <span className="text-[10px] text-slate-400 font-normal">/ {gameState.maxDust}</span>
            </div>
          </div>
        </div>

        {/* Power Grid */}
        <div
          id="res-power-counter"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border shadow-sm ${
            isPowerDeficit ? 'border-red-500/60 text-red-400' : 'border-slate-700/60 text-amber-300'
          }`}
          title="Station Power Grid balance"
        >
          <Zap className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-medium leading-none">
              Power Grid
            </span>
            <div className="text-sm font-mono font-bold flex items-baseline gap-1">
              <span>{gameState.totalPowerGenerated} kW</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (req {gameState.totalPowerConsumed} kW)
              </span>
            </div>
          </div>
        </div>

        {/* Prestige Multiplier (from reconstructed stars) */}
        {gameState.stats.starsReconstructed > 0 && (
          <div
            id="res-prestige-multiplier"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/40 text-purple-300 shadow-sm"
            title="Cosmic Cascade Multiplier from Rekindled Stars"
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            <div className="flex flex-col">
              <span className="text-[10px] text-purple-400 uppercase font-mono font-medium leading-none">
                Cascade Multiplier
              </span>
              <div className="text-sm font-mono font-bold">
                {gameState.stats.prestigeMultiplier.toFixed(2)}x
              </div>
            </div>
          </div>
        )}

        {/* Collision Warning Indicator if any unresolved events */}
        {unresolvedCollisions > 0 && (
          <button
            id="btn-open-collision-logs"
            onClick={onOpenCollisionLogs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 hover:bg-red-900/60 transition-colors animate-pulse"
            title="View recent asteroid collision impact reports"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-xs font-mono font-medium">{unresolvedCollisions} Impact(s)</span>
          </button>
        )}
      </div>

      {/* Control Buttons: Time Speed, Audio, Help, Reset */}
      <div className="flex items-center gap-2">
        {/* Speed Controls */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            id="btn-toggle-pause"
            onClick={onTogglePause}
            className={`p-1.5 rounded text-xs transition-colors ${
              gameState.isPaused
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={gameState.isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {gameState.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-speed-1x"
            onClick={() => onSetGameSpeed(1)}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              gameState.gameSpeed === 1 && !gameState.isPaused
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="1x Speed"
          >
            1x
          </button>
          <button
            id="btn-speed-2x"
            onClick={() => onSetGameSpeed(2)}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              gameState.gameSpeed === 2 && !gameState.isPaused
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="2x Speed"
          >
            2x
          </button>
          <button
            id="btn-speed-5x"
            onClick={() => onSetGameSpeed(5)}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              gameState.gameSpeed === 5 && !gameState.isPaused
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="5x Hyper Speed"
          >
            5x
          </button>
        </div>

        {/* Audio Toggle */}
        <button
          id="btn-toggle-audio"
          onClick={() => {
            soundEngine.startAmbient();
            soundEngine.toggleMute();
          }}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title={isMuted ? 'Unmute Procedural Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Manual / Help */}
        <button
          id="btn-open-help-manual"
          onClick={onOpenHelp}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Directives Manual & Mechanics Guide"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Save */}
        <button
          id="btn-save-game"
          onClick={onSaveGame}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Save Station State"
        >
          <Save className="w-4 h-4 text-slate-300" />
        </button>

        {/* Reset */}
        <button
          id="btn-reset-game"
          onClick={onResetGame}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          title="Reset Station & Start Over"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
