import React, { useState } from 'react';
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
  onUpgradeTier,
}) => {
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

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
                    <line
                      key={`tunnel_beam_${tile.x}_${tile.y}`}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#38bdf8"
                      strokeWidth="4"
                      strokeDasharray="6 4"
                      strokeOpacity="0.5"
                      className="animate-pulse"
                    />
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

              return (
                <g
                  key={`tile_${x}_${y}`}
                  onClick={() => onTileClick(x, y)}
                  onContextMenu={(e) => onTileRightClick(x, y, e)}
                  onMouseEnter={() => setHoveredTile({ x, y })}
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
                    fillOpacity={tile.type === 'empty' ? 0.4 : 0.8}
                    stroke={isSelected ? '#f59e0b' : '#334155'}
                    strokeWidth={isSelected ? '2' : '1'}
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

                  {/* 9. FITTER / ASSEMBLER */}
                  {tile.type === 'fitter' && (
                    <g>
                      <rect
                        x={cx - 32}
                        y={cy - 32}
                        width="64"
                        height="64"
                        rx="8"
                        fill="#1e1b4b"
                        stroke={WEAPON_RECIPES[tile.fitterTargetRecipe || 'pistol']?.color || '#3b82f6'}
                        strokeWidth="2"
                      />
                      {/* Tier Badge */}
                      <text x={cx + 18} y={cy - 20} fill="#a5b4fc" fontSize="8" fontFamily="monospace" fontWeight="bold">
                        Mk{tile.tier || 1}
                      </text>
                      <text
                        x={cx}
                        y={cy - 4}
                        textAnchor="middle"
                        fill={WEAPON_RECIPES[tile.fitterTargetRecipe || 'pistol']?.color || '#3b82f6'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {WEAPON_RECIPES[tile.fitterTargetRecipe || 'pistol']?.name.split(' ')[1] || 'FITTER'}
                      </text>
                      <text
                        x={cx}
                        y={cy + 14}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        BUF: {tile.fitterBuffer?.length || 0}
                      </text>
                    </g>
                  )}

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
                    y={itemY + 3}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="black"
                  >
                    {part?.shortName.slice(0, 2) || 'P'}
                  </text>
                </g>
              );
            } else {
              const recipe = WEAPON_RECIPES[item.itemId as WeaponId];
              return (
                <g key={item.id} className="transition-all duration-300">
                  <rect
                    x={itemX - 14}
                    y={itemY - 8}
                    width="28"
                    height="16"
                    rx="4"
                    fill={recipe?.color || '#10b981'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    filter="url(#glow-amber)"
                  />
                  <text
                    x={itemX}
                    y={itemY + 3}
                    textAnchor="middle"
                    fill="#020617"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="black"
                  >
                    {recipe?.name.slice(0, 3).toUpperCase() || 'WEP'}
                  </text>
                </g>
              );
            }
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
    </div>
  );
};
