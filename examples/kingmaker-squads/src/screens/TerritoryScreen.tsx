import React, { useState, useRef } from 'react';
import { TerritoryCell, UnitState, DeclaredAction, DefenseForce } from '../types';
import { FACTIONS, HOUSES } from '../data/archetypes';
import { HouseId } from '../types';
import { getTerrainDisplayName } from '../data/terrainDisplay';
import { IsometricBuildingLayer } from '../components/IsometricBuildingLayer';
import { ChessIcon } from '../components/ChessIcon';
import { RIVER_PATH, BRIDGE_LOCATIONS, riverPathToSvgD, HOVEL_NAME } from '../data/worldGeometry';
import {
  Shield,
  Eye,
  Crown,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  Sparkles,
  ShieldX,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Castle,
  Anchor,
  Swords,
  Zap,
} from 'lucide-react';

export const DEFAULT_VIEWBOX = { x: -50, y: -50, width: 700, height: 700 };
export const MIN_ZOOM_WIDTH = 250;
export const MAX_ZOOM_WIDTH = 900;
export const PAN_MIN_X = -200;
export const PAN_MAX_X = 600;
export const PAN_MIN_Y = -200;
export const PAN_MAX_Y = 600;
export const LOD_THRESHOLD = 500;

export function computeMapBounds(cells: TerritoryCell[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  if (cells && cells.length > 0) {
    for (const cell of cells) {
      for (const [px, py] of cell.polygonPoints) {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
  }

  for (const [rx, ry] of RIVER_PATH) {
    if (rx < minX) minX = rx;
    if (rx > maxX) maxX = rx;
    if (ry < minY) minY = ry;
    if (ry > maxY) maxY = ry;
  }

  if (minX === Infinity) {
    minX = -100;
    maxX = 700;
    minY = -100;
    maxY = 700;
  }

  return { minX, maxX, minY, maxY };
}

export function computePanBounds(cells: TerritoryCell[], padding = 150) {
  const bounds = computeMapBounds(cells);
  return {
    minX: Math.floor(bounds.minX - padding),
    maxX: Math.ceil(bounds.maxX + padding - 200),
    minY: Math.floor(bounds.minY - padding),
    maxY: Math.ceil(bounds.maxY + padding - 200),
  };
}

export function getFitViewBox(cells: TerritoryCell[], padding = 40) {
  const bounds = computeMapBounds(cells);
  const rawWidth = bounds.maxX - bounds.minX + padding * 2;
  const rawHeight = bounds.maxY - bounds.minY + padding * 2;
  const width = Math.max(MIN_ZOOM_WIDTH, Math.max(rawWidth, rawHeight));
  const height = width;
  const x = Math.round(bounds.minX - padding + (rawWidth < width ? (rawWidth - width) / 2 : 0));
  const y = Math.round(bounds.minY - padding + (rawHeight < height ? (rawHeight - height) / 2 : 0));
  return { x, y, width, height };
}

export function clampViewBox(
  vb: { x: number; y: number; width: number; height: number },
  cells?: TerritoryCell[]
) {
  const width = Math.max(MIN_ZOOM_WIDTH, Math.min(MAX_ZOOM_WIDTH, vb.width));
  const height = width;

  let panMinX = PAN_MIN_X;
  let panMaxX = PAN_MAX_X;
  let panMinY = PAN_MIN_Y;
  let panMaxY = PAN_MAX_Y;

  if (cells && cells.length > 0) {
    const pBounds = computePanBounds(cells);
    panMinX = pBounds.minX;
    panMaxX = pBounds.maxX;
    panMinY = pBounds.minY;
    panMaxY = pBounds.maxY;
  }

  const x = Math.max(panMinX, Math.min(panMaxX, vb.x));
  const y = Math.max(panMinY, Math.min(panMaxY, vb.y));

  return { x, y, width, height };
}

interface TerritoryScreenProps {
  cells: TerritoryCell[];
  selectedCellId: string | null;
  gold: number;
  squadUnits: UnitState[];
  kingUnit: UnitState | null;
  kingSettlingTurns: number;
  declaredActions?: DeclaredAction[];
  defenseForces?: DefenseForce[];
  marshOutline?: [number, number][];
  onSelectCell: (cellId: string) => void;
  onScoutCell: (cellId: string) => void;
  onBackToShop: () => void;
  onEngageBattle?: (cellId: string) => void;
  onDeclareAction?: (targetCellId: string, intent: 'attack' | 'reinforce') => void;
  onRespondAction?: (targetCellId: string) => void;
  gamePhase?: string;
}

export function TerritoryScreen({
  cells = [],
  selectedCellId,
  gold,
  squadUnits = [],
  kingUnit,
  kingSettlingTurns,
  declaredActions = [],
  defenseForces = [],
  marshOutline,
  onSelectCell,
  onScoutCell,
  onBackToShop,
  onEngageBattle,
  onDeclareAction,
  onRespondAction,
  gamePhase,
}: TerritoryScreenProps) {
  const selectedCell = cells.find((c) => c.id === selectedCellId) || cells[0];
  const isPlayerOwned = selectedCell?.owner === 'player';
  const scoutCost = 1;

  const [viewBox, setViewBox] = useState(() =>
    cells && cells.length > 0 ? getFitViewBox(cells) : DEFAULT_VIEWBOX
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const centerOnKingdom = React.useCallback(() => {
    setViewBox(getFitViewBox(cells));
  }, [cells]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    dragDistanceRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const container = svgRef.current?.getBoundingClientRect();
    const containerWidth = container?.width || 600;
    const containerHeight = container?.height || 600;

    const dxClient = dragStart.x - e.clientX;
    const dyClient = dragStart.y - e.clientY;

    const totalDistFromStart = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );
    dragDistanceRef.current = totalDistFromStart;

    if (
      totalDistFromStart > 5 &&
      svgRef.current &&
      !svgRef.current.hasPointerCapture(e.pointerId)
    ) {
      try {
        svgRef.current.setPointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }

    const dx = dxClient * (viewBox.width / containerWidth);
    const dy = dyClient * (viewBox.height / containerHeight);

    setViewBox((vb) =>
      clampViewBox(
        {
          ...vb,
          x: vb.x + dx,
          y: vb.y + dy,
        },
        cells
      )
    );
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    if (svgRef.current && svgRef.current.hasPointerCapture(e.pointerId)) {
      try {
        svgRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  // Non-passive wheel event listener to call preventDefault() and fix scroll conflict
  React.useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((vb) =>
        clampViewBox(
          {
            ...vb,
            width: vb.width * zoomFactor,
            height: vb.height * zoomFactor,
          },
          cells
        )
      );
    };

    svgEl.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', onWheelNative);
    };
  }, [cells]);

  const handleCellClick = (cellId: string) => {
    if (dragDistanceRef.current > 5) {
      return;
    }
    onSelectCell(cellId);
  };

  const showDistrictDetail = viewBox.width < LOD_THRESHOLD;

  const houseRegions = React.useMemo(() => {
    const map = new Map<HouseId, { houseId: HouseId; cells: TerritoryCell[]; centerX: number; centerY: number }>();
    for (const cell of cells) {
      const hId = (cell.houseId || cell.owner) as HouseId;
      if (!map.has(hId)) {
        map.set(hId, { houseId: hId, cells: [], centerX: 0, centerY: 0 });
      }
      const reg = map.get(hId)!;
      reg.cells.push(cell);
    }
    for (const reg of map.values()) {
      const sumX = reg.cells.reduce((acc, c) => acc + c.x, 0);
      const sumY = reg.cells.reduce((acc, c) => acc + c.y, 0);
      reg.centerX = Math.round(sumX / (reg.cells.length || 1));
      reg.centerY = Math.round(sumY / (reg.cells.length || 1));
    }
    return Array.from(map.values());
  }, [cells]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* MAP CANVAS (Left / Center) */}
        <div className="flex-1 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
          {/* Map Header Overlay */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 z-10">
            <button
              onClick={onBackToShop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 border border-zinc-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Squad Shop
            </button>

            <div className="text-right">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">The Front Map</span>
              <span className="text-xs text-zinc-400">Select a cell to evaluate territory status</span>
            </div>
          </div>

          {/* SVG Tessellated Voronoi Territory Map */}
          <div
            data-testid={showDistrictDetail ? 'district-level-view' : 'region-level-view'}
            className="relative w-full aspect-[16/10] max-h-[500px] flex items-center justify-center my-auto"
          >
            <svg
              ref={svgRef}
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
              className="w-full h-full drop-shadow-2xl select-none cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" strokeWidth="0.5" opacity="0.3" />
                </pattern>
              </defs>
              <rect x="-300" y="-300" width="1200" height="1200" fill="url(#grid)" className="pointer-events-none" />

              {/* River Bed & River Path Layer */}
              <g data-testid="river-layer" className="pointer-events-none">
                <path
                  data-testid="river-bed"
                  d={riverPathToSvgD(RIVER_PATH)}
                  stroke="#1E3A8A"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.35"
                />
                <path
                  data-testid="river-path"
                  d={riverPathToSvgD(RIVER_PATH)}
                  stroke="#3B82F6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.8"
                />
                {BRIDGE_LOCATIONS.map((bridge, idx) => (
                  <g key={`bridge-${idx}`} transform={`translate(${bridge[0]}, ${bridge[1]})`}>
                    <rect x="-6" y="-3" width="12" height="6" fill="#71717A" stroke="#27272A" strokeWidth="1" rx="1" />
                  </g>
                ))}
              </g>

              {/* Marsh Region Outline (Dim Silhouette) */}
              {marshOutline && marshOutline.length >= 3 && (
                <g data-testid="marsh-outline-layer" className="pointer-events-none">
                  <polygon
                    data-testid="marsh-outline-polygon"
                    points={marshOutline.map((p) => p.join(',')).join(' ')}
                    fill="#CA8A04"
                    fillOpacity="0.04"
                    stroke="#CA8A04"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    strokeOpacity="0.35"
                  />
                </g>
              )}

              {/* Polygon Territory Cells */}
              {cells.map((cell) => {
                const houseKey = cell.houseId || cell.owner;
                const houseInfo = HOUSES[houseKey as HouseId];
                const faction = houseInfo || FACTIONS[cell.owner] || FACTIONS.player;
                const cellColor = houseInfo ? houseInfo.color : faction.color;
                const isSelected = cell.id === selectedCell?.id;
                const pointsStr = cell.polygonPoints.map((p) => p.join(',')).join(' ');
                const isHovel = cell.name === HOVEL_NAME || cell.id === 'cell_capital';

                // Check if targeted by declared attack
                const isTargeted = (declaredActions || []).some(
                  (a) => a.targetCellId === cell.id && a.actionIntent === 'attack'
                );

                // Check if defense forces assigned to cell
                const cellDefenseForces = (defenseForces || []).filter((df) => df.cellId === cell.id);

                return (
                  <g
                    key={cell.id}
                    data-testid={`cell-group-${cell.id}`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(cell.id);
                    }}
                  >
                    <polygon
                      data-lod={showDistrictDetail ? 'district' : 'region'}
                      points={pointsStr}
                      fill={cellColor}
                      fillOpacity={isSelected ? '0.45' : showDistrictDetail ? '0.22' : '0.35'}
                      stroke={
                        cell.isExposed
                          ? '#EF4444'
                          : isTargeted
                          ? '#F59E0B'
                          : isSelected
                          ? '#F59E0B'
                          : cellColor
                      }
                      strokeWidth={
                        cell.isExposed
                          ? '3.5'
                          : isTargeted
                          ? '4'
                          : isSelected
                          ? '3.5'
                          : showDistrictDetail
                          ? '1.5'
                          : '1.0'
                      }
                      strokeOpacity={showDistrictDetail ? 1 : 0.4}
                      className={`transition-all duration-300 group-hover:fill-opacity-40 ${
                        cell.isExposed ? 'animate-pulse' : isTargeted ? 'animate-pulse' : ''
                      }`}
                    />

                    {/* Isometric Building Sub-Grid Layer (District View only) */}
                    {showDistrictDetail && <IsometricBuildingLayer cell={cell} />}

                    {/* Cell Center Label Group (District View or Selected Cell) */}
                    {(showDistrictDetail || isSelected) && (
                      <foreignObject x={cell.x - 60} y={cell.y - 32} width="120" height="64">
                        <div className="w-full h-full flex flex-col items-center justify-center text-center pointer-events-none">
                          {/* Distinct Hovel Fortress Marker */}
                          {isHovel && (
                            <div
                              data-testid="hovel-fortress-marker"
                              className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950/90 border border-amber-500/80 text-amber-300 shadow-md mb-0.5 flex items-center gap-1 uppercase tracking-wider"
                            >
                              <Castle className="w-2.5 h-2.5 text-amber-400" />
                              HOVEL FORTRESS
                            </div>
                          )}

                          {/* Exposed Cell Badge */}
                          {cell.isExposed && (
                            <div className="text-[8px] font-black px-1.5 py-0.2 rounded bg-rose-600 text-zinc-100 uppercase tracking-tighter shadow-md mb-0.5 flex items-center gap-0.5 animate-bounce">
                              <ShieldX className="w-2.5 h-2.5" /> EXPOSED
                            </div>
                          )}

                          {/* Target Indicator */}
                          {isTargeted && !cell.isExposed && (
                            <div className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 uppercase tracking-tighter shadow-md mb-0.5">
                              TARGETED
                            </div>
                          )}

                          {/* Crown badge if King cell */}
                          {cell.hasKing && !isHovel && (
                            <div
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-md ${
                                cell.owner === 'player' && kingSettlingTurns > 0
                                  ? 'bg-rose-500 text-zinc-950 animate-bounce'
                                  : 'bg-amber-400 text-zinc-950'
                              }`}
                            >
                              <Crown className="w-2.5 h-2.5 fill-current" />
                              {cell.owner === 'player' && kingSettlingTurns > 0 ? 'SETTLING' : 'LEADER'}
                            </div>
                          )}

                          {/* Defense Force Markers */}
                          {cellDefenseForces.length > 0 && (
                            <div className="flex items-center gap-0.5 my-0.5">
                              {cellDefenseForces.map((df) => (
                                <span
                                  key={df.id}
                                  className="bg-blue-600 text-zinc-100 text-[8px] font-black px-1 py-0.2 rounded flex items-center gap-0.5 border border-blue-400 shadow"
                                  title={df.name}
                                >
                                  <Shield className="w-2 h-2 fill-current" />
                                  {df.units.length}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Name */}
                          <span className="text-[10px] font-bold text-zinc-100 font-serif leading-none truncate max-w-[110px] mt-0.5 drop-shadow">
                            {cell.name}
                          </span>

                          {/* Troops / Threat */}
                          <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-300 mt-0.5">
                            <span className="text-amber-400 font-bold">{cell.troopCount} Units</span>
                            {!cell.scouted && cell.owner !== 'player' && (
                              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> Hidden
                              </span>
                            )}
                          </div>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}

              {/* Region Level Overlay when Zoomed Out */}
              {!showDistrictDetail && (
                <g data-testid="region-level-overlay">
                  {houseRegions.map((reg) => {
                    const hInfo = HOUSES[reg.houseId];
                    const name = hInfo ? hInfo.name : reg.houseId.toUpperCase();
                    const color = hInfo ? hInfo.color : '#F59E0B';
                    const isPlayer = reg.houseId === 'ember';

                    return (
                      <foreignObject
                        key={`region-banner-${reg.houseId}`}
                        x={reg.centerX - 65}
                        y={reg.centerY - 22}
                        width="130"
                        height="44"
                        className="pointer-events-none"
                      >
                        <div
                          data-testid={`region-banner-${reg.houseId}`}
                          className="w-full h-full flex flex-col items-center justify-center text-center bg-zinc-950/85 backdrop-blur-md border border-zinc-700/80 rounded-xl p-1 shadow-2xl"
                        >
                          <span
                            className="text-[10px] font-mono font-bold tracking-widest uppercase truncate max-w-[120px]"
                            style={{ color }}
                          >
                            {name}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-400">
                            {reg.cells.length} Districts {isPlayer ? '• Hovel Fortress' : ''}
                          </span>
                        </div>
                      </foreignObject>
                    );
                  })}
                </g>
              )}
            </svg>

            {/* Map View Navigation Controls Overlay */}
            <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-xl shadow-xl backdrop-blur-sm">
              <button
                onClick={() => setViewBox((vb) => clampViewBox({ ...vb, width: vb.width * 0.8, height: vb.height * 0.8 }, cells))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold flex items-center justify-center transition border border-zinc-700"
                title="Zoom In"
                data-testid="zoom-in-button"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewBox((vb) => clampViewBox({ ...vb, width: vb.width * 1.25, height: vb.height * 1.25 }, cells))}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold flex items-center justify-center transition border border-zinc-700"
                title="Zoom Out"
                data-testid="zoom-out-button"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={centerOnKingdom}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold flex items-center justify-center transition border border-zinc-700"
                title="Center / Fit to View"
                data-testid="center-view-button"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Declared Actions Bar */}
          {(declaredActions || []).length > 0 && (
            <div className="mt-2 p-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs space-y-1.5 z-10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                Declared Intentions This Round ({declaredActions.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {(declaredActions || []).map((act) => {
                  const faction = FACTIONS[act.factionId];
                  const targetCell = cells.find((c) => c.id === act.targetCellId);
                  return (
                    <div
                      key={act.id}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono border ${
                        act.actionIntent === 'attack'
                          ? 'bg-rose-950/60 border-rose-600/50 text-rose-200'
                          : 'bg-blue-950/60 border-blue-600/50 text-blue-200'
                      }`}
                    >
                      <span className="font-bold" style={{ color: faction?.color }}>
                        {faction?.name}
                      </span>
                      <span>→ {act.actionIntent.toUpperCase()}</span>
                      <span className="text-zinc-300">[{targetCell?.name}]</span>
                      {act.isResponse && (
                        <span className="text-[9px] bg-amber-500 text-zinc-950 px-1 rounded font-sans">
                          RESP
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 z-10">
            {Object.values(HOUSES).map((h) => (
              <div key={h.id} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm border"
                  style={{ backgroundColor: h.color + '40', borderColor: h.color }}
                />
                <span>{h.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CELL DETAIL PANEL (Right) */}
        <div className="w-full lg:w-96 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400">
                  {HOUSES[(selectedCell.houseId || selectedCell.owner) as HouseId]?.name || FACTIONS[selectedCell.owner]?.name}
                </span>
                <h2 className="text-base font-black text-amber-100 font-serif flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  {selectedCell.name}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {getTerrainDisplayName(selectedCell.type)}
                </span>
                <span className="text-[10px] font-mono text-zinc-300 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                  Allegiance: {selectedCell.publicOpinion ?? 50}%
                </span>
              </div>
            </div>

            {/* Settling Warning */}
            {selectedCell.owner === 'player' && selectedCell.hasKing && kingSettlingTurns > 0 && (
              <div className="p-3 mb-3 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-200 text-xs shadow-inner">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <Sparkles className="w-4 h-4 text-rose-400 animate-spin" />
                  <span>NEW CELL LEADER SETTLING PERIOD ({kingSettlingTurns} Turns Left)</span>
                </div>
                <p className="text-[11px] text-rose-300/80 mt-1 leading-snug">
                  Your new Cell Leader is unshielded and fully visible to opposing forces! Defend this cell immediately or assign a Knight Escort.
                </p>
              </div>
            )}

            {/* Stationed Defense Force */}
            {(() => {
              const stationedDf = defenseForces.find((df) => df.cellId === selectedCell.id);
              if (!stationedDf) return null;
              const loyalty = stationedDf.loyalty ?? 100;
              const loyaltyColor =
                loyalty > 70
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/60'
                  : loyalty > 30
                  ? 'text-amber-400 border-amber-500/30 bg-amber-950/60'
                  : 'text-rose-400 border-rose-500/30 bg-rose-950/60';
              const barBg = loyalty > 70 ? 'bg-emerald-500' : loyalty > 30 ? 'bg-amber-500' : 'bg-rose-500';

              return (
                <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5 font-serif">
                      <Shield className="w-4 h-4 text-blue-400" />
                      {stationedDf.name} ({stationedDf.units.length} Units)
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${loyaltyColor}`}>
                        Loyalty: {loyalty}%
                      </span>
                      <span className="text-[10px] font-mono text-zinc-300 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                        Allegiance: {selectedCell.publicOpinion ?? 50}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                    <div className={`h-full transition-all duration-300 ${barBg}`} style={{ width: `${loyalty}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* Troop Composition / Scout Status */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Opposing Troops ({selectedCell.troopCount})
                </span>
                {selectedCell.scouted || isPlayerOwned ? (
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded">
                    SCOUTED
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/80 border border-rose-600/40 px-2 py-0.5 rounded">
                    FOG OF WAR
                  </span>
                )}
              </div>

              {!selectedCell.scouted && !isPlayerOwned ? (
                <div className="p-3 text-center rounded-lg bg-zinc-900 border border-dashed border-zinc-800">
                  <p className="text-xs text-zinc-400 mb-2">
                    Unit composition hidden. Scout this cell to reveal exact enemy archetypes and stats.
                  </p>
                  <button
                    onClick={() => onScoutCell(selectedCell.id)}
                    disabled={gold < scoutCost}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-zinc-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 mx-auto"
                  >
                    <Eye className="w-3.5 h-3.5" /> Scout Cell ({scoutCost}g)
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedCell.enemyUnits && selectedCell.enemyUnits.length > 0 ? (
                    selectedCell.enemyUnits.map((u, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-1.5 bg-zinc-900 rounded text-xs text-zinc-300 font-mono"
                      >
                        <div className="flex items-center gap-1.5">
                          <ChessIcon type={u.archetype} className="w-4 h-4 text-amber-400" />
                          <span>{u.name}</span>
                          {u.isKing && <Crown className="w-3 h-3 text-amber-400 fill-current" />}
                          {u.isEscort && <span className="text-[9px] text-blue-400">[ESCORT]</span>}
                        </div>
                        <span className="text-zinc-500 text-[10px]">
                          {u.stats.hp} HP / {u.stats.atk} ATK
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No opposing units present.</p>
                  )}
                </div>
              )}
            </div>

            {/* Committed Squad Summary */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2">
                Your Squad ({squadUnits.length} Units)
              </span>
              <div className="space-y-1.5">
                {squadUnits.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-1.5 bg-zinc-900 rounded text-xs text-zinc-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <ChessIcon type={u.archetype} className="w-4 h-4 text-amber-400" />
                      <span className="font-medium">{u.name}</span>
                      {u.id === kingUnit?.id && <Crown className="w-3 h-3 text-amber-400 fill-current" />}
                      {u.isEscort && <span className="text-[10px] text-blue-400 font-mono">[ESCORT]</span>}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">{u.stats.hp} HP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Attack / Declare Action Button */}
            {selectedCell && (
              <div className="mt-4 pt-3 border-t border-zinc-800">
                {squadUnits.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Squad empty. Assign units in Shop to engage in battle.</span>
                  </div>
                ) : gamePhase === 'pre_turn_declaration' && onDeclareAction ? (
                  <button
                    data-testid="cell-detail-declare-button"
                    onClick={() => onDeclareAction(selectedCell.id, isPlayerOwned ? 'reinforce' : 'attack')}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
                      isPlayerOwned
                        ? 'bg-blue-600 hover:bg-blue-500 text-zinc-100 shadow-blue-950/50'
                        : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-950/50'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    {isPlayerOwned
                      ? `Declare Reinforcement [${selectedCell.name}]`
                      : `Declare Attack Target [${selectedCell.name}]`}
                  </button>
                ) : gamePhase === 'pre_turn_response' && onRespondAction ? (
                  <button
                    data-testid="cell-detail-respond-button"
                    onClick={() => onRespondAction(selectedCell.id)}
                    className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-zinc-100 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4" />
                    Reinforce Response Window [{selectedCell.name}]
                  </button>
                ) : (
                  onEngageBattle && (
                    <button
                      data-testid="cell-detail-attack-button"
                      onClick={() => onEngageBattle(selectedCell.id)}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
                        isPlayerOwned
                          ? 'bg-blue-600 hover:bg-blue-500 text-zinc-100 shadow-blue-950/50'
                          : 'bg-rose-600 hover:bg-rose-500 text-zinc-100 shadow-rose-950/50'
                      }`}
                    >
                      <Swords className="w-4 h-4" />
                      {isPlayerOwned
                        ? `Fortify & Defend [${selectedCell.name}]`
                        : `Attack Contested Territory [${selectedCell.name}]`}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
