import React from 'react';
import { 
  ToolMode, 
  CardinalDirection, 
  RawPartId 
} from '../types';
import { RAW_PARTS } from '../engine/recipes';
import { 
  ArrowRight, 
  RotateCw, 
  Wrench, 
  Package, 
  Layers, 
  Trash2, 
  Eraser, 
  Eye, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft 
} from 'lucide-react';

interface ToolbarProps {
  toolMode: ToolMode;
  selectedDirection: CardinalDirection;
  selectedSpawnerPart: RawPartId;
  unlockedParts: RawPartId[];
  onSelectTool: (tool: ToolMode) => void;
  onSelectDirection: (dir: CardinalDirection) => void;
  onRotateDirection: () => void;
  onSelectSpawnerPart: (part: RawPartId) => void;
  onClearAll: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  toolMode,
  selectedDirection,
  selectedSpawnerPart,
  unlockedParts,
  onSelectTool,
  onSelectDirection,
  onRotateDirection,
  onSelectSpawnerPart,
  onClearAll,
}) => {
  const tools: Array<{ id: ToolMode; label: string; icon: React.ReactNode; color: string; desc: string }> = [
    { id: 'inspect', label: 'Inspect', icon: <Eye size={18} />, color: 'hover:border-slate-400 text-slate-300', desc: 'Inspect grid cells & stats' },
    { id: 'conveyor', label: 'Conveyor', icon: <ArrowRight size={18} />, color: 'hover:border-sky-500 text-sky-400', desc: 'Moves parts in pointed direction' },
    { id: 'fitter', label: 'Assembly Fitter', icon: <Wrench size={18} />, color: 'hover:border-amber-500 text-amber-400', desc: 'Combines parts into finished weapons' },
    { id: 'packer', label: 'Store Crate', icon: <Package size={18} />, color: 'hover:border-purple-500 text-purple-400', desc: 'Packs weapons into Storefront Shelf' },
    { id: 'spawner', label: 'Intake Hopper', icon: <Layers size={18} />, color: 'hover:border-emerald-500 text-emerald-400', desc: 'Dispenses raw parts onto belt' },
    { id: 'trash', label: 'Recycler', icon: <Trash2 size={18} />, color: 'hover:border-rose-500 text-rose-400', desc: 'Clears and recycles stray items' },
    { id: 'clear', label: 'Bulldozer', icon: <Eraser size={18} />, color: 'hover:border-red-500 text-red-400', desc: 'Demolishes placed tiles' },
  ];

  const getDirIcon = (dir: CardinalDirection) => {
    switch (dir) {
      case 'N': return <ArrowUp size={16} />;
      case 'E': return <ArrowRight size={16} />;
      case 'S': return <ArrowDown size={16} />;
      case 'W': return <ArrowLeft size={16} />;
    }
  };

  return (
    <div className="bg-slate-900/95 border-t border-slate-800 p-3 px-6 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
      {/* Primary Tool Selectors */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Tools:</span>
        {tools.map((t) => {
          const isActive = toolMode === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              title={t.desc}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/50 scale-[1.02]'
                  : `bg-slate-950/60 border-slate-800/80 ${t.color}`
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Direction & Sub-configuration */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Direction Selector (relevant for Conveyor, Fitter, Spawner) */}
        {(toolMode === 'conveyor' || toolMode === 'fitter' || toolMode === 'spawner') && (
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 px-2">Flow Dir:</span>
            {(['N', 'E', 'S', 'W'] as CardinalDirection[]).map((d) => (
              <button
                key={d}
                onClick={() => onSelectDirection(d)}
                className={`p-1.5 rounded-md text-xs font-mono font-bold flex items-center justify-center transition-all ${
                  selectedDirection === d
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={`Orient ${d}`}
              >
                {getDirIcon(d)}
              </button>
            ))}
            <button
              onClick={onRotateDirection}
              className="p-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all border-l border-slate-800 ml-1"
              title="Rotate 90° clockwise (Hotkey: R)"
            >
              <RotateCw size={15} />
            </button>
          </div>
        )}

        {/* Spawner Part Selector (when Spawner tool is active) */}
        {toolMode === 'spawner' && (
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 px-2">Dispense:</span>
            {unlockedParts.map((pId) => {
              const part = RAW_PARTS[pId];
              const isSelected = selectedSpawnerPart === pId;
              return (
                <button
                  key={pId}
                  onClick={() => onSelectSpawnerPart(pId)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  style={{ color: isSelected ? '#020617' : part?.color }}
                >
                  {part?.shortName || pId}
                </button>
              );
            })}
          </div>
        )}

        {/* Clear Floor Button */}
        <button
          onClick={onClearAll}
          className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 px-3 py-1.5 rounded-lg border border-slate-800/80 transition-colors"
          title="Clear all tiles from workshop floor"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};
