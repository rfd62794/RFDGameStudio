import React, { useState } from 'react';
import {
  AspectId,
  ELEMENT_COLORS,
  NUM_SECTORS,
  RING_SIZE,
  SectorZone,
  SOIL_STABILITY_TICKS,
  SoilType,
  TileState,
  TILES_PER_SECTOR,
  Settlement,
} from '../types';
import { ring_distance } from '../engine/slimeEngine';
import {
  Sparkles,
  Mountain,
  Layers,
  Flame,
  TreePine,
  Gem,
  Wind,
  CircleDot,
  Orbit,
  AlignJustify,
} from 'lucide-react';

interface RingVisualizerProps {
  tiles: TileState[];
  sectors: SectorZone[];
  selectedTileIdx: number;
  selectedSectorId: number;
  settlement: Settlement;
  onSelectTile: (idx: number) => void;
  onSelectSector: (id: number) => void;
}

export const SOIL_COLORS: Record<SoilType, { bg: string; border: string; text: string; label: string; accent: string }> = {
  BarrenRock: {
    bg: '#334155', // slate-700
    border: '#64748b', // slate-500
    text: '#cbd5e1',
    label: 'Barren Rock',
    accent: '#94a3b8',
  },
  Clay: {
    bg: '#7c2d12', // orange-900
    border: '#c2410c', // orange-600
    text: '#fed7aa',
    label: 'Clay',
    accent: '#f97316',
  },
  FertileLoam: {
    bg: '#064e3b', // emerald-950
    border: '#059669', // emerald-600
    text: '#a7f3d0',
    label: 'Fertile Loam (Top)',
    accent: '#10b981',
  },
  VolcanicAsh: {
    bg: '#450a0a', // red-950
    border: '#dc2626', // red-600
    text: '#fca5a5',
    label: 'Volcanic Ash (Recoverable)',
    accent: '#ef4444',
  },
};

export const ASPECT_ICONS: Record<AspectId, React.ReactNode> = {
  LushFlora: <TreePine className="w-3 h-3 text-emerald-400" />,
  MineralVein: <Gem className="w-3 h-3 text-amber-300" />,
  GeothermalVent: <Flame className="w-3 h-3 text-rose-400" />,
  BreezeAura: <Wind className="w-3 h-3 text-cyan-300" />,
  CrystalSpire: <Sparkles className="w-3 h-3 text-purple-300" />,
  SlimeNodule: <CircleDot className="w-3 h-3 text-lime-400" />,
};

export const RingVisualizer: React.FC<RingVisualizerProps> = ({
  tiles,
  sectors,
  selectedTileIdx,
  selectedSectorId,
  settlement,
  onSelectTile,
  onSelectSector,
}) => {
  const [viewMode, setViewMode] = useState<'circular' | 'linear'>('circular');
  const [hoveredTileIdx, setHoveredTileIdx] = useState<number | null>(null);

  // SVG Geometry for Circular Ring
  const center = 280;
  const outerRadius = 240;
  const innerRadius = 145;
  const sectorRadius = 262;

  // Calculate Polar Coordinates
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    x: number,
    y: number,
    innerRad: number,
    outerRad: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const startOuter = polarToCartesian(x, y, outerRad, endAngle);
    const endOuter = polarToCartesian(x, y, outerRad, startAngle);
    const startInner = polarToCartesian(x, y, innerRad, startAngle);
    const endInner = polarToCartesian(x, y, innerRad, endAngle);

    const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M',
      startOuter.x,
      startOuter.y,
      'A',
      outerRad,
      outerRad,
      0,
      arcSweep,
      0,
      endOuter.x,
      endOuter.y,
      'L',
      startInner.x,
      startInner.y,
      'A',
      innerRad,
      innerRad,
      0,
      arcSweep,
      1,
      endInner.x,
      endInner.y,
      'Z',
    ].join(' ');
  };

  return (
    <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl backdrop-blur-md flex flex-col items-center">
      {/* Top Bar with Mode Switch */}
      <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-300">
            32-Tile Planetary Ring & 8 Sector Zones
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setViewMode('circular')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'circular'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            Celestial Orbit
          </button>
          <button
            onClick={() => setViewMode('linear')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'linear'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
            Linear Strip
          </button>
        </div>
      </div>

      {/* Main Visualizer Body */}
      {viewMode === 'circular' ? (
        <div className="relative flex items-center justify-center w-full max-w-[560px] aspect-square select-none">
          <svg
            viewBox="0 0 560 560"
            className="w-full h-full drop-shadow-[0_0_25px_rgba(79,70,229,0.15)]"
          >
            <defs>
              {/* Radial gradient for planetary core */}
              <radialGradient id="planetCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="60%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Inner Planetary Core */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius - 10}
              fill="url(#planetCore)"
              stroke="#312e81"
              strokeWidth="2"
              className="transition-all"
            />

            {/* Core Center Display */}
            <g className="text-center pointer-events-none">
              <circle cx={center} cy={center} r="45" fill="#1e293b" fillOpacity="0.8" stroke="#475569" strokeWidth="1" />
              <text
                x={center}
                y={center - 12}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] uppercase font-bold tracking-wider"
              >
                Selected
              </text>
              <text
                x={center}
                y={center + 10}
                textAnchor="middle"
                className="fill-amber-400 text-lg font-black font-mono"
              >
                Tile #{selectedTileIdx}
              </text>
              <text
                x={center}
                y={center + 26}
                textAnchor="middle"
                className="fill-indigo-300 text-[10px] font-semibold"
              >
                Sector {Math.floor(selectedTileIdx / 4)}: {sectors[Math.floor(selectedTileIdx / 4)]?.soil_profile}
              </text>
            </g>

            {/* 8 Sector Outer Arcs */}
            {sectors.map((sector) => {
              const startAngle = (sector.sector_id * 360) / NUM_SECTORS;
              const endAngle = ((sector.sector_id + 1) * 360) / NUM_SECTORS;
              const isSelectedSector = selectedSectorId === sector.sector_id;
              const soilStyle = SOIL_COLORS[sector.soil_profile];

              // Check if all 4 tiles are stable
              const allStable = sector.tile_indices.every(
                (idx) => (tiles[idx]?.ticks_stable ?? 0) >= SOIL_STABILITY_TICKS,
              );

              const midAngle = (startAngle + endAngle) / 2;
              const labelPos = polarToCartesian(center, center, sectorRadius + 10, midAngle);

              return (
                <g key={`sector-${sector.sector_id}`}>
                  {/* Outer Sector Zone Ring Banner */}
                  <path
                    d={describeArc(center, center, outerRadius + 6, outerRadius + 22, startAngle + 0.8, endAngle - 0.8)}
                    fill={soilStyle.bg}
                    stroke={isSelectedSector ? '#f59e0b' : soilStyle.border}
                    strokeWidth={isSelectedSector ? 2.5 : 1}
                    className="cursor-pointer transition-all hover:brightness-125"
                    onClick={() => onSelectSector(sector.sector_id)}
                  />

                  {/* Sector ID & Stability Star */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 3}
                    textAnchor="middle"
                    className="fill-slate-200 text-[9px] font-bold pointer-events-none"
                  >
                    S{sector.sector_id} {allStable ? '★' : ''}
                  </text>

                  {/* Monument / Structure Indicator on Sector Arc */}
                  {sector.structure.type === 'Monument' && (
                    <circle
                      cx={labelPos.x}
                      cy={labelPos.y - 12}
                      r="5"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}

            {/* 32 Tile Segments */}
            {tiles.map((tile, idx) => {
              const startAngle = (idx * 360) / RING_SIZE;
              const endAngle = ((idx + 1) * 360) / RING_SIZE;
              const isSelected = selectedTileIdx === idx;
              const isHovered = hoveredTileIdx === idx;
              const sectorIdx = Math.floor(idx / TILES_PER_SECTOR);
              const sector = sectors[sectorIdx];
              const soilStyle = SOIL_COLORS[sector?.soil_profile || 'BarrenRock'];

              const isStable = tile.ticks_stable >= SOIL_STABILITY_TICKS;
              const stabilityRatio = Math.min(1, tile.ticks_stable / SOIL_STABILITY_TICKS);

              // Harvest target line / indicator
              const isHarvestTarget = settlement.last_harvest_target === idx;
              const isSettlementTile = settlement.tile_index === idx;

              // Arc fill calculation
              const midAngle = (startAngle + endAngle) / 2;
              const tilePos = polarToCartesian(center, center, (innerRadius + outerRadius) / 2, midAngle);
              const stabilityArcRadius = innerRadius + (outerRadius - innerRadius) * stabilityRatio;

              return (
                <g
                  key={`tile-${idx}`}
                  className="cursor-pointer transition-all"
                  onClick={() => onSelectTile(idx)}
                  onMouseEnter={() => setHoveredTileIdx(idx)}
                  onMouseLeave={() => setHoveredTileIdx(null)}
                >
                  {/* Tile Base Wedge */}
                  <path
                    d={describeArc(center, center, innerRadius, outerRadius, startAngle + 0.5, endAngle - 0.5)}
                    fill={isSelected ? '#4338ca' : isHovered ? '#312e81' : '#1e293b'}
                    stroke={
                      isSelected
                        ? '#fbbf24'
                        : isStable
                        ? '#10b981'
                        : isHarvestTarget
                        ? '#ec4899'
                        : '#334155'
                    }
                    strokeWidth={isSelected ? 2.5 : isStable ? 1.8 : 1}
                    className="transition-colors duration-150"
                  />

                  {/* Stability Progress Fill Arc */}
                  {stabilityRatio > 0 && (
                    <path
                      d={describeArc(
                        center,
                        center,
                        innerRadius + 2,
                        innerRadius + (outerRadius - innerRadius - 4) * stabilityRatio,
                        startAngle + 1.2,
                        endAngle - 1.2,
                      )}
                      fill={isStable ? '#059669' : '#0284c7'}
                      fillOpacity={isStable ? 0.45 : 0.25}
                      pointerEvents="none"
                    />
                  )}

                  {/* Tile Index Number */}
                  <text
                    x={tilePos.x}
                    y={tilePos.y - 10}
                    textAnchor="middle"
                    className={`text-[9px] font-mono font-bold pointer-events-none ${
                      isSelected ? 'fill-amber-300' : 'fill-slate-400'
                    }`}
                  >
                    {idx}
                  </text>

                  {/* Stability Ticks Mini Badge */}
                  <text
                    x={tilePos.x}
                    y={tilePos.y + 4}
                    textAnchor="middle"
                    className={`text-[8px] font-mono font-bold pointer-events-none ${
                      isStable ? 'fill-emerald-300' : 'fill-slate-500'
                    }`}
                  >
                    {tile.ticks_stable}t
                  </text>

                  {/* Settlement or Monument icon */}
                  {isSettlementTile && (
                    <circle
                      cx={tilePos.x}
                      cy={tilePos.y + 14}
                      r="4"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  )}

                  {/* Aspect Icon Indicator */}
                  {tile.aspect_slots[0] && (
                    <circle
                      cx={tilePos.x}
                      cy={tilePos.y - 20}
                      r="3.5"
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />
                  )}
                </g>
              );
            })}

            {/* Harvest Line Animation from Settlement to Target Tile */}
            {settlement.last_harvest_target !== null && (
              <g className="pointer-events-none">
                {(() => {
                  const sIdx = settlement.tile_index;
                  const tIdx = settlement.last_harvest_target;
                  const sAngle = ((sIdx + 0.5) * 360) / RING_SIZE;
                  const tAngle = ((tIdx + 0.5) * 360) / RING_SIZE;
                  const sPos = polarToCartesian(center, center, (innerRadius + outerRadius) / 2, sAngle);
                  const tPos = polarToCartesian(center, center, (innerRadius + outerRadius) / 2, tAngle);

                  return (
                    <>
                      <line
                        x1={sPos.x}
                        y1={sPos.y}
                        x2={tPos.x}
                        y2={tPos.y}
                        stroke="#f43f5e"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="animate-pulse"
                      />
                      <circle cx={tPos.x} cy={tPos.y} r="8" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-ping" />
                    </>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>
      ) : (
        /* Linear 1D Unfolded Ring Strip */
        <div className="w-full flex flex-col gap-3 py-2">
          <div className="grid grid-cols-8 gap-2 w-full">
            {sectors.map((sector) => {
              const isSelectedSector = selectedSectorId === sector.sector_id;
              const soilStyle = SOIL_COLORS[sector.soil_profile];
              const allStable = sector.tile_indices.every(
                (idx) => (tiles[idx]?.ticks_stable ?? 0) >= SOIL_STABILITY_TICKS,
              );

              return (
                <div
                  key={`linear-sec-${sector.sector_id}`}
                  onClick={() => onSelectSector(sector.sector_id)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelectedSector
                      ? 'border-amber-400 bg-slate-800/90 ring-2 ring-amber-400/20'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200">
                      Sector {sector.sector_id}
                    </span>
                    {allStable && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800">
                        Stable ★
                      </span>
                    )}
                  </div>

                  <div
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate"
                    style={{
                      backgroundColor: soilStyle.bg,
                      color: soilStyle.text,
                      border: `1px solid ${soilStyle.border}`,
                    }}
                  >
                    {soilStyle.label}
                  </div>

                  {sector.structure.type === 'Monument' && (
                    <div className="text-[9px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-600 font-semibold">
                      🏛️ Monument (+5 Focus)
                    </div>
                  )}

                  {/* 4 Child Tiles */}
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {sector.tile_indices.map((tIdx) => {
                      const tile = tiles[tIdx];
                      const isSelected = selectedTileIdx === tIdx;
                      const isTileStable = tile.ticks_stable >= SOIL_STABILITY_TICKS;
                      const isSettlement = settlement.tile_index === tIdx;
                      const isHarvested = settlement.last_harvest_target === tIdx;

                      return (
                        <div
                          key={`lin-tile-${tIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTile(tIdx);
                          }}
                          className={`p-1 rounded text-center cursor-pointer transition-all border ${
                            isSelected
                              ? 'border-amber-400 bg-indigo-900/80 text-amber-300'
                              : isTileStable
                              ? 'border-emerald-600/60 bg-emerald-950/30 text-emerald-300'
                              : isHarvested
                              ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                              : 'border-slate-700/60 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="text-[10px] font-mono font-bold">#{tIdx}</div>
                          <div className="text-[8px] font-mono">
                            {tile.ticks_stable}t
                          </div>
                          {isSettlement && <div className="text-[8px]">🏰</div>}
                          {tile.aspect_slots[0] && <div className="text-[8px]">🌱</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visualizer Legend */}
      <div className="w-full flex flex-wrap items-center justify-center gap-3 md:gap-5 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 border border-slate-500" />
          <span>Barren Rock</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-900 border border-orange-600" />
          <span>Clay</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-950 border border-emerald-600" />
          <span>Fertile Loam (Top)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-950 border border-red-600" />
          <span>Volcanic Ash</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-300 font-medium">≥ 20 Ticks (Stable)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400">🏛️</span>
          <span>Monument</span>
        </div>
      </div>
    </div>
  );
};
