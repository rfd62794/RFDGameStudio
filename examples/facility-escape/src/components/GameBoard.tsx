import React from 'react';
import { TileState, GuardEntity, PlayerEntity, Property } from '../types';
import { getObjectWithProperty, computeSightline, derivePredictedFacing } from '../utils/physicsEngine';
import { 
  Flame, 
  Zap, 
  Eye, 
  AlertTriangle, 
  Sparkles, 
  HelpCircle, 
  Heart, 
  Volume2, 
  StickyNote, 
  User, 
  RotateCw,
  XCircle,
  ShieldAlert
} from 'lucide-react';

interface GameBoardProps {
  grid: TileState[][];
  player: PlayerEntity;
  guards: GuardEntity[];
  selectedItemIndex: number | null;
  activeCarrierAction: 'heat' | 'electric' | 'adhesive' | null;
  onTileClick: (x: number, y: number) => void;
}

export default function GameBoard({
  grid,
  player,
  guards,
  selectedItemIndex,
  activeCarrierAction,
  onTileClick,
}: GameBoardProps) {
  const size = grid.length;

  // Pre-calculate all sightline cells and check if they are in shoot intent
  const sightlineTiles = new Map<string, { isShoot: boolean; guardId: string; facing: string }>();
  
  guards.forEach(guard => {
    if (guard.immobilizedTurns === 0) {
      const isShoot = guard.intent.actionType === 'shoot';
      guard.intent.targetTiles.forEach(tile => {
        const key = `${tile.x},${tile.y}`;
        // If multiple guards hit the same tile, prioritize shoot warning
        const existing = sightlineTiles.get(key);
        if (!existing || (!existing.isShoot && isShoot)) {
          sightlineTiles.set(key, { isShoot, guardId: guard.id, facing: guard.facing });
        }
      });
    }
  });

  // Pre-calculate patrol move targets for next turn warnings
  const patrolTargets = new Map<string, { guardId: string; nextPos: { x: number; y: number } }>();
  guards.forEach(guard => {
    if (
      guard.immobilizedTurns === 0 &&
      guard.intent.actionType === 'move' &&
      guard.intent.nextPos
    ) {
      patrolTargets.set(`${guard.intent.nextPos.x},${guard.intent.nextPos.y}`, {
        guardId: guard.id,
        nextPos: guard.intent.nextPos,
      });
    }
  });



  // Pre-calculate all current vision cones (yellow informational layer)
  const currentCones = new Map<string, { guardType: 'watcher' | 'patrol'; guardId: string }>();
  guards.forEach(guard => {
    if (guard.immobilizedTurns === 0) {
      if (guard.intent.actionType === 'watch' || guard.intent.actionType === 'shoot') {
        guard.intent.targetTiles.forEach(tile => {
          const key = `${tile.x},${tile.y}`;
          currentCones.set(key, { guardType: guard.guardType, guardId: guard.id });
        });
      }
    }
  });

  // Pre-calculate patrol predicted future cones (striped/shaded yellow)
  const futureConeTiles = new Map<string, { guardId: string }>();
  guards.forEach(guard => {
    if (
      guard.immobilizedTurns === 0 &&
      guard.guardType === 'patrol' &&
      guard.intent.actionType === 'move' &&
      guard.intent.nextPos
    ) {
      const nextPos = guard.intent.nextPos;
      const predictedFacing = derivePredictedFacing(
        guard.x,
        guard.y,
        nextPos.x,
        nextPos.y,
        guard.facing
      );
      const futureSightline = computeSightline(
        nextPos.x,
        nextPos.y,
        predictedFacing,
        grid,
        false,
        guard.guardType
      );
      futureSightline.forEach(tile => {
        const key = `${tile.x},${tile.y}`;
        futureConeTiles.set(key, { guardId: guard.id });
      });
    }
  });

  // Check if a tile is adjacent to player
  const isAdjacentToPlayer = (x: number, y: number) => {
    const dx = Math.abs(x - player.x);
    const dy = Math.abs(y - player.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  };

  // Check if a tile is player tile
  const isPlayerTile = (x: number, y: number) => {
    return x === player.x && y === player.y;
  };

  return (
    <div id="game-board-container" className="flex flex-col items-center justify-center p-4">
      {/* Legend / Status Overlay */}
      <div id="legend-overlay" className="w-full max-w-md flex flex-col gap-2 text-xs font-mono text-slate-400 mb-3 px-1">
        <div className="flex justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400/20 border border-yellow-400/40 rounded"></div>
            <span>Watcher Cone</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-400/15 border border-dashed border-amber-300/30 rounded"></div>
            <span>Patrol Cone</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[repeating-linear-gradient(45deg,rgba(234,179,8,0.15)_0px,rgba(234,179,8,0.15)_2px,transparent_2px,transparent_8px)] border border-dashed border-yellow-500/30 rounded"></div>
            <span>Future Cone</span>
          </div>
        </div>
        <div className="flex justify-between flex-wrap gap-2 pt-1 border-t border-slate-800">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded"></div>
            <span>Sightline (Watch)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-600/50 border border-red-500 animate-pulse rounded"></div>
            <span className="text-red-400 font-semibold">Sightline (SHOOTING)</span>
          </div>
          <div className="flex items-center gap-1">
            <RotateCw size={12} className="text-amber-400" />
            <span>Tap Adj. Mirror</span>
          </div>
        </div>
      </div>

      {/* Actual Grid Board */}
      <div 
        id="facility-grid" 
        className="grid bg-slate-900 border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl p-2 gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          aspectRatio: '1/1',
          width: '100%',
          maxWidth: '520px',
        }}
      >
        {grid.map((row, y) =>
          row.map((tile, x) => {
            const isPlayer = isPlayerTile(x, y);
            const guard = guards.find(g => g.x === x && g.y === y);
            
            const isExit = tile.isExit;
            const isWall = tile.isWall;
            const hasItem = !!tile.item;
            const hasEnv = !!tile.environmentObject;
            
            const sightlineInfo = sightlineTiles.get(`${x},${y}`);
            const inSightline = !!sightlineInfo;
            const inActiveShootLine = inSightline && sightlineInfo.isShoot;

            // Determine border & highlight states
            let borderClasses = 'border-slate-800/60';
            let bgClasses = 'bg-slate-850';
            let cursorClasses = 'cursor-pointer';

            const isGatedLocked = tile.isGated && !tile.isGatedUnlocked;

            if (isWall) {
              bgClasses = 'bg-slate-700 border-slate-600 pattern-wall';
              cursorClasses = 'cursor-not-allowed';
            } else if (isGatedLocked) {
              bgClasses = tile.isGated === 'flammable' ? 'bg-amber-950/40 border-amber-800/55' : 'bg-slate-900 border-cyan-800/55';
              if (activeCarrierAction) {
                borderClasses = 'border-amber-500/70 border-2 hover:bg-amber-500/10';
                cursorClasses = 'cursor-pointer';
              } else {
                cursorClasses = 'cursor-not-allowed';
              }
            } else if (isExit) {
              bgClasses = 'bg-emerald-950/80 border-emerald-500 border-2 animate-pulse';
            } else if (activeCarrierAction) {
              // Highlight targetable tiles if holding a carrier item
              borderClasses = 'border-amber-500/70 border-2 hover:bg-amber-500/10';
            } else if (isAdjacentToPlayer(x, y) && !isWall && !isGatedLocked) {
              // Highlight movement directions
              borderClasses = 'border-sky-500/50 border hover:bg-sky-500/10';
            }

            // Tile content overlay colors (Ignited, Electrified)
            const isIgnited = tile.status === 'ignited';
            const isElectrified = tile.status === 'electrified';

            const currentConeInfo = currentCones.get(`${x},${y}`);
            const futureConeInfo = futureConeTiles.get(`${x},${y}`);

            return (
              <div
                id={`tile-${x}-${y}`}
                key={`${x}-${y}`}
                onClick={() => !isWall && (!isGatedLocked || !!activeCarrierAction) && onTileClick(x, y)}
                className={`relative flex flex-col items-center justify-center border rounded-lg transition-all duration-200 select-none ${bgClasses} ${borderClasses} ${cursorClasses}`}
                style={{ minWidth: '40px', minHeight: '40px' }}
              >
                {/* Visual coordinate details in background (subtle mono) */}
                <span className="absolute top-0.5 left-1 text-[8px] font-mono text-slate-600 pointer-events-none">
                  {x},{y}
                </span>

                {/* CURRENT VISION CONE OVERLAY (SOLID YELLOW) */}
                {currentConeInfo && !isWall && !guard && (
                  <div 
                    className={`absolute inset-0 pointer-events-none rounded-lg ${
                      currentConeInfo.guardType === 'watcher'
                        ? 'bg-yellow-400/20 border border-yellow-400/40'
                        : 'bg-amber-300/15 border border-dashed border-amber-300/30'
                    }`}
                  />
                )}

                {/* FUTURE VISION CONE OVERLAY (STRIPED YELLOW) */}
                {futureConeInfo && !isWall && !guard && (
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-lg bg-[repeating-linear-gradient(45deg,rgba(234,179,8,0.15)_0px,rgba(234,179,8,0.15)_2px,transparent_2px,transparent_8px)] border border-dashed border-yellow-500/30"
                  />
                )}

                {/* SIGHTLINE OVERLAYS */}
                {inSightline && !isWall && !guard && (
                  <div 
                    className={`absolute inset-0 pointer-events-none rounded-lg flex items-center justify-center ${
                      inActiveShootLine 
                        ? 'bg-red-600/30 border-2 border-red-500 animate-pulse' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    {inActiveShootLine ? (
                      <ShieldAlert size={14} className="text-red-400 animate-bounce" />
                    ) : (
                      <Eye size={12} className="text-red-500/60" />
                    )}
                  </div>
                )}

                {/* PATROL MOVE TARGET TELECAST WARNING */}
                {patrolTargets.has(`${x},${y}`) && !guard && !isWall && (
                  <div className="absolute inset-0 bg-amber-500/10 border border-dotted border-amber-500/80 rounded-lg pointer-events-none flex flex-col items-center justify-center z-10 animate-pulse">
                    <span className="bg-amber-500 text-slate-950 text-[6px] font-extrabold px-1 py-0.5 rounded uppercase font-mono tracking-wider">
                      Guard Path
                    </span>
                    <span className="text-[10px] text-amber-400 mt-0.5 font-bold">▲</span>
                  </div>
                )}

                {/* GATED OBSTACLE OVERLAY */}
                {isGatedLocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-lg border border-red-500/35 p-1 text-center pointer-events-none z-15">
                    <ShieldAlert size={14} className={tile.isGated === 'flammable' ? 'text-amber-500 animate-pulse' : 'text-cyan-400 animate-pulse'} />
                    <span className="text-[8px] font-extrabold text-slate-100 mt-1 uppercase font-mono tracking-wide leading-none">
                      {tile.isGated === 'flammable' ? 'Wood Gate' : 'Electr. Gate'}
                    </span>
                    <span className="text-[6px] text-slate-400 font-mono scale-90 mt-0.5">
                      {tile.isGated === 'flammable' ? 'Apply HEAT' : 'Apply ELEC'}
                    </span>
                  </div>
                )}

                {/* IGNITED OVERLAY */}
                {isIgnited && (
                  <div className="absolute inset-0 bg-orange-600/30 border-2 border-orange-500 rounded-lg pointer-events-none flex items-center justify-center z-10 animate-pulse">
                    <Flame size={18} className="text-orange-400 animate-bounce" />
                  </div>
                )}

                {/* ELECTRIFIED OVERLAY */}
                {isElectrified && (
                  <div className="absolute inset-0 bg-cyan-500/20 border-2 border-cyan-400 rounded-lg pointer-events-none flex items-center justify-center z-10">
                    <Zap size={18} className="text-cyan-300 animate-pulse" />
                  </div>
                )}

                {/* ENVIRONMENT HAZARDS / OBJECTS */}
                {hasEnv && !isPlayer && !guard && (
                  <div className="flex flex-col items-center justify-center z-5 text-center px-0.5">
                    {tile.environmentObject?.properties.includes('flammable') && (
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-semibold text-orange-300 bg-orange-950/80 px-1 rounded border border-orange-800/40">
                          {tile.environmentObject.name}
                        </span>
                        <span className="text-[7px] text-orange-400/80 font-mono">Flammable</span>
                      </div>
                    )}
                    {tile.environmentObject?.properties.includes('conductive') && (
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-semibold text-cyan-300 bg-cyan-950/80 px-1 rounded border border-cyan-800/40">
                          {tile.environmentObject.name}
                        </span>
                        <span className="text-[7px] text-cyan-400/80 font-mono">Conductive</span>
                      </div>
                    )}
                    {tile.environmentObject?.properties.includes('loud') && (
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-semibold text-yellow-300 bg-yellow-950/80 px-1 rounded border border-yellow-800/40 flex items-center gap-0.5">
                          <Volume2 size={8} /> {tile.environmentObject.name}
                        </span>
                        <span className="text-[7px] text-yellow-400/80 font-mono">Loud</span>
                      </div>
                    )}
                    {tile.environmentObject?.properties.includes('adhesive') && (
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-semibold text-amber-200 bg-amber-950/80 px-1 rounded border border-amber-900/40">
                          {tile.environmentObject.name}
                        </span>
                        <span className="text-[7px] text-amber-400/80 font-mono">Sticky</span>
                      </div>
                    )}
                  </div>
                )}

                {/* PICKABLE ITEMS ON FLOOR */}
                {hasItem && !isPlayer && !guard && (
                  <div className="absolute bottom-1 z-5 flex flex-col items-center">
                    {tile.item?.name === 'Heart Container' ? (
                      <div className="flex items-center gap-0.5 bg-rose-950 border border-rose-500 px-1 rounded-full animate-pulse">
                        <Heart size={8} className="text-rose-400 fill-rose-500" />
                        <span className="text-[7px] text-rose-300 font-bold font-mono">+Max HP</span>
                      </div>
                    ) : (
                      <div className="bg-slate-800 border border-slate-600 rounded px-1 flex flex-col items-center shadow-lg">
                        <span className="text-[8px] text-white font-medium truncate max-w-[50px]">
                          {tile.item?.name}
                        </span>
                        <div className="flex gap-0.5">
                          {tile.item?.properties.map(p => (
                            <span key={p} className="text-[5px] bg-slate-700 text-slate-300 px-0.5 rounded uppercase">
                              {p[0]}
                            </span>
                          ))}
                          {tile.item?.carriers?.map(c => (
                            <span key={c} className="text-[5px] bg-amber-900 text-amber-200 px-0.5 rounded uppercase font-bold">
                              {c[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* RENDER GUARD */}
                {guard && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-900/40 rounded-lg border border-red-500/50">
                    {/* Directional Indicator */}
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-red-950 border-2 border-red-500 text-red-200 shadow-md">
                      {/* Arrow indicator */}
                      <span className={`absolute text-xs font-bold transition-transform duration-300 ${
                        guard.facing === 'U' ? '-translate-y-2' :
                        guard.facing === 'D' ? 'translate-y-2 rotate-180' :
                        guard.facing === 'L' ? '-translate-x-2 -rotate-90' :
                        'translate-x-2 rotate-90'
                      }`}>
                        ▲
                      </span>
                      <span className="text-[9px] font-mono font-bold z-10">G</span>
                    </div>

                    {/* Stun/Immobilized status overlay */}
                    {guard.immobilizedTurns > 0 ? (
                      <span className="absolute -top-1 bg-amber-500 text-slate-950 text-[7px] font-extrabold px-1 rounded border border-amber-300 animate-pulse z-30">
                        GLUED ({guard.immobilizedTurns}t)
                      </span>
                    ) : guard.intent.actionType === 'shoot' ? (
                      <span className="absolute -top-1 bg-red-600 text-white text-[7px] font-extrabold px-1 rounded border border-red-400 animate-pulse z-30">
                        ATTACK!
                      </span>
                    ) : guard.intent.actionType === 'move' ? (
                      <span className="absolute -top-1 bg-amber-500 text-slate-950 text-[7px] font-extrabold px-1 rounded border border-amber-400 animate-pulse z-30 font-mono">
                        {guard.investigateTarget ? 'INVESTIGATING' : 'PATROL MOVE'}
                      </span>
                    ) : (
                      <span className="absolute -top-1 bg-slate-800 text-slate-300 text-[6px] px-1 rounded font-mono">
                        WATCHING
                      </span>
                    )}
                  </div>
                )}

                {/* RENDER PLAYER */}
                {isPlayer && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 bg-sky-950/40 rounded-lg border-2 border-sky-400 shadow-inner">
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 border-2 border-white text-slate-950 font-bold shadow-lg shadow-sky-500/40 animate-pulse">
                      <User size={14} className="text-slate-900" />
                      <div className="absolute -bottom-1.5 bg-sky-900 text-white border border-sky-400 text-[7px] font-mono px-1 rounded-full flex items-center gap-0.5">
                        <Heart size={6} className="text-rose-400 fill-rose-500" />
                        <span>{player.hearts}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* EXIT TILE TEXT */}
                {isExit && !isPlayer && !guard && (
                  <div className="flex flex-col items-center justify-center animate-pulse z-1 text-center">
                    <span className="text-[10px] font-extrabold text-emerald-400">EXIT</span>
                    <Sparkles size={12} className="text-emerald-400" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Movement Action Reminder */}
      <div id="movement-help" className="mt-2 text-xs text-slate-400 font-mono text-center">
        {!activeCarrierAction ? (
          <span>Click highlighted cells to <b>move</b>, or click your own cell to <b>pick up items</b>.</span>
        ) : (
          <span className="text-amber-400 font-semibold flex items-center gap-1 justify-center">
            <AlertTriangle size={12} /> Click any tile on the board to resolve carrier ({activeCarrierAction.toUpperCase()}) effect.
          </span>
        )}
      </div>
    </div>
  );
}
