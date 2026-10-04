/**
 * Pre-Combat Formation Placement View for KingMaker Squads
 * Uses real chess movement rules (getLegalMoves & canAttackFrom) to render accurate threat/movement overlays.
 */

import React, { useState } from 'react';
import { UnitState, CombatUnit } from '../types';
import { ChessIcon, RankBadge } from './ChessIcon';
import { getLegalMoves, canAttackFrom, GridPos } from '../utils/chessMovement';
import { BOARD_SIZE } from '../constants';
import { soundFx } from '../utils/audio';
import { Swords, Shield, Crown, ArrowLeft, Zap, Play, Target, Eye } from 'lucide-react';

interface PlacedUnit {
  unit: UnitState;
  position: GridPos;
}

interface PlacementViewProps {
  playerUnits: UnitState[];
  enemyUnits: UnitState[];
  cellName: string;
  onConfirmPlacement: (placements: PlacedUnit[]) => void;
  onCancel?: () => void;
}

export const PlacementView: React.FC<PlacementViewProps> = ({
  playerUnits,
  enemyUnits,
  cellName,
  onConfirmPlacement,
  onCancel,
}) => {
  // Default placement: place player units in cols 0-1
  const [placements, setPlacements] = useState<PlacedUnit[]>(() => {
    return playerUnits.map((unit, idx) => ({
      unit,
      position: {
        x: Math.floor(idx / BOARD_SIZE), // 0 or 1
        y: idx % BOARD_SIZE,
      },
    }));
  });

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Default enemy placement: cols 6-7 (G-H) on 8x8 board
  const enemyPlacements: PlacedUnit[] = enemyUnits.map((unit, idx) => ({
    unit,
    position: {
      x: BOARD_SIZE - 2 + Math.floor(idx / BOARD_SIZE),
      y: idx % BOARD_SIZE,
    },
  }));

  // Build full synthetic CombatUnit list for range and move checks
  const currentCombatUnits: CombatUnit[] = [
    ...placements.map((p) => ({
      id: p.unit.id,
      archetype: p.unit.archetype,
      team: 'player' as const,
      position: p.position,
      stats: { ...p.unit.stats, maxHp: p.unit.stats.hp },
      currentHp: p.unit.stats.hp,
      rank: p.unit.rank,
      isKing: p.unit.isKing || p.unit.id.includes('king'),
      isEscort: p.unit.isEscort,
      name: p.unit.name,
    })),
    ...enemyPlacements.map((p) => ({
      id: p.unit.id,
      archetype: p.unit.archetype,
      team: 'enemy' as const,
      position: p.position,
      stats: { ...p.unit.stats, maxHp: p.unit.stats.hp },
      currentHp: p.unit.stats.hp,
      rank: p.unit.rank,
      isKing: p.unit.isKing || p.unit.id.includes('king'),
      isEscort: p.unit.isEscort,
      name: p.unit.name,
    })),
  ];

  // Currently selected combat unit
  const selectedCombatUnit = currentCombatUnits.find((u) => u.id === selectedUnitId);

  // Compute legal moves overlay if unit selected using real chessMovement logic
  const legalMoveSquares: GridPos[] = selectedCombatUnit
    ? getLegalMoves(selectedCombatUnit, currentCombatUnits)
    : [];

  // Compute attackable enemy units if unit selected using real chessMovement logic
  const attackableEnemies: CombatUnit[] = selectedCombatUnit
    ? currentCombatUnits.filter(
        (u) => u.team === 'enemy' && canAttackFrom(selectedCombatUnit, selectedCombatUnit.position, u, currentCombatUnits)
      )
    : [];

  const handleSquareClick = (x: number, y: number) => {
    soundFx.playBuy();

    // Player deployment zone is cols 0 and 1
    const isPlayerDeploymentZone = x <= 1;

    const clickedPlayerPlacement = placements.find((p) => p.position.x === x && p.position.y === y);

    if (selectedUnitId) {
      if (clickedPlayerPlacement) {
        if (clickedPlayerPlacement.unit.id === selectedUnitId) {
          // Deselect
          setSelectedUnitId(null);
        } else {
          // Swap positions of two player units!
          const selectedP = placements.find((p) => p.unit.id === selectedUnitId);
          if (selectedP) {
            setPlacements((prev) =>
              prev.map((p) => {
                if (p.unit.id === selectedUnitId) return { ...p, position: { x, y } };
                if (p.unit.id === clickedPlayerPlacement.unit.id) return { ...p, position: selectedP.position };
                return p;
              })
            );
          }
          setSelectedUnitId(null);
        }
      } else if (isPlayerDeploymentZone) {
        // Move selected unit to empty deployment square
        setPlacements((prev) =>
          prev.map((p) => (p.unit.id === selectedUnitId ? { ...p, position: { x, y } } : p))
        );
        setSelectedUnitId(null);
      }
    } else if (clickedPlayerPlacement) {
      setSelectedUnitId(clickedPlayerPlacement.unit.id);
    }
  };

  const handleConfirm = () => {
    soundFx.playAttackSlash();
    onConfirmPlacement(placements);
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto pb-24">
      {/* HEADER BAR */}
      <div className="bg-zinc-950/90 border border-amber-600/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
              Pre-Combat Tactical Formation
            </span>
            <span className="text-xs font-mono text-zinc-400">Battle for {cellName}</span>
          </div>
          <h2 className="text-lg font-black text-amber-100 font-serif mt-0.5 flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" /> Formations & Opening Threat Overlays
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
          )}

          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-950/60 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Confirm Formation & Engage
          </button>
        </div>
      </div>

      {/* 8x8 FORMATION BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 8x8 Grid */}
        <div className="lg:col-span-2 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 shadow-2xl flex flex-col justify-between min-h-[440px]">
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-3 px-2">
            <span className="text-amber-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Rebel Deployment Zone (Cols A-B)
            </span>
            <span className="text-zinc-500">Center Control (Cols C-F)</span>
            <span className="text-rose-400 flex items-center gap-1.5">
              Hostile Vanguard (Cols G-H) <Swords className="w-4 h-4" />
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 aspect-square max-w-2xl mx-auto w-full my-auto p-3 bg-zinc-950 border-2 border-zinc-800 rounded-2xl shadow-2xl relative">
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
              const x = idx % BOARD_SIZE;
              const y = Math.floor(idx / BOARD_SIZE);

              const playerP = placements.find((p) => p.position.x === x && p.position.y === y);
              const enemyP = enemyPlacements.find((p) => p.position.x === x && p.position.y === y);

              const isPlayerZone = x <= 1;
              const isSelected = playerP && playerP.unit.id === selectedUnitId;

              const isReachableMove = legalMoveSquares.some((m) => m.x === x && m.y === y);
              const isAttackableTarget = enemyP && attackableEnemies.some((e) => e.position.x === x && e.position.y === y);

              const isChecker = (x + y) % 2 === 0;

              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleSquareClick(x, y)}
                  className={`relative rounded-xl p-1.5 flex flex-col justify-between border cursor-pointer transition-all duration-200 select-none ${
                    isChecker ? 'bg-zinc-900/90' : 'bg-zinc-950/90'
                  } ${
                    isPlayerZone
                      ? 'hover:border-amber-500/80 border-amber-950/40'
                      : x >= 2 && x <= 5
                      ? 'border-zinc-800/80'
                      : 'border-rose-950/40'
                  } ${
                    isSelected
                      ? 'ring-2 ring-amber-400 bg-amber-950/60 scale-105 z-20 shadow-xl'
                      : isReachableMove
                      ? 'ring-2 ring-emerald-500/80 bg-emerald-950/40'
                      : isAttackableTarget
                      ? 'ring-2 ring-rose-500 bg-rose-950/80 animate-pulse'
                      : ''
                  }`}
                >
                  {/* Grid Coordinate */}
                  <span className="text-[9px] font-mono text-zinc-600 absolute top-1 left-1.5 pointer-events-none">
                    {String.fromCharCode(65 + x)}
                    {y + 1}
                  </span>

                  {/* Reachable Move Indicator */}
                  {isReachableMove && !playerP && !enemyP && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                  )}

                  {/* Player Unit */}
                  {playerP && (
                    <div className="h-full w-full flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <ChessIcon type={playerP.unit.archetype} className="w-5 h-5 text-amber-400" />
                        <RankBadge rank={playerP.unit.rank} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-200 truncate block leading-tight">
                          {playerP.unit.name}
                        </span>
                        <div className="flex justify-between text-[8px] font-mono text-zinc-400 mt-0.5">
                          <span>HP {playerP.unit.stats.hp}</span>
                          <span>ATK {playerP.unit.stats.atk}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enemy Unit */}
                  {enemyP && (
                    <div className="h-full w-full flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <ChessIcon type={enemyP.unit.archetype} className="w-5 h-5 text-rose-400" />
                        <RankBadge rank={enemyP.unit.rank} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-rose-200 truncate block leading-tight">
                          {enemyP.unit.name}
                        </span>
                        <div className="flex justify-between text-[8px] font-mono text-zinc-400 mt-0.5">
                          <span>HP {enemyP.unit.stats.hp}</span>
                          <span>ATK {enemyP.unit.stats.atk}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Info Panel (Right) */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Movement & Attack Preview
            </h3>

            {selectedCombatUnit ? (
              <div className="bg-zinc-900 border border-amber-500/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ChessIcon type={selectedCombatUnit.archetype} className="w-6 h-6 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">{selectedCombatUnit.name}</h4>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      {selectedCombatUnit.archetype} | Col {String.fromCharCode(65 + selectedCombatUnit.position.x)}{selectedCombatUnit.position.y + 1}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-zinc-800">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <span className="text-emerald-400 font-bold block text-sm">{legalMoveSquares.length}</span>
                    <span className="text-[10px] text-zinc-400 uppercase">Reachable Squares</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <span className="text-rose-400 font-bold block text-sm">{attackableEnemies.length}</span>
                    <span className="text-[10px] text-zinc-400 uppercase">Opening Targets</span>
                  </div>
                </div>

                {attackableEnemies.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-rose-300 font-bold uppercase block mb-1">
                      Direct Attack Threats:
                    </span>
                    <div className="space-y-1">
                      {attackableEnemies.map((e) => (
                        <div key={e.id} className="text-xs font-mono text-zinc-300 bg-rose-950/40 border border-rose-600/30 p-1.5 rounded flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-rose-400" /> {e.name}
                          </span>
                          <span className="text-[10px] text-rose-400">At {String.fromCharCode(65 + e.position.x)}{e.position.y + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 text-zinc-500 text-xs space-y-1">
                <p className="font-bold text-zinc-400">No Unit Selected</p>
                <p>Click any unit in Cols A-B to select it, swap formation positions, or inspect legal chess movement rays.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <p className="font-mono text-amber-300 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> 8×8 Chess Movement Rules
            </p>
            <p>Rook slides straight. Bishop slides diagonally. Queen slides all lines. Knight jumps L-shapes. Pawns march forward 1 square.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
