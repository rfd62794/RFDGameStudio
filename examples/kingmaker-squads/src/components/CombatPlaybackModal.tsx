/**
 * Deterministic Auto-Combat Playback Modal for KingMaker Squads
 */

import React, { useState, useEffect } from 'react';
import { CombatResult, CombatFrame, UnitState, CombatUnit, CombatAction } from '../types';
import { ChessIcon } from './ChessIcon';
import { UnitCard, ZODIAC_GLYPHS, ZODIAC_ELEMENTS, ELEMENT_BORDER_CLASSES, getZodiacElement, ZodiacElement } from './UnitCard';
import { BOARD_SIZE } from '../constants';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Play, Pause, FastForward, SkipForward, Swords, Shield, Crown, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';

export { ZODIAC_GLYPHS, ZODIAC_ELEMENTS, ELEMENT_BORDER_CLASSES, getZodiacElement };
export type { ZodiacElement };

export function getGridCardStyle(unit: CombatUnit, isActor: boolean, isTarget: boolean) {
  const { element, elementBorderClass } = getZodiacElement(unit.zodiac);

  let borderAndRing = `bg-zinc-900/90 border ${elementBorderClass}`;
  if (unit.currentHp <= 0) {
    borderAndRing = 'bg-zinc-950/30 border border-zinc-900 opacity-30 grayscale';
  } else if (isActor) {
    borderAndRing = 'bg-amber-950/90 border-2 border-amber-400 ring-2 ring-amber-400/60 scale-105 z-20 shadow-lg';
  } else if (isTarget) {
    borderAndRing = 'bg-rose-950/90 border-2 border-rose-500 ring-2 ring-rose-500/60 scale-105 animate-pulse z-20 shadow-lg';
  }

  return {
    element,
    elementBorderClass,
    borderAndRing,
    isTargetHighlight: isTarget && borderAndRing.includes('ring-2 ring-rose-500'),
  };
}

export function getFloatingDamageText(log?: CombatAction): string | null {
  if (!log || log.value === undefined) return null;
  if (log.actionType === 'attack') {
    return log.isCritical ? `⚡ CRIT -${log.value}` : `-${log.value}`;
  }
  if (log.actionType === 'heal') {
    return `+${log.value}`;
  }
  return null;
}

interface CombatPlaybackModalProps {
  result: CombatResult;
  cellName: string;
  onClose: (updatedSurvivors: UnitState[], dethronedUnit?: UnitState) => void;
}

export const CombatPlaybackModal: React.FC<CombatPlaybackModalProps> = ({
  result,
  cellName,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);

  const totalSteps = result.frames.length;
  const currentFrame: CombatFrame = result.frames[currentStep] || result.frames[0];

  // Auto playback timer
  useEffect(() => {
    if (!isPlaying || currentStep >= totalSteps - 1) return;

    const intervalMs = Math.round(1000 / speed);
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= totalSteps - 1) {
          setIsPlaying(false);
          // Play sound / trigger confetti if player won
          if (result.winner === 'player') {
            soundFx.playVictoryFanfare();
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          } else {
            soundFx.playDethronedRumble();
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentStep, totalSteps, speed, result.winner]);

  // Handle step sound effects
  useEffect(() => {
    if (!currentFrame?.log) return;
    const action = currentFrame.log.actionType;
    if (action === 'attack') soundFx.playAttackSlash();
    else if (action === 'heal') soundFx.playSpellChime();
    else if (action === 'escort_save') soundFx.playShieldThud();
  }, [currentStep]);

  const isFinished = currentStep >= totalSteps - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-amber-600/40 rounded-2xl max-w-5xl w-full p-4 md:p-6 shadow-2xl flex flex-col gap-4 relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase text-amber-400">Battle Resolution</span>
            <h2 className="text-base md:text-lg font-black text-amber-100 font-serif flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" /> Battle for {cellName}
            </h2>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSpeed(1)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded ${speed === 1 ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'}`}
            >
              1x
            </button>
            <button
              onClick={() => setSpeed(2)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded ${speed === 2 ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'}`}
            >
              2x
            </button>
            <button
              onClick={() => setSpeed(4)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded ${speed === 4 ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'}`}
            >
              4x
            </button>
            <button
              onClick={() => {
                setCurrentStep(totalSteps - 1);
                setIsPlaying(false);
              }}
              className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:text-amber-300"
              title="Skip to End"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BATTLE ARENA GRID (8x8 Chess Board) */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-3 md:p-4 min-h-[360px] flex flex-col justify-between relative overflow-hidden">
          {/* Header Team Status */}
          <div className="flex items-center justify-between text-xs font-bold font-mono mb-2 z-10 px-1">
            <span className="text-amber-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Rebel Cell (Formation Cols A-B)
            </span>
            <span className="text-zinc-500 font-normal text-[11px]">Center Control (Cols C-F)</span>
            <span className="text-rose-400 flex items-center gap-1.5 justify-end">
              Opposing Forces (Formation Cols G-H) <Swords className="w-4 h-4" />
            </span>
          </div>

          {/* 8x8 Grid Board */}
          <div className="grid grid-cols-8 gap-1 aspect-square max-w-2xl mx-auto w-full my-auto p-2 bg-zinc-950 border-2 border-zinc-800 rounded-xl shadow-2xl relative">
            {/* Movement / Attack Arrow Overlay Layer */}
            {currentFrame.log.gridFrom && currentFrame.log.gridTo && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 p-2">
                <defs>
                  <marker
                    id="arrow-player"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                  </marker>
                  <marker
                    id="arrow-enemy"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
                  </marker>
                </defs>
                {(() => {
                  const from = currentFrame.log.gridFrom!;
                  const to = currentFrame.log.gridTo!;
                  // Map cell (x,y) on BOARD_SIZE x BOARD_SIZE board to percentage coordinates
                  const cellPercent = 100 / BOARD_SIZE;
                  const x1 = `${from.x * cellPercent + cellPercent / 2}%`;
                  const y1 = `${from.y * cellPercent + cellPercent / 2}%`;
                  const x2 = `${to.x * cellPercent + cellPercent / 2}%`;
                  const y2 = `${to.y * cellPercent + cellPercent / 2}%`;
                  const isPlayerActor = currentFrame.units.find((u) => u.id === currentFrame.log.actorId)?.team === 'player';
                  const strokeColor = isPlayerActor ? '#3B82F6' : '#EF4444';
                  const markerId = isPlayerActor ? 'url(#arrow-player)' : 'url(#arrow-enemy)';

                  return (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={strokeColor}
                      strokeWidth="3.5"
                      strokeDasharray={currentFrame.log.actionType === 'move' ? '6,4' : undefined}
                      markerEnd={markerId}
                      className="animate-pulse drop-shadow-md"
                    />
                  );
                })()}
              </svg>
            )}

            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
              const x = idx % BOARD_SIZE;
              const y = Math.floor(idx / BOARD_SIZE);

              const unitOnSquare = currentFrame.units.find(
                (u) => u.position.x === x && u.position.y === y
              );

              const isActorSquare =
                currentFrame.log.gridFrom &&
                currentFrame.log.gridFrom.x === x &&
                currentFrame.log.gridFrom.y === y;

              const isTargetSquare =
                currentFrame.log.gridTo &&
                currentFrame.log.gridTo.x === x &&
                currentFrame.log.gridTo.y === y;

              const isChecker = (x + y) % 2 === 0;

              return (
                <div
                  key={`${x}-${y}`}
                  className={`relative rounded-lg p-0.5 flex flex-col justify-between border transition-all ${
                    isChecker ? 'bg-zinc-900/90' : 'bg-zinc-950/90'
                  } ${
                    x <= 1
                      ? 'border-amber-950/40'
                      : x >= 2 && x <= 5
                      ? 'border-zinc-800'
                      : 'border-rose-950/40'
                  } ${
                    isActorSquare
                      ? 'ring-2 ring-amber-400 bg-amber-950/50'
                      : isTargetSquare
                      ? 'ring-2 ring-rose-500 bg-rose-950/50 animate-pulse'
                      : ''
                  }`}
                >
                  {/* Grid Coord Label */}
                  <span className="text-[8px] font-mono text-zinc-600 absolute top-0.5 left-1 pointer-events-none">
                    {String.fromCharCode(65 + x)}
                    {y + 1}
                  </span>

                  {unitOnSquare ? (
                    <GridUnitCard
                      unit={unitOnSquare}
                      activeActorId={currentFrame.log.actorId}
                      activeTargetId={currentFrame.log.targetId}
                      currentLog={currentFrame.log}
                    />
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Log Event Banner */}
          <div className="mt-3 p-2.5 rounded-lg bg-zinc-950/90 border border-amber-500/30 text-xs font-mono text-amber-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="truncate">{currentFrame.log.description}</span>
          </div>
        </div>

        {/* COMBAT LOG FEED & RESULTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Log Stream */}
          <div className="md:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 h-36 overflow-y-auto space-y-1 text-[11px] font-mono">
            {result.frames.slice(0, currentStep + 1).map((f, i) => (
              <div
                key={i}
                className={`p-1 rounded ${
                  f.log.actionType === 'escort_save'
                    ? 'bg-blue-950/80 text-blue-200 border border-blue-500/50 font-bold'
                    : f.log.actionType === 'defeat'
                    ? 'text-rose-400'
                    : 'text-zinc-400'
                }`}
              >
                {f.log.description}
              </div>
            ))}
          </div>

          {/* Summary / Outcome Panel */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-500">Battle Outcome</span>
              <h4
                className={`text-base font-black uppercase tracking-wider font-serif ${
                  result.winner === 'player' ? 'text-amber-400' : 'text-rose-500'
                }`}
              >
                {result.winner === 'player' ? 'VICTORY' : 'DEFEAT'}
              </h4>

              {result.kingAction === 'escaped_dethroned' && (
                <div className="mt-2 p-1.5 rounded bg-blue-950/80 border border-blue-500/40 text-[10px] text-blue-200 leading-tight">
                  <span className="font-bold block text-blue-300">🛡️ ESCORT ESCAPE!</span>
                  Knight protected Cell Leader. Leader escaped ousted with Honor Scar.
                </div>
              )}

              {result.kingAction === 'killed' && (
                <div className="mt-2 p-1.5 rounded bg-rose-950/80 border border-rose-500/40 text-[10px] text-rose-200 leading-tight">
                  <span className="font-bold block text-rose-300">👑 CELL LEADER FALLEN!</span>
                  Leadership transition required for next highest-ranked survivor.
                </div>
              )}
            </div>

            <button
              onClick={() => onClose(result.playerSurvivors, result.dethronedUnit)}
              disabled={!isFinished}
              className="w-full mt-3 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-md"
            >
              {isFinished ? 'Claim & Continue' : 'Resolving Battle...'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GridUnitCard: React.FC<{
  unit: CombatUnit;
  activeActorId: string;
  activeTargetId?: string;
  currentLog?: CombatAction;
}> = ({ unit, activeActorId, activeTargetId, currentLog }) => {
  const isActor = unit.id === activeActorId;
  const isTarget = unit.id === activeTargetId;
  const hpPercent = Math.max(0, Math.round((unit.currentHp / unit.stats.maxHp) * 100));

  const { borderAndRing } = getGridCardStyle(unit, isActor, isTarget);
  const floatingText = isTarget ? getFloatingDamageText(currentLog) : null;

  return (
    <div className={`h-full w-full rounded-md transition-all relative ${borderAndRing}`}>
      {/* Floating Damage / Healing Overlay */}
      {floatingText && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono shadow-xl border whitespace-nowrap ${
              currentLog?.isCritical
                ? 'bg-rose-600 text-yellow-300 border-yellow-300 scale-110'
                : currentLog?.actionType === 'heal'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                : 'bg-rose-950 text-rose-200 border-rose-500'
            }`}
          >
            {floatingText}
          </span>
        </div>
      )}

      <UnitCard unit={unit} isKing={unit.isKing} className="h-full w-full border-0 bg-transparent p-1 shadow-none">
        {/* HP Bar */}
        <div className="mt-0.5 px-0.5">
          <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-zinc-400 mt-0.5 leading-none">
            <span>{unit.currentHp}HP</span>
          </div>
        </div>
      </UnitCard>
    </div>
  );
};

