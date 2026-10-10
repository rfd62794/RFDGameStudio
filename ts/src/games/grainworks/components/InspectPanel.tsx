import React from 'react';
import { MaterialType, MATERIAL_DEFS } from '../types';
import { CellularGrid, GRID_WIDTH } from '../simulation/grid';
import { BuildingManager } from '../simulation/buildings';
import { BUILDING_TILE } from '../simulation/buildingDefs';
import { Info, Box, Cpu, Workflow, Radio } from 'lucide-react';

interface InspectPanelProps {
  hoverCell: { x: number; y: number } | null;
  grid: CellularGrid;
  buildingMgr: BuildingManager;
}

export const InspectPanel: React.FC<InspectPanelProps> = ({
  hoverCell,
  grid,
  buildingMgr,
}) => {
  if (!hoverCell || !grid.isInBounds(hoverCell.x, hoverCell.y)) {
    return (
      <div className="absolute bottom-3 left-3 bg-[#0c101d]/90 backdrop-blur border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg text-[11px] font-mono shadow-lg pointer-events-none select-none flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-cyan-400" />
        <span>Hover cursor over grid to inspect cell physics & machinery</span>
      </div>
    );
  }

  const { x, y } = hoverCell;
  const idx = y * GRID_WIDTH + x;
  const mat = grid.materials[idx] as MaterialType;
  const flag = grid.structureFlags[idx];
  const matDef = MATERIAL_DEFS[mat] || MATERIAL_DEFS[MaterialType.VACUUM];

  const tileX = Math.floor(x / BUILDING_TILE);
  const tileY = Math.floor(y / BUILDING_TILE);

  const building = buildingMgr.getBuildingAt(tileX, tileY);
  const pipe = buildingMgr.getPipeAt(tileX, tileY);

  return (
    <div className="absolute bottom-3 left-3 bg-[#0c101d]/95 backdrop-blur border border-cyan-500/30 text-slate-200 p-2.5 rounded-xl text-xs shadow-2xl shadow-black/60 pointer-events-none select-none max-w-xs space-y-1.5 animate-fadeIn z-10">
      {/* Header: Coords & Category */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold">POS:</span>
          <span>[{x}, {y}]</span>
          <span className="text-slate-400 font-mono text-[10px]">T[{tileX},{tileY}]</span>
          {y < 40 && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Impact Zone
            </span>
          )}
        </div>

        {flag === 1 && <span className="text-emerald-400 font-sans text-[10px]">Bedrock Solid</span>}
        {flag === 2 && <span className="text-emerald-300 font-sans text-[10px]">Structural Wall</span>}
      </div>

      {/* Building Info (if present) */}
      {building && (
        <div className="bg-[#131a2e] p-2 rounded-lg border border-[#232f48] space-y-1">
          <div className="flex items-center justify-between font-semibold text-[11px]">
            <span className="text-slate-100 flex items-center gap-1">
              {building.category === 'COLLECTOR' && <Radio className="w-3.5 h-3.5 text-cyan-400" />}
              {building.category === 'CONTAINER' && <Box className="w-3.5 h-3.5 text-purple-400" />}
              {building.category === 'PROCESSOR' && <Cpu className="w-3.5 h-3.5 text-amber-400" />}
              {building.category}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Cap: {building.capacity}
            </span>
          </div>

          {/* Stored buffer list */}
          <div className="text-[10px] font-mono text-slate-300">
            {Object.keys(building.buffer).length === 0 ? (
              <span className="text-slate-500 italic">Empty storage</span>
            ) : (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {Object.entries(building.buffer).map(([mStr, amt]) => {
                  const m = Number(mStr) as MaterialType;
                  const d = MATERIAL_DEFS[m];
                  return (
                    <span
                      key={m}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d?.color }} />
                      {d?.name}: {amt}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Processor Progress */}
          {building.category === 'PROCESSOR' && (
            <div className="mt-1 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-amber-300 font-semibold">{building.processorType}</span>
                <span className="font-mono text-slate-400">
                  {building.progress > 0 ? `${Math.round(building.progress * 100)}%` : 'Idle'}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-amber-500 h-full transition-all duration-200"
                  style={{ width: `${building.progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pipe Info (if present) */}
      {pipe && (
        <div className="bg-[#131a2e] p-2 rounded-lg border border-slate-700/60 font-mono text-[10px] space-y-1">
          <div className="flex items-center justify-between text-cyan-300 font-semibold">
            <span className="flex items-center gap-1">
              <Workflow className="w-3.5 h-3.5" />
              Pipe Conduit
            </span>
            <span>Flow: {pipe.direction}</span>
          </div>
          <div className="text-slate-400">
            Buffer:{' '}
            {pipe.buffer.length === 0
              ? 'Empty'
              : pipe.buffer.map((b) => `${MATERIAL_DEFS[b.material]?.name} (${b.amount})`).join(', ')}
          </div>
        </div>
      )}

      {/* Cell Material Specs */}
      {!building && !pipe && (
        <div className="flex items-start gap-2 pt-0.5">
          <div
            className="w-4 h-4 rounded mt-0.5 shrink-0 border border-slate-700"
            style={{ backgroundColor: matDef.color }}
          />
          <div>
            <div className="font-semibold text-slate-100 text-[11px] flex items-center gap-1.5">
              <span>{matDef.name}</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                {matDef.isGas ? 'GAS' : matDef.isLiquid ? 'LIQUID' : matDef.isSolid ? 'SOLID' : 'VACUUM'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
              {matDef.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
