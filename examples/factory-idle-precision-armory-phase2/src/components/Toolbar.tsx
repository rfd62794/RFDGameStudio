import React from 'react';
import { 
  ToolMode, 
  CardinalDirection, 
  RawPartId, 
  WeaponId, 
  TileType, 
  TechUpgrade 
} from '../types';
import { RAW_PARTS, WEAPON_RECIPES, BUILDING_DEFS } from '../engine/recipes';
import { 
  MousePointer, 
  RotateCw, 
  Trash2, 
  Package, 
  Hammer, 
  Box, 
  Layers, 
  Zap, 
  Cpu, 
  GitBranch, 
  GitMerge, 
  Minimize2, 
  Sliders, 
  TrendingUp, 
  Flame, 
  Plus,
  Compass
} from 'lucide-react';

interface ToolbarProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  direction: CardinalDirection;
  onRotateDirection: () => void;
  selectedSpawnerPart: RawPartId;
  onSelectSpawnerPart: (part: RawPartId) => void;
  selectedFilterPart: RawPartId;
  onSelectFilterPart: (part: RawPartId) => void;
  unlockedParts: RawPartId[];
  upgrades: TechUpgrade[];
  funds: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  toolMode,
  onSetToolMode,
  direction,
  onRotateDirection,
  selectedSpawnerPart,
  onSelectSpawnerPart,
  selectedFilterPart,
  onSelectFilterPart,
  unlockedParts,
  upgrades,
  funds,
}) => {
  const isTechUnlocked = (techId?: string) => {
    if (!techId) return true;
    return upgrades.some(u => u.id === techId && u.purchased);
  };

  const logisticsTools: Array<{ mode: ToolMode; tileType: TileType; label: string; icon: React.ReactNode; cost: number; techId?: string }> = [
    { mode: 'conveyor', tileType: 'conveyor', label: 'Belt', icon: <Layers size={14} />, cost: 2 },
    { mode: 'splitter', tileType: 'splitter', label: 'Splitter', icon: <GitBranch size={14} />, cost: 15, techId: 'tech_splitter' },
    { mode: 'merger', tileType: 'merger', label: 'Merger', icon: <GitMerge size={14} />, cost: 15, techId: 'tech_merger' },
    { mode: 'underground', tileType: 'underground_entry', label: 'Tunnel', icon: <Minimize2 size={14} />, cost: 25, techId: 'tech_underground' },
    { mode: 'crossing', tileType: 'crossing', label: 'Crossing', icon: <Plus size={14} />, cost: 20, techId: 'tech_crossing' },
    { mode: 'filter', tileType: 'filter', label: 'Sorter', icon: <Sliders size={14} />, cost: 30, techId: 'tech_filter' },
    { mode: 'switch', tileType: 'switch', label: 'Switch', icon: <GitBranch size={14} className="rotate-90" />, cost: 10 },
  ];

  const productionTools: Array<{ mode: ToolMode; tileType: TileType; label: string; icon: React.ReactNode; cost: number; techId?: string }> = [
    { mode: 'spawner', tileType: 'spawner', label: 'Buyer', icon: <Package size={14} />, cost: 10 },
    { mode: 'fitter', tileType: 'fitter', label: 'Fitter', icon: <Hammer size={14} />, cost: 25 },
    { mode: 'packer', tileType: 'packer', label: 'Packer', icon: <Box size={14} />, cost: 20 },
    { mode: 'seller', tileType: 'seller', label: 'Export', icon: <TrendingUp size={14} />, cost: 35, techId: 'tech_export_port' },
  ];

  const powerScienceTools: Array<{ mode: ToolMode; tileType: TileType; label: string; icon: React.ReactNode; cost: number; techId?: string }> = [
    { mode: 'power_gen', tileType: 'power_gen', label: 'Generator', icon: <Zap size={14} />, cost: 40 },
    { mode: 'lab', tileType: 'lab', label: 'R&D Lab', icon: <Cpu size={14} />, cost: 50, techId: 'tech_research_lab' },
  ];

  return (
    <div className="bg-slate-950/95 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 select-none text-xs backdrop-blur-md">
      {/* Category 1: Tools & Inspect */}
      <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
        <button
          onClick={() => onSetToolMode('inspect')}
          className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
            toolMode === 'inspect'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
          title="Inspect Machine Buffer & Toggle Power"
        >
          <MousePointer size={14} />
          <span>Inspect</span>
        </button>

        {/* Global Placement Direction Control */}
        <button
          onClick={onRotateDirection}
          className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 px-2.5 py-1 rounded-md font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
          title="Rotate Build Direction (R or Right Click)"
        >
          <Compass size={14} className="text-amber-400" />
          <span>Facing: <strong className="text-white font-black">{direction}</strong></span>
          <RotateCw size={12} className="opacity-70" />
        </button>
      </div>

      {/* Category 2: Logistics Tiles */}
      <div className="flex items-center gap-1 border-r border-slate-800 pr-3">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
          Logistics:
        </span>
        {logisticsTools.map((t) => {
          const unlocked = isTechUnlocked(t.techId);
          const active = toolMode === t.mode;
          return (
            <button
              key={t.mode}
              onClick={() => unlocked && onSetToolMode(t.mode)}
              disabled={!unlocked}
              className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                active
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : unlocked
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  : 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
              }`}
              title={`${t.label} ($${t.cost})${!unlocked ? ' - Locked (Requires Tech)' : ''}`}
            >
              {t.icon}
              <span>{t.label}</span>
              <span className="text-[9px] font-mono opacity-70">${t.cost}</span>
            </button>
          );
        })}
      </div>

      {/* Category 3: Production & Power */}
      <div className="flex items-center gap-1 border-r border-slate-800 pr-3">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
          Factory:
        </span>
        {productionTools.map((t) => {
          const unlocked = isTechUnlocked(t.techId);
          const active = toolMode === t.mode;
          return (
            <button
              key={t.mode}
              onClick={() => unlocked && onSetToolMode(t.mode)}
              disabled={!unlocked}
              className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                active
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : unlocked
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  : 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
              }`}
              title={`${t.label} ($${t.cost})${!unlocked ? ' - Locked (Requires Tech)' : ''}`}
            >
              {t.icon}
              <span>{t.label}</span>
              <span className="text-[9px] font-mono opacity-70">${t.cost}</span>
            </button>
          );
        })}

        {powerScienceTools.map((t) => {
          const unlocked = isTechUnlocked(t.techId);
          const active = toolMode === t.mode;
          return (
            <button
              key={t.mode}
              onClick={() => unlocked && onSetToolMode(t.mode)}
              disabled={!unlocked}
              className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                active
                  ? 'bg-blue-500 text-slate-950 font-bold shadow-xs'
                  : unlocked
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  : 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
              }`}
              title={`${t.label} ($${t.cost})${!unlocked ? ' - Locked (Requires Tech)' : ''}`}
            >
              {t.icon}
              <span>{t.label}</span>
              <span className="text-[9px] font-mono opacity-70">${t.cost}</span>
            </button>
          );
        })}
      </div>

      {/* Category 4: Sub-Selectors for Spawner / Filter & Trash */}
      <div className="flex items-center gap-2">
        {toolMode === 'spawner' && (
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 pl-1">Part:</span>
            {unlockedParts.map((pId) => {
              const part = RAW_PARTS[pId];
              return (
                <button
                  key={pId}
                  onClick={() => onSelectSpawnerPart(pId)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    selectedSpawnerPart === pId
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={{
                    color: selectedSpawnerPart === pId ? '#020617' : part.color,
                  }}
                >
                  {part.shortName}
                </button>
              );
            })}
          </div>
        )}

        {toolMode === 'filter' && (
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 pl-1">Filter:</span>
            {unlockedParts.map((pId) => {
              const part = RAW_PARTS[pId];
              return (
                <button
                  key={pId}
                  onClick={() => onSelectFilterPart(pId)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    selectedFilterPart === pId
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {part.shortName}
                </button>
              );
            })}
          </div>
        )}

        {/* Clear / Trash Tool */}
        <button
          onClick={() => onSetToolMode('clear')}
          className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
            toolMode === 'clear'
              ? 'bg-rose-600 text-white font-bold shadow-xs'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:text-rose-400'
          }`}
          title="Demolish Tile"
        >
          <Trash2 size={13} />
          <span>Demolish</span>
        </button>
      </div>
    </div>
  );
};
