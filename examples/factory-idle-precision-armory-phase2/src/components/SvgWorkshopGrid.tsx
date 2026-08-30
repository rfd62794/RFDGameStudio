import React, { useState, useEffect } from 'react';
import { 
  GameState, 
  GridTile, 
  CardinalDirection, 
  ToolMode, 
  RawPartId, 
  WeaponId, 
  TileType 
} from '../types';
import { RAW_PARTS, WEAPON_RECIPES, BUILDING_DEFS } from '../engine/recipes';
import { 
  getDirectionOffset, 
  turnRight, 
  turnLeft 
} from '../engine/gameReducer';

interface SvgWorkshopGridProps {
  state: GameState;
  toolMode: ToolMode;
  direction: CardinalDirection;
  selectedSpawnerPart: RawPartId;
  selectedFilterPart: RawPartId;
  selectedTile: { x: number; y: number } | null;
  onTileClick: (x: number, y: number) => void;
  onTileRightClick: (x: number, y: number, e: React.MouseEvent) => void;
  onDragPlaceConveyor?: (prevX: number, prevY: number, nextX: number, nextY: number, dragDir: CardinalDirection) => void;
  onClearTile?: (x: number, y: number) => void;
  onUpgradeTier: (x: number, y: number) => void;
}

const TILE_SIZE = 72;

export const SvgWorkshopGrid: React.FC<SvgWorkshopGridProps> = ({
  state,
  toolMode,
  direction,
  selectedSpawnerPart,
  selectedFilterPart,
  selectedTile,
  onTileClick,
  onTileRightClick,
  onDragPlaceConveyor,
  onClearTile,
  onUpgradeTier,
}) => {
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStartTile, setDragStartTile] = useState<{ x: number; y: number } | null>(null);

  // Global mouseup to release drag state anywhere on screen
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      setDragStartTile(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const gridWidthPx = state.gridWidth * TILE_SIZE;
  const gridHeightPx = state.gridHeight * TILE_SIZE;

  // Rotation angles for directions
  const getRotationAngle = (dir: CardinalDirection): number => {
    switch (dir) {
      case 'N': return -90;
      case 'E': return 0;
      case 'S': return 90;
      case 'W': return 180;
    }
  };

  const handleMouseDown = (x: number, y: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click for drawing/placing
    setIsMouseDown(true);
    setDragStartTile({ x, y });
    onTileClick(x, y);
  };

  const handleMouseEnter = (x: number, y: number) => {
    setHoveredTile({ x, y });
    if (isMouseDown && dragStartTile) {
      if (dragStartTile.x !== x || dragStartTile.y !== y) {
        if (toolMode === 'conveyor') {
          const dx = x - dragStartTile.x;
          const dy = y - dragStartTile.y;
          const dragDir: CardinalDirection = Math.abs(dx) >= Math.abs(dy)
            ? (dx > 0 ? 'E' : 'W')
            : (dy > 0 ? 'S' : 'N');
          
          if (onDragPlaceConveyor) {
            onDragPlaceConveyor(dragStartTile.x, dragStartTile.y, x, y, dragDir);
          }
          setDragStartTile({ x, y });
        } else if (toolMode === 'clear') {
          if (onClearTile) {
            onClearTile(x, y);
          } else {
            onTileClick(x, y);
          }
          setDragStartTile({ x, y });
        } else if (toolMode !== 'inspect') {
          onTileClick(x, y);
          setDragStartTile({ x, y });
        }
      }
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-4 overflow-auto relative select-none">
      {/* Blueprint Grid Canvas */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-950/90 shadow-2xl p-2">
        <svg
          width={gridWidthPx}
          height={gridHeightPx}
          viewBox={`0 0 ${gridWidthPx} ${gridHeightPx}`}
          className="cursor-crosshair overflow-visible"
          onContextMenu={(e) => e.preventDefault()}
        >
          <defs>
            {/* Blueprint Grid Pattern */}
            <pattern id="grid-sub" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
            <pattern id="grid-main" width={TILE_SIZE} height={TILE_SIZE} patternUnits="userSpaceOnUse">
              <rect width={TILE_SIZE} height={TILE_SIZE} fill="url(#grid-sub)" />
              <path d={`M ${TILE_SIZE} 0 L 0 0 0 ${TILE_SIZE}`} fill="none" stroke="#334155" strokeWidth="1" strokeOpacity="0.6" />
            </pattern>

            {/* Glowing filter lights */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          <rect width={gridWidthPx} height={gridHeightPx} fill="url(#grid-main)" />

          {/* Underground Tunnel Connection Rays */}
          {state.grid.flatMap((row) =>
            row.map((tile) => {
              if (tile.type === 'underground_entry' && tile.isEnabled !== false) {
                const offset = getDirectionOffset(tile.direction);
                let exitX = -1;
                let exitY = -1;
                for (let dist = 1; dist <= 4; dist++) {
                  const cx = tile.x + offset.dx * dist;
                  const cy = tile.y + offset.dy * dist;
                  const target = state.grid[cy]?.[cx];
                  if (target && target.type === 'underground_exit' && target.direction === tile.direction) {
                    exitX = cx;
                    exitY = cy;
                    break;
                  }
                }
                if (exitX !== -1 && exitY !== -1) {
                  const startX = tile.x * TILE_SIZE + TILE_SIZE / 2;
                  const startY = tile.y * TILE_SIZE + TILE_SIZE / 2;
                  const endX = exitX * TILE_SIZE + TILE_SIZE / 2;
                  const endY = exitY * TILE_SIZE + TILE_SIZE / 2;
                  return (
                    <g key={`tunnel_beam_${tile.x}_${tile.y}`}>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#0284c7"
                        strokeWidth="6"
                        strokeOpacity="0.3"
                      />
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                        strokeOpacity="0.8"
                        className="animate-pulse"
                      />
                    </g>
                  );
                }
              }
              return null;
            })
          )}

          {/* RENDER GRID TILES */}
          {state.grid.map((row, y) =>
            row.map((tile, x) => {
              const cx = x * TILE_SIZE + TILE_SIZE / 2;
              const cy = y * TILE_SIZE + TILE_SIZE / 2;
              const isSelected = selectedTile?.x === x && selectedTile?.y === y;
              const isHovered = hoveredTile?.x === x && hoveredTile?.y === y;
              const rot = getRotationAngle(tile.direction);
              const isPowerStarved = state.powerRatio < 0.95 && ['fitter', 'lab', 'spawner'].includes(tile.type) && tile.isEnabled !== false;

              return (
                <g
                  key={`tile_${x}_${y}`}
                  onMouseDown={(e) => handleMouseDown(x, y, e)}
                  onContextMenu={(e) => onTileRightClick(x, y, e)}
                  onMouseEnter={() => handleMouseEnter(x, y)}
                  onMouseLeave={() => setHoveredTile(null)}
                  className="transition-transform duration-100"
                >
                  {/* Empty Floor Base */}
                  <rect
                    x={x * TILE_SIZE + 2}
                    y={y * TILE_SIZE + 2}
                    width={TILE_SIZE - 4}
                    height={TILE_SIZE - 4}
                    rx="6"
                    fill={tile.type === 'empty' ? '#0f172a' : '#1e293b'}
                    fillOpacity={tile.type === 'empty' ? 0.4 : 0.85}
                    stroke={isSelected ? '#f59e0b' : isHovered ? '#38bdf8' : '#334155'}
                    strokeWidth={isSelected ? '2.5' : isHovered ? '1.5' : '1'}
                  />

                  {/* 1. CONVEYOR BELT */}
                  {tile.type === 'conveyor' && (
                    <g transform={`rotate(${rot}, ${cx}, ${cy})`}>
                      <rect
                        x={cx - 30}
                        y={cy - 22}
                        width="60"
                        height="44"
                        rx="4"
                        fill="#0f172a"
                        stroke="#475569"
                        strokeWidth="1.5"
                      />
                      {/* Belt Rollers */}
                      {[-18, -6, 6, 18].map((offset, i) => (
                        <line
                          key={i}
                          x1={cx + offset}
                          y1={cy - 18}
                          x2={cx + offset}
                          y2={cy + 18}
                          stroke="#334155"
                          strokeWidth="2"
                        />
                      ))}
                      {/* Direction Chevron */}
                      <path
                        d={`M ${cx - 6} ${cy - 8} L ${cx + 4} ${cy} L ${cx - 6} ${cy + 8}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}

                  {/* 2. SPLITTER (1 IN -> 2/3 OUT) */}
                  {tile.type === 'splitter' && (
                    <g transform={`rotate(${rot}, ${cx}, ${cy})`}>
                      <rect
                        x={cx - 32}
                        y={cy - 32}
                        width="64"
                        height="64"
                        rx="8"
                        fill="#1e1b4b"
                        stroke="#818cf8"
                        strokeWidth="2"
                      />
                      {/* Splitter Internal Fork Tracks */}
                      <path
                        d={`M ${cx - 24} ${cy} L ${cx - 4} ${cy} L ${cx + 16} ${cy - 16} M ${cx - 4} ${cy} L ${cx + 16} ${cy + 16} M ${cx - 4} ${cy} L ${cx + 18} ${cy}`}
                        fill="none"
                        stroke="#a5b4fc"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Branch Indicator LEDs */}
                      <circle cx={cx + 20} cy={cy - 16} r="3" fill={tile.splitterState === 0 ? '#10b981' : '#475569'} />
                      <circle cx={cx + 22} cy={cy} r="3" fill={tile.splitterState === 1 ? '#10b981' : '#475569'} />
                      <circle cx={cx + 20} cy={cy + 16} r="3" fill={tile.splitterState === 2 ? '#10b981' : '#475569'} />
                      <text x={cx - 16} y={cy - 18} fill="#a5b4fc" fontSize="8" fontFamily="monospace" fontWeight="bold">SPLIT</text>
                    </g>
                  )}

                  {/* 3. MERGER (3 IN -> 1 OUT) */}
                  {tile.type === 'merger' && (
                    <g transform={`rotate(${rot}, ${cx}, ${cy})`}>
                      <rect
                        x={cx - 32}
                        y={cy - 32}
                        width="64"
                        height="64"
                        rx="8"
                        fill="#064e3b"
                        fillOpacity="0.4"
                        stroke="#34d399"
                        strokeWidth="2"
                      />
                      <path
                        d={`M ${cx - 20} ${cy - 16} L ${cx - 2} ${cy} M ${cx - 20} ${cy + 16} L ${cx - 2} ${cy} M ${cx - 20} ${cy} L ${cx + 20} ${cy}`}
                        fill="none"
                        stroke="#6ee7b7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <text x={cx} y={cy - 18} fill="#34d399" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="bold">MERGE</text>
                    </g>
                  )}

                  {/* 4. UNDERGROUND TUNNEL ENTRY */}
                  {tile.type === 'underground_entry' && (
                    <g transform={`rotate(${rot}, ${cx}, ${cy})`}>
                      <rect
                        x={cx - 30}
                        y={cy - 30}
                        width="60"
                        height="60"
                        rx="6"
                        fill="#082f49"
                        stroke="#38bdf8"
                        strokeWidth="2"
                      />
                      {/* Underground Hatch Chute */}
                      <path
                        d={`M ${cx - 16} ${cy - 18} L ${cx + 16} ${cy - 18} L ${cx + 8} ${cy + 14} L ${cx - 8} ${cy + 14} Z`}
                        fill="#0284c7"
                        fillOpacity="0.6"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                      />
                      <text x={cx} y={cy + 24} fill="#38bdf8" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="bold">IN-TUNNEL</text>
                    </g>
                  )}

                  {/* 5. UNDERGROUND TUNNEL EXIT */}
                  {tile.type === 'underground_exit' && (
                    <g transform={`rotate(${rot}, ${cx}, ${cy})`}>
                      <rect
                        x={cx - 30}
                        y={cy - 30}
                        width="60"
                        height="60"
                        rx="6"
                        fill="#082f49"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      <path
                        d={`M ${cx - 8} ${cy - 14} L ${cx + 8} ${cy - 14} L ${cx + 16} ${cy + 18} L ${cx - 16} ${cy + 18} Z`}
                        fill="#0284c7"
                        fillOpacity="0.6"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                      />
                      <text x={cx} y={cy - 18} fill="#38bdf8" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="bold">OUT-TUNNEL</text>
                    </g>
                  )}

                  {/* 6. CONVEYOR CROSSING (BRIDGE) */}
                  {tile.type === 'crossing' && (
                    <g>
                      <rect
                        x={cx - 30}
                        y={cy - 30}
                        width="60"
                        height="60"
                        rx="6"
                        fill="#1e293b"
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />
                      {/* Underpass lane (East-West) */}
                      <rect x={cx - 30} y={cy - 12} width="60" height="24" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                      {/* Overpass Bridge (North-South) */}
                      <rect x={cx - 12} y={cy - 30} width="24" height="60" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                      <text x={cx} y={cy + 3} textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace" fontWeight="bold">┼</text>
                    </g>
                  )}

                  {/* 7. FILTER / SORTER GATE */}
                  {tile.type === 'filter' && (
                    <g transform={`rotate(${rot}, ${cx}, ${cy})`}>
                      <rect
                        x={cx - 30}
                        y={cy - 30}
                        width="60"
                        height="60"
                        rx="8"
                        fill="#3b0764"
                        stroke="#c084fc"
                        strokeWidth="2"
                      />
                      {/* Sorter Divert Path */}
                      <path
                        d={`M ${cx - 20} ${cy} L ${cx + 18} ${cy} M ${cx} ${cy} L ${cx} ${cy + 18}`}
                        fill="none"
                        stroke="#e9d5ff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Target Part Badge */}
                      <rect x={cx - 16} y={cy - 22} width="32" height="14" rx="3" fill="#581c87" stroke="#c084fc" />
                      <text x={cx} y={cy - 12} fill="#f3e8ff" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="bold">
                        {tile.filterPart ? RAW_PARTS[tile.filterPart as RawPartId]?.shortName || tile.filterPart : 'ANY'}
                      </text>
                    </g>
                  )}

                  {/* 8. SPAWNER / INTAKE HOPPER */}
                  {tile.type === 'spawner' && (
                    <g>
                      <rect
                        x={cx - 32}
                        y={cy - 32}
                        width="64"
                        height="64"
                        rx="8"
                        fill={tile.isEnabled !== false ? '#064e3b' : '#1e1b2e'}
                        fillOpacity={tile.isEnabled !== false ? 0.35 : 0.6}
                        stroke={tile.isEnabled !== false ? (RAW_PARTS[tile.spawnerPart || 'chassis']?.color || '#10b981') : '#475569'}
                        strokeWidth="2"
                      />

                      {/* Status LED */}
                      <circle
                        cx={cx - 22}
                        cy={cy - 22}
                        r="4"
                        fill={tile.isEnabled !== false ? '#10b981' : '#ef4444'}
                      />

                      {/* Part Label & Auto-buy tag */}
                      <text
                        x={cx}
                        y={cy - 2}
                        textAnchor="middle"
                        fill={tile.isEnabled !== false ? (RAW_PARTS[tile.spawnerPart || 'chassis']?.color || '#10b981') : '#94a3b8'}
                        fontSize="12"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {RAW_PARTS[tile.spawnerPart || 'chassis']?.shortName || 'CHS'}
                      </text>

                      <text
                        x={cx}
                        y={cy + 16}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        {tile.spawnerAutoBuy ? 'AUTO-BUY' : `STK: ${state.hopperStock[tile.spawnerPart || 'chassis'] || 0}`}
                      </text>
                    </g>
                  )}

                  {/* 9. FITTER / ASSEMBLER (FACTORY IDLE WITH CRAFTING GAUGE) */}
                  {tile.type === 'fitter' && (() => {
                    const targetRecipeId = tile.fitterTargetRecipe || 'pistol';
                    const recipe = WEAPON_RECIPES[targetRecipeId];
                    const progress = tile.cycleProgress || 0;
                    const progressPercent = Math.round(progress * 100);

                    // Buffer status
                    const bufferCounts: Record<RawPartId, number> = {
                      chassis: 0, barrel: 0, magazine: 0, stock: 0, optic: 0,
                    };
                    tile.fitterBuffer?.forEach(p => { bufferCounts[p] = (bufferCounts[p] || 0) + 1; });

                    return (
                      <g>
                        {/* Machine Frame */}
                        <rect
                          x={cx - 32}
                          y={cy - 32}
                          width="64"
                          height="64"
                          rx="8"
                          fill="#1e1b4b"
                          stroke={recipe?.color || '#3b82f6'}
                          strokeWidth={progress > 0 ? "2.5" : "2"}
                        />

                        {/* Top Header: Mk Tier & Status LED */}
                        <text x={cx - 24} y={cy - 20} fill="#a5b4fc" fontSize="8" fontFamily="monospace" fontWeight="bold">
                          Mk{tile.tier || 1}
                        </text>

                        {/* Status LED Indicator */}
                        <circle
                          cx={cx + 22}
                          cy={cy - 22}
                          r="3.5"
                          fill={
                            tile.lastStatus === 'jammed'
                              ? '#ef4444'
                              : tile.lastStatus === 'starved'
                              ? '#f59e0b'
                              : tile.lastStatus === 'no_power'
                              ? '#fbbf24'
                              : progress > 0
                              ? '#10b981'
                              : '#64748b'
                          }
                        />

                        {/* Target Weapon Name */}
                        <text
                          x={cx}
                          y={cy - 6}
                          textAnchor="middle"
                          fill={recipe?.color || '#3b82f6'}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {recipe?.name.split(' ')[1] || 'FITTER'}
                        </text>

                        {/* Mini Buffer Requirement Dots */}
                        <g transform={`translate(${cx - 18}, ${cy + 6})`}>
                          {Object.entries(recipe.requiredParts).slice(0, 4).map(([partKey, count], idx) => {
                            const reqCount = count as number;
                            const hasParts = (bufferCounts[partKey as RawPartId] || 0) >= reqCount;
                            return (
                              <circle
                                key={idx}
                                cx={idx * 12}
                                cy={0}
                                r="3"
                                fill={RAW_PARTS[partKey as RawPartId]?.color || '#94a3b8'}
                                fillOpacity={hasParts ? 1.0 : 0.3}
                                stroke="#0f172a"
                                strokeWidth="0.5"
                              />
                            );
                          })}
                        </g>

                        {/* Linear Crafting Cycle Progress Bar */}
                        <g transform={`translate(${cx - 26}, ${cy + 18})`}>
                          <rect
                            width="52"
                            height="7"
                            rx="3.5"
                            fill="#0f172a"
                            stroke="#334155"
                            strokeWidth="0.8"
                          />
                          <rect
                            width={Math.max(0, Math.min(52, progress * 52))}
                            height="7"
                            rx="3.5"
                            fill={tile.lastStatus === 'jammed' ? '#ef4444' : recipe?.color || '#38bdf8'}
                          />
                          {/* Label inside bar */}
                          <text
                            x={26}
                            y={5.5}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="5.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {tile.lastStatus === 'jammed'
                              ? 'JAMMED'
                              : tile.lastStatus === 'starved'
                              ? 'WAIT'
                              : progress > 0
                              ? `${progressPercent}%`
                              : 'IDLE'}
                          </text>
                        </g>
                      </g>
                    );
                  })()}

                  {/* 10. RESEARCH LAB */}
                  {tile.type === 'lab' && (
                    <g>
                      <rect
                        x={cx - 32}
                        y={cy - 32}
                        width="64"
                        height="64"
                        rx="8"
                        fill="#0c4a6e"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                      />
                      <circle cx={cx} cy={cy - 4} r="14" fill="#0284c7" fillOpacity="0.4" className="animate-pulse" />
                      <text x={cx} y={cy} textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="bold">⚛</text>
                      <text x={cx} y={cy + 18} textAnchor="middle" fill="#7dd3fc" fontSize="8" fontFamily="monospace" fontWeight="bold">
                        +RP LAB
                      </text>
                    </g>
                  )}

                  {/* 11. POWER GENERATOR */}
                  {tile.type === 'power_gen' && (
                    <g>
                      <rect
                        x={cx - 32}
                        y={cy - 32}
                        width="64"
                        height="64"
                        rx="8"
                        fill="#451a03"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                      <circle cx={cx} cy={cy - 4} r="12" fill="#78350f" />
                      <text x={cx} y={cy} textAnchor="middle" fill="#fbbf24" fontSize="14">⚡</text>
                      <text x={cx} y={cy + 18} textAnchor="middle" fill="#fcd34d" fontSize="8" fontFamily="monospace" fontWeight="bold">
                        25 kW
                      </text>
                    </g>
                  )}

                  {/* 12. DIRECT EXPORT PORT / SELLER */}
                  {tile.type === 'seller' && (
                    <g>
                      <rect
                        x={cx - 32}
                        y={cy - 32}
                        width="64"
                        height="64"
                        rx="8"
                        fill="#14532d"
                        stroke="#22c55e"
                        strokeWidth="2"
                      />
                      <circle cx={cx} cy={cy - 4} r="12" fill="#15803d" />
                      <text x={cx} y={cy} textAnchor="middle" fill="#86efac" fontSize="13" fontWeight="bold">$</text>
                      <text x={cx} y={cy + 18} textAnchor="middle" fill="#bbf7d0" fontSize="8" fontFamily="monospace" fontWeight="bold">
                        EXPORT
                      </text>
                    </g>
                  )}

                  {/* 13. PACKER */}
                  {tile.type === 'packer' && (
                    <g>
                      <rect
                        x={cx - 32}
                        y={cy - 32}
                        width="64"
                        height="64"
                        rx="8"
                        fill="#581c87"
                        stroke="#a855f7"
                        strokeWidth="2"
                      />
                      <text x={cx} y={cy} textAnchor="middle" fill="#d8b4fe" fontSize="13">📦</text>
                      <text x={cx} y={cy + 18} textAnchor="middle" fill="#e9d5ff" fontSize="8" fontFamily="monospace" fontWeight="bold">
                        PACKER
                      </text>
                    </g>
                  )}

                  {/* 14. TRASH / RECYCLER */}
                  {tile.type === 'trash' && (
                    <g>
                      <rect
                        x={cx - 30}
                        y={cy - 30}
                        width="60"
                        height="60"
                        rx="6"
                        fill="#4c0519"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                      />
                      <text x={cx} y={cy + 2} textAnchor="middle" fill="#fda4af" fontSize="14">🔥</text>
                      <text x={cx} y={cy + 18} textAnchor="middle" fill="#fecdd3" fontSize="7" fontFamily="monospace">RECYCLE</text>
                    </g>
                  )}

                  {/* BROWNOUT / POWER SHORTAGE ALERT OVERLAY */}
                  {isPowerStarved && (
                    <g className="animate-pulse" transform={`translate(${cx - 24}, ${cy - 24})`}>
                      <circle cx="0" cy="0" r="7" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
                      <text x="0" y="3" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">⚡</text>
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* RENDER MOVING ITEM PACKETS */}
          {state.items.map((item) => {
            const itemX = item.x * TILE_SIZE + TILE_SIZE / 2;
            const itemY = item.y * TILE_SIZE + TILE_SIZE / 2;

            if (item.kind === 'part') {
              const part = RAW_PARTS[item.itemId as RawPartId];
              return (
                <g key={item.id} className="transition-all duration-300">
                  <circle
                    cx={itemX}
                    cy={itemY}
                    r="10"
                    fill={part?.color || '#3b82f6'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    filter="url(#glow-cyan)"
                  />
                  <text
                    x={itemX}
                    y={itemY + 3.5}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {part?.shortName || 'PT'}
                  </text>
                </g>
              );
            }

            if (item.kind === 'weapon') {
              const weapon = WEAPON_RECIPES[item.itemId as WeaponId];
              return (
                <g key={item.id} className="transition-all duration-300">
                  <rect
                    x={itemX - 14}
                    y={itemY - 14}
                    width="28"
                    height="28"
                    rx="6"
                    fill={weapon?.color || '#eab308'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter="url(#glow-amber)"
                  />
                  <text
                    x={itemX}
                    y={itemY + 4}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="black"
                  >
                    {weapon?.icon || 'WPN'}
                  </text>
                </g>
              );
            }

            return null;
          })}

          {/* Placement Hover Ghost */}
          {hoveredTile && toolMode !== 'inspect' && (
            <rect
              x={hoveredTile.x * TILE_SIZE + 4}
              y={hoveredTile.y * TILE_SIZE + 4}
              width={TILE_SIZE - 8}
              height={TILE_SIZE - 8}
              rx="6"
              fill={toolMode === 'clear' ? '#f43f5e' : '#f59e0b'}
              fillOpacity="0.25"
              stroke={toolMode === 'clear' ? '#f43f5e' : '#f59e0b'}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}
        </svg>
      </div>

      {/* Grid Floor Quick Guide */}
      <div className="mt-3 flex items-center gap-6 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Click & Drag to Draw Conveyors</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Right-Click to Rotate</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Click Tile to Inspect / Upgrade Mk</span>
        </span>
      </div>
    </div>
  );
};

export default SvgWorkshopGrid;
