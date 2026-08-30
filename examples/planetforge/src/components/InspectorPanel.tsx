import React from 'react';
import {
  AspectId,
  ELEMENT_COLORS,
  ELEMENT_NAMES,
  ElementType,
  MONUMENT_BASE_FOCUS,
  MONUMENT_COST,
  ResourceLedger,
  SectorZone,
  SOIL_STABILITY_TICKS,
  SoilType,
  TileState,
  Settlement,
} from '../types';
import {
  evaluate_tile_yield,
  ring_distance,
  calculate_scan_score,
  soil_upgrade_target,
} from '../engine/slimeEngine';
import { SOIL_COLORS, ASPECT_ICONS } from './RingVisualizer';
import {
  Sparkles,
  Zap,
  Hammer,
  Flame,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Landmark,
  Compass,
  ArrowRight,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface InspectorPanelProps {
  selectedTileIdx: number;
  selectedSectorId: number;
  tiles: TileState[];
  sectors: SectorZone[];
  settlementLedger: ResourceLedger;
  settlement: Settlement;
  onConstructMonument: (sectorId: number) => void;
  onInfuseElement: (tileIdx: number, elementIdx: number, delta: number) => void;
  onPerturbTile: (tileIdx: number) => void;
  onBlessTileStability: (tileIdx: number, ticks: number) => void;
  onSetSectorSoil: (sectorId: number, soil: SoilType) => void;
  onSelectTile: (idx: number) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedTileIdx,
  selectedSectorId,
  tiles,
  sectors,
  settlementLedger,
  settlement,
  onConstructMonument,
  onInfuseElement,
  onPerturbTile,
  onBlessTileStability,
  onSetSectorSoil,
  onSelectTile,
}) => {
  const tile = tiles[selectedTileIdx];
  const sectorIdx = Math.floor(selectedTileIdx / 4);
  const sector = sectors[sectorIdx] || sectors[selectedSectorId];
  const soilStyle = SOIL_COLORS[sector.soil_profile];

  // Check 4-tile stability in sector
  const childTiles = sector.tile_indices.map((idx) => ({
    idx,
    tile: tiles[idx],
    isStable: (tiles[idx]?.ticks_stable ?? 0) >= SOIL_STABILITY_TICKS,
  }));
  const stableCount = childTiles.filter((c) => c.isStable).length;
  const allChildTilesStable = stableCount === 4;

  const nextSoilTarget = soil_upgrade_target(sector.soil_profile);

  // Yield & scan calculation for selected tile
  const tileYield = evaluate_tile_yield(tile, sector.soil_profile);
  const distToSettlement = ring_distance(settlement.tile_index, selectedTileIdx);
  const inScanRadius = distToSettlement <= settlement.scan_radius;
  const scanScore = calculate_scan_score(
    tileYield,
    settlement.demand_profile,
    distToSettlement,
    settlement.scan_radius,
  );

  // Monument affordability
  const canAffordMonument =
    settlementLedger.food >= MONUMENT_COST.food &&
    settlementLedger.energy >= MONUMENT_COST.energy &&
    settlementLedger.material >= MONUMENT_COST.material;

  const isSlotEmpty = sector.structure.type === 'None';

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. SECTOR ZONE INSPECTOR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-400">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Sector Zone #{sector.sector_id}
              </h3>
              <p className="text-[11px] text-slate-400">
                Tiles [{sector.tile_indices.join(', ')}] • Soil & Structure Domain
              </p>
            </div>
          </div>

          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5"
            style={{
              backgroundColor: soilStyle.bg,
              borderColor: soilStyle.border,
              color: soilStyle.text,
            }}
          >
            <span>{soilStyle.label}</span>
          </div>
        </div>

        {/* Soil Progression Ladder Status */}
        <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Soil Upgrade Ladder
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Target: {nextSoilTarget ? nextSoilTarget : 'None (Ladder Cap)'}
            </span>
          </div>

          {/* Ladder Visual Diagram */}
          <div className="flex items-center justify-between gap-1 text-[10px] font-medium text-slate-400 mb-3 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <div
              className={`px-2 py-1 rounded ${
                sector.soil_profile === 'BarrenRock'
                  ? 'bg-slate-700 text-white font-bold border border-slate-500'
                  : 'opacity-60'
              }`}
            >
              Barren Rock
            </div>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <div
              className={`px-2 py-1 rounded ${
                sector.soil_profile === 'Clay'
                  ? 'bg-orange-800 text-orange-200 font-bold border border-orange-500'
                  : 'opacity-60'
              }`}
            >
              Clay
            </div>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <div
              className={`px-2 py-1 rounded ${
                sector.soil_profile === 'FertileLoam'
                  ? 'bg-emerald-800 text-emerald-200 font-bold border border-emerald-500'
                  : 'opacity-60'
              }`}
            >
              Fertile Loam (Top)
            </div>
          </div>

          {/* Volcanic Ash Recoverable Note */}
          {sector.soil_profile === 'VolcanicAsh' && (
            <div className="flex items-center gap-2 p-2 bg-red-950/40 border border-red-800/80 rounded-lg text-[11px] text-red-300 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>
                <strong>Volcanic Ash</strong> is recoverable! Stabilizing all 4 child tiles loops it back to <strong>Clay</strong>.
              </span>
            </div>
          )}

          {/* 4 Child Tiles Stability Aggregation Meter */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">
                Child Tiles Stability ({stableCount}/4 at ≥ {SOIL_STABILITY_TICKS} ticks)
              </span>
              <span
                className={`font-bold text-[11px] ${
                  allChildTilesStable ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {allChildTilesStable ? 'Ready for Next Tick Upgrade! 🌟' : 'Accumulating Stability...'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {childTiles.map(({ idx, tile: childTile, isStable }) => {
                const ratio = Math.min(1, (childTile?.ticks_stable ?? 0) / SOIL_STABILITY_TICKS);
                const isSelected = selectedTileIdx === idx;

                return (
                  <button
                    key={`child-t-${idx}`}
                    onClick={() => onSelectTile(idx)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-indigo-950/80'
                        : isStable
                        ? 'border-emerald-700/70 bg-emerald-950/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-slate-200">Tile #{idx}</span>
                      <span className={isStable ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {childTile?.ticks_stable ?? 0}/{SOIL_STABILITY_TICKS}t
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isStable ? 'bg-emerald-400' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Structure Slot & Monument Construction */}
        <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              Sector Structure Slot (Max 1)
            </span>
            <span className="text-[11px] font-mono">
              {sector.structure.type === 'Monument' ? (
                <span className="text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600">
                  🏛️ Monument (+{MONUMENT_BASE_FOCUS} Focus)
                </span>
              ) : (
                <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Slot Empty
                </span>
              )}
            </span>
          </div>

          {sector.structure.type === 'None' ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-300">
                <div className="font-semibold text-slate-200">Build Sector Monument</div>
                <div className="text-[11px] text-slate-400">
                  Cost: <span className="text-emerald-400 font-mono">10 Food</span>,{' '}
                  <span className="text-rose-400 font-mono">5 Energy</span>,{' '}
                  <span className="text-amber-400 font-mono">15 Material</span>
                </div>
                <div className="text-[10px] text-amber-300/80 mt-0.5">
                  Provides flat <span className="font-bold">+{MONUMENT_BASE_FOCUS} bonus_focus</span>
                </div>
              </div>

              <button
                onClick={() => onConstructMonument(sector.sector_id)}
                disabled={!canAffordMonument}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  canAffordMonument
                    ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                Construct Monument
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-xs text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Monument Active</strong> — Imparts flat +{MONUMENT_BASE_FOCUS} Focus to planetary balance.
                </span>
              </div>
            </div>
          )}

          {/* Test Action: Erupt Volcanic Ash to test recovery */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">God Simulation Tool:</span>
            <button
              onClick={() => onSetSectorSoil(sector.sector_id, 'VolcanicAsh')}
              className="text-[11px] px-2.5 py-1 rounded bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 font-medium transition-colors flex items-center gap-1"
            >
              <Flame className="w-3 h-3 text-red-400" />
              Erupt Volcanic Ash (Test Recovery)
            </button>
          </div>
        </div>
      </div>

      {/* 2. TILE INSPECTOR & ELEMENTAL GOD ACTIONS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Tile #{selectedTileIdx} Inspector
              </h3>
              <p className="text-[11px] text-slate-400">
                Stability: <span className="text-emerald-400 font-mono font-bold">{tile.ticks_stable} consecutive ticks</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onBlessTileStability(selectedTileIdx, 5)}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 hover:bg-emerald-900 transition-colors flex items-center gap-1"
              title="Add +5 stability ticks"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              +5 Stability
            </button>
            <button
              onClick={() => onPerturbTile(selectedTileIdx)}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-950/80 border border-rose-700 text-rose-300 hover:bg-rose-900 transition-colors flex items-center gap-1"
              title="Perturb elemental tier (resets ticks_stable to 0)"
            >
              <Zap className="w-3 h-3 text-rose-400" />
              Perturb (Reset 0t)
            </button>
          </div>
        </div>

        {/* 4 Element Tiers & God Infusion Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {ELEMENT_NAMES.map((name, eIdx) => {
            const tierVal = tile.tiers[eIdx];
            const color = ELEMENT_COLORS[name];

            return (
              <div
                key={`el-${name}`}
                className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold" style={{ color }}>
                    {name}
                  </span>
                  <span className="text-xs font-mono font-black text-slate-200">
                    T{tierVal}
                  </span>
                </div>

                {/* Meter */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(tierVal / 10) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>

                {/* Infuse Buttons */}
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => onInfuseElement(selectedTileIdx, eIdx, -1)}
                    disabled={tierVal <= 0}
                    className="w-full py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => onInfuseElement(selectedTileIdx, eIdx, 1)}
                    disabled={tierVal >= 10}
                    className="w-full py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                  >
                    +1
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tile Aspects & Yield Output */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          {/* Active Aspects */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-1.5">
              Aspect Slots
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tile.aspect_slots.filter(Boolean).length > 0 ? (
                tile.aspect_slots.map((aspect, aIdx) => {
                  if (!aspect) return null;
                  return (
                    <span
                      key={`aspect-${aIdx}`}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200"
                    >
                      {ASPECT_ICONS[aspect]}
                      {aspect}
                    </span>
                  );
                })
              ) : (
                <span className="text-[11px] text-slate-500 italic">No aspect features bound</span>
              )}
            </div>
          </div>

          {/* Harvest Yield & Settlement Evaluation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-300">
                Harvest Yield ({soilStyle.label})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Dist: {distToSettlement} tiles ({inScanRadius ? 'In Range' : 'Out of Reach'})
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-bold">🌾 {tileYield.food} Food</span>
              <span className="text-rose-400 font-bold">⚡ {tileYield.energy} Energy</span>
              <span className="text-amber-400 font-bold">🧱 {tileYield.material} Material</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Settlement Scan Match Score:{' '}
              <strong className={inScanRadius ? 'text-indigo-300' : 'text-slate-600'}>
                {inScanRadius ? scanScore.toFixed(1) : '-∞ (Out of scan radius)'}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
