import React, { useState } from 'react';
import { 
  GameState, 
  ToolMode, 
  CardinalDirection, 
  RawPartId, 
  GridTile, 
  ItemPacket,
  WeaponId
} from '../types';
import { RAW_PARTS, WEAPON_RECIPES } from '../engine/recipes';

interface SvgWorkshopGridProps {
  state: GameState;
  toolMode: ToolMode;
  selectedDirection: CardinalDirection;
  selectedSpawnerPart: RawPartId;
  selectedTile: { x: number; y: number } | null;
  onTileClick: (x: number, y: number) => void;
  onTileRightClick: (x: number, y: number, e: React.MouseEvent) => void;
  onSelectTile: (coord: { x: number; y: number } | null) => void;
}

const CELL_SIZE = 80;
const PADDING = 24;

export const SvgWorkshopGrid: React.FC<SvgWorkshopGridProps> = ({
  state,
  toolMode,
  selectedDirection,
  selectedSpawnerPart,
  selectedTile,
  onTileClick,
  onTileRightClick,
  onSelectTile,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const gridWidthPx = state.gridWidth * CELL_SIZE;
  const gridHeightPx = state.gridHeight * CELL_SIZE;
  const svgWidth = gridWidthPx + PADDING * 2;
  const svgHeight = gridHeightPx + PADDING * 2;

  // Rotation angles for direction
  const getRotationAngle = (dir: CardinalDirection): number => {
    switch (dir) {
      case 'N': return -90;
      case 'E': return 0;
      case 'S': return 90;
      case 'W': return 180;
    }
  };

  const getTileCenter = (x: number, y: number) => {
    return {
      cx: PADDING + x * CELL_SIZE + CELL_SIZE / 2,
      cy: PADDING + y * CELL_SIZE + CELL_SIZE / 2,
    };
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* SVG Canvas Container */}
      <div className="relative rounded-2xl border border-slate-700/80 bg-slate-950/90 shadow-2xl p-2 backdrop-blur-md max-w-full overflow-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="cursor-crosshair block"
          onMouseLeave={() => setHoveredCell(null)}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>

            {/* Glowing filter for high-tech components */}
            <filter id="fitter-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="item-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.7" />
            </filter>

            {/* Conveyor Chevron / Roller Pattern */}
            <pattern id="conveyor-chevrons" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 2 4 L 8 8 L 2 12" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              <path d="M 9 4 L 15 8 L 9 12" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            </pattern>
          </defs>

          {/* Background CAD Grid */}
          <rect
            x={PADDING}
            y={PADDING}
            width={gridWidthPx}
            height={gridHeightPx}
            fill="#0b1120"
            stroke="#334155"
            strokeWidth="2"
            rx="8"
          />
          <rect
            x={PADDING}
            y={PADDING}
            width={gridWidthPx}
            height={gridHeightPx}
            fill="url(#cad-grid)"
            rx="8"
          />

          {/* Render All Grid Cells */}
          {state.grid.map((row, y) =>
            row.map((tile, x) => {
              const cellX = PADDING + x * CELL_SIZE;
              const cellY = PADDING + y * CELL_SIZE;
              const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
              const isSelected = selectedTile?.x === x && selectedTile?.y === y;
              const { cx, cy } = getTileCenter(x, y);
              const rot = getRotationAngle(tile.direction);

              return (
                <g
                  key={`cell-${x}-${y}`}
                  onClick={() => onTileClick(x, y)}
                  onContextMenu={(e) => onTileRightClick(x, y, e)}
                  onMouseEnter={() => {
                    setHoveredCell({ x, y });
                    onSelectTile({ x, y });
                  }}
                  className="transition-colors duration-150"
                >
                  {/* Base Tile Outline */}
                  <rect
                    x={cellX + 2}
                    y={cellY + 2}
                    width={CELL_SIZE - 4}
                    height={CELL_SIZE - 4}
                    rx="6"
                    fill={tile.type === 'empty' ? 'transparent' : '#0f172a'}
                    stroke={
                      isSelected
                        ? '#38bdf8'
                        : isHovered
                        ? '#64748b'
                        : '#1e293b'
                    }
                    strokeWidth={isSelected ? '2.5' : '1'}
                    strokeDasharray={tile.type === 'empty' ? '4,4' : undefined}
                  />

                  {/* Empty Coordinate Label */}
                  {tile.type === 'empty' && (
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fill="#334155"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {x},{y}
                    </text>
                  )}

                  {/* Tile Type Rendering */}

                  {/* 1. CONVEYOR */}
                  {tile.type === 'conveyor' && (
                    <g transform={`rotate(${rot}, ${cx}, ${cy})`}>
                      {/* Conveyor Bed */}
                      <rect
                        x={cx - 32}
                        y={cy - 24}
                        width="64"
                        height="48"
                        rx="4"
                        fill="#0284c7"
                        fillOpacity="0.15"
                        stroke="#0ea5e9"
                        strokeWidth="1.5"
                      />
                      {/* Rollers */}
                      <line x1={cx - 24} y1={cy - 20} x2={cx - 24} y2={cy + 20} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                      <line x1={cx} y1={cy - 20} x2={cx} y2={cy + 20} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                      <line x1={cx + 24} y1={cy - 20} x2={cx + 24} y2={cy + 20} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

                      {/* Animated Flow Arrow */}
                      <path
                        d={`M ${cx - 12} ${cy - 8} L ${cx + 4} ${cy} L ${cx - 12} ${cy + 8}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={`M ${cx + 4} ${cy - 8} L ${cx + 20} ${cy} L ${cx + 4} ${cy + 8}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}

                  {/* 2. FITTER WORKSTATION */}
                  {tile.type === 'fitter' && (
                    <g>
                      {/* Station Housing */}
                      <rect
                        x={cx - 34}
                        y={cy - 34}
                        width="68"
                        height="68"
                        rx="8"
                        fill="#78350f"
                        fillOpacity="0.25"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                      {/* Corner Bolts */}
                      <circle cx={cx - 28} cy={cy - 28} r="2" fill="#fbbf24" />
                      <circle cx={cx + 28} cy={cy - 28} r="2" fill="#fbbf24" />
                      <circle cx={cx - 28} cy={cy + 28} r="2" fill="#fbbf24" />
                      <circle cx={cx + 28} cy={cy + 28} r="2" fill="#fbbf24" />

                      {/* Central Assembly Core */}
                      <circle cx={cx} cy={cy} r="16" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                      
                      {/* Gear / Wrench Icon */}
                      <path
                        d={`M ${cx - 6} ${cy - 6} L ${cx + 6} ${cy + 6} M ${cx + 6} ${cy - 6} L ${cx - 6} ${cy + 6}`}
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Output Direction Indicator */}
                      <g transform={`rotate(${rot}, ${cx}, ${cy})`}>
                        <path
                          d={`M ${cx + 22} ${cy - 5} L ${cx + 30} ${cy} L ${cx + 22} ${cy + 5} Z`}
                          fill="#f59e0b"
                        />
                      </g>

                      {/* Buffer count badge */}
                      <rect
                        x={cx - 18}
                        y={cy + 18}
                        width="36"
                        height="12"
                        rx="3"
                        fill="#0f172a"
                        stroke="#f59e0b"
                        strokeWidth="1"
                      />
                      <text
                        x={cx}
                        y={cy + 27}
                        textAnchor="middle"
                        fill="#fbbf24"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        BUF: {tile.fitterBuffer?.length || 0}
                      </text>
                    </g>
                  )}

                  {/* 3. PACKER / DELIVERY CRATE */}
                  {tile.type === 'packer' && (
                    <g>
                      {/* Crate Box Frame */}
                      <rect
                        x={cx - 34}
                        y={cy - 34}
                        width="68"
                        height="68"
                        rx="6"
                        fill="#581c87"
                        fillOpacity="0.25"
                        stroke="#a855f7"
                        strokeWidth="2"
                      />
                      {/* Crate Cross Braces */}
                      <line x1={cx - 28} y1={cy - 28} x2={cx + 28} y2={cy + 28} stroke="#c084fc" strokeWidth="1" opacity="0.6" />
                      <line x1={cx + 28} y1={cy - 28} x2={cx - 28} y2={cy + 28} stroke="#c084fc" strokeWidth="1" opacity="0.6" />

                      {/* Center Box Icon */}
                      <rect x={cx - 14} y={cy - 14} width="28" height="28" rx="4" fill="#1e1b4b" stroke="#c084fc" strokeWidth="1.5" />
                      <path
                        d={`M ${cx - 7} ${cy - 5} L ${cx} ${cy - 10} L ${cx + 7} ${cy - 5} L ${cx} ${cy} Z M ${cx - 7} ${cy - 5} L ${cx - 7} ${cy + 6} L ${cx} ${cy + 10} L ${cx} ${cy} Z M ${cx + 7} ${cy - 5} L ${cx + 7} ${cy + 6} L ${cx} ${cy + 10} L ${cx} ${cy} Z`}
                        fill="#a855f7"
                        stroke="#e9d5ff"
                        strokeWidth="0.75"
                      />

                      {/* Packed Total */}
                      <text
                        x={cx}
                        y={cy + 28}
                        textAnchor="middle"
                        fill="#e9d5ff"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        STORE DOCK
                      </text>
                    </g>
                  )}

                  {/* 4. HOPPER SPAWNER */}
                  {tile.type === 'spawner' && tile.spawnerPart && (
                    <g>
                      {/* Spawner Base */}
                      <rect
                        x={cx - 34}
                        y={cy - 34}
                        width="68"
                        height="68"
                        rx="8"
                        fill="#064e3b"
                        fillOpacity="0.25"
                        stroke={RAW_PARTS[tile.spawnerPart]?.color || '#10b981'}
                        strokeWidth="2"
                      />
                      {/* Hopper Funnel Shape */}
                      <path
                        d={`M ${cx - 22} ${cy - 24} L ${cx + 22} ${cy - 24} L ${cx + 10} ${cy - 4} L ${cx - 10} ${cy - 4} Z`}
                        fill={RAW_PARTS[tile.spawnerPart]?.color || '#10b981'}
                        fillOpacity="0.3"
                        stroke={RAW_PARTS[tile.spawnerPart]?.color || '#10b981'}
                        strokeWidth="1.5"
                      />

                      {/* Part Short Name Badge */}
                      <rect
                        x={cx - 20}
                        y={cy - 2}
                        width="40"
                        height="16"
                        rx="4"
                        fill="#0f172a"
                        stroke={RAW_PARTS[tile.spawnerPart]?.color || '#10b981'}
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx}
                        y={cy + 10}
                        textAnchor="middle"
                        fill={RAW_PARTS[tile.spawnerPart]?.color || '#10b981'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {RAW_PARTS[tile.spawnerPart]?.shortName || 'PART'}
                      </text>

                      {/* Output Arrow in pointed direction */}
                      <g transform={`rotate(${rot}, ${cx}, ${cy})`}>
                        <path
                          d={`M ${cx + 20} ${cy - 4} L ${cx + 28} ${cy} L ${cx + 20} ${cy + 4} Z`}
                          fill={RAW_PARTS[tile.spawnerPart]?.color || '#10b981'}
                        />
                      </g>

                      {/* Stock in Hopper */}
                      <text
                        x={cx}
                        y={cy + 28}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        QTY: {state.hopperStock[tile.spawnerPart] || 0}
                      </text>
                    </g>
                  )}

                  {/* 5. TRASH / RECYCLER */}
                  {tile.type === 'trash' && (
                    <g>
                      <rect
                        x={cx - 34}
                        y={cy - 34}
                        width="68"
                        height="68"
                        rx="8"
                        fill="#881337"
                        fillOpacity="0.25"
                        stroke="#f43f5e"
                        strokeWidth="2"
                      />
                      <path
                        d={`M ${cx - 10} ${cy - 12} L ${cx + 10} ${cy - 12} M ${cx - 6} ${cy - 12} L ${cx - 6} ${cy + 12} M ${cx} ${cy - 12} L ${cx} ${cy + 12} M ${cx + 6} ${cy - 12} L ${cx + 6} ${cy + 12} M ${cx - 12} ${cy + 12} L ${cx + 12} ${cy + 12}`}
                        stroke="#f43f5e"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <text
                        x={cx}
                        y={cy + 26}
                        textAnchor="middle"
                        fill="#f43f5e"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        RECYCLE
                      </text>
                    </g>
                  )}

                  {/* Ghost Placement Preview when Hovered */}
                  {isHovered && toolMode !== 'inspect' && tile.type === 'empty' && (
                    <g opacity="0.5" pointerEvents="none">
                      {toolMode === 'conveyor' && (
                        <g transform={`rotate(${getRotationAngle(selectedDirection)}, ${cx}, ${cy})`}>
                          <rect x={cx - 30} y={cy - 22} width="60" height="44" rx="4" fill="#0ea5e9" opacity="0.3" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />
                          <path d={`M ${cx - 10} ${cy - 6} L ${cx + 10} ${cy} L ${cx - 10} ${cy + 6}`} fill="none" stroke="#38bdf8" strokeWidth="2" />
                        </g>
                      )}
                      {toolMode === 'fitter' && (
                        <rect x={cx - 30} y={cy - 30} width="60" height="60" rx="6" fill="#f59e0b" opacity="0.3" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3,3" />
                      )}
                      {toolMode === 'packer' && (
                        <rect x={cx - 30} y={cy - 30} width="60" height="60" rx="6" fill="#a855f7" opacity="0.3" stroke="#c084fc" strokeWidth="2" strokeDasharray="3,3" />
                      )}
                      {toolMode === 'spawner' && (
                        <rect x={cx - 30} y={cy - 30} width="60" height="60" rx="6" fill={RAW_PARTS[selectedSpawnerPart]?.color || '#10b981'} opacity="0.3" stroke="#fff" strokeWidth="2" strokeDasharray="3,3" />
                      )}
                      {toolMode === 'trash' && (
                        <rect x={cx - 30} y={cy - 30} width="60" height="60" rx="6" fill="#f43f5e" opacity="0.3" stroke="#fda4af" strokeWidth="2" strokeDasharray="3,3" />
                      )}
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* Render Moving Item & Weapon Packets */}
          {state.items.map((item) => {
            const { cx, cy } = getTileCenter(item.x, item.y);

            if (item.kind === 'part') {
              const part = RAW_PARTS[item.itemId as RawPartId];
              const color = part?.color || '#38bdf8';
              const label = part?.shortName || 'PRT';

              return (
                <g key={item.id} filter="url(#item-shadow)" className="transition-all duration-300">
                  {/* Hexagon/Circle Part Chit */}
                  <circle cx={cx} cy={cy} r="15" fill="#0f172a" stroke={color} strokeWidth="2" />
                  <circle cx={cx} cy={cy} r="11" fill={color} fillOpacity="0.25" />
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fill={color}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {label}
                  </text>
                </g>
              );
            }

            if (item.kind === 'weapon') {
              const weapon = WEAPON_RECIPES[item.itemId as WeaponId];
              const color = weapon?.color || '#10b981';
              const name = weapon?.name || 'WEAPON';

              return (
                <g key={item.id} filter="url(#item-shadow)" className="transition-all duration-300">
                  {/* Weapon Case Chit */}
                  <rect
                    x={cx - 26}
                    y={cy - 12}
                    width="52"
                    height="24"
                    rx="6"
                    fill="#020617"
                    stroke={color}
                    strokeWidth="2"
                  />
                  <rect
                    x={cx - 24}
                    y={cy - 10}
                    width="48"
                    height="20"
                    rx="4"
                    fill={color}
                    fillOpacity="0.2"
                  />
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="8"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    letterSpacing="0.5"
                  >
                    {name}
                  </text>
                </g>
              );
            }

            return null;
          })}
        </svg>
      </div>

      {/* Selected Tile Inspector Bar / Quick Info */}
      {selectedTile && (
        <div className="mt-3 w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-300 shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-semibold">[{selectedTile.x}, {selectedTile.y}]</span>
            <span className="capitalize font-medium text-slate-100">
              {state.grid[selectedTile.y]?.[selectedTile.x]?.type || 'Empty'}
            </span>
            {state.grid[selectedTile.y]?.[selectedTile.x]?.direction && (
              <span className="text-slate-400">Dir: <strong className="text-amber-400 font-mono">{state.grid[selectedTile.y]?.[selectedTile.x]?.direction}</strong></span>
            )}
            {state.grid[selectedTile.y]?.[selectedTile.x]?.spawnerPart && (
              <span className="text-slate-400">
                Spawns: <strong className="text-emerald-400">{RAW_PARTS[state.grid[selectedTile.y]![selectedTile.x]!.spawnerPart!]?.name}</strong>
              </span>
            )}
            {state.grid[selectedTile.y]?.[selectedTile.x]?.fitterBuffer && state.grid[selectedTile.y]![selectedTile.x]!.fitterBuffer!.length > 0 && (
              <span className="text-slate-400">
                Buffered: <strong className="text-amber-400">{state.grid[selectedTile.y]![selectedTile.x]!.fitterBuffer!.map(p => RAW_PARTS[p]?.shortName).join(' + ')}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono">
            <span>Passed: <strong className="text-slate-200">{state.grid[selectedTile.y]?.[selectedTile.x]?.totalPassed || 0}</strong></span>
            <span>Crafted: <strong className="text-emerald-400">{state.grid[selectedTile.y]?.[selectedTile.x]?.totalAssembled || 0}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
