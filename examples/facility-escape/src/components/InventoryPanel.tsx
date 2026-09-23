import React from 'react';
import { GameObject } from '../types';
import { 
  Flame, 
  Zap, 
  Trash2, 
  Sparkles, 
  RotateCw, 
  Shield, 
  Check, 
  Volume2, 
  Compass,
  CornerDownRight,
  Plus
} from 'lucide-react';

interface InventoryPanelProps {
  inventory: GameObject[];
  selectedIndex: number | null;
  onSelectItem: (index: number) => void;
  onDropItem: (index: number) => void;
  onCancelUse: () => void;
}

export default function InventoryPanel({
  inventory,
  selectedIndex,
  onSelectItem,
  onDropItem,
  onCancelUse,
}: InventoryPanelProps) {

  // Helper to render property description tags
  const renderItemAttributes = (item: GameObject) => {
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {/* Render properties */}
        {item.properties.map(p => {
          let badgeColor = 'bg-slate-700 text-slate-300';
          if (p === 'flammable') badgeColor = 'bg-orange-950/85 text-orange-400 border border-orange-900/50';
          if (p === 'conductive') badgeColor = 'bg-cyan-950/85 text-cyan-400 border border-cyan-900/50';
          if (p === 'loud') badgeColor = 'bg-yellow-950/85 text-yellow-400 border border-yellow-900/50';
          if (p === 'reflective') badgeColor = 'bg-indigo-950/85 text-indigo-400 border border-indigo-900/50';
          if (p === 'adhesive') badgeColor = 'bg-amber-950/85 text-amber-300 border border-amber-900/50';
          return (
            <span key={p} className={`text-[8px] px-1 py-0.5 rounded uppercase font-mono font-bold ${badgeColor}`}>
              {p}
            </span>
          );
        })}

        {/* Render carriers */}
        {item.carriers?.map(c => {
          let badgeColor = 'bg-amber-900 text-amber-200';
          let icon = null;
          if (c === 'heat') {
            badgeColor = 'bg-red-950 text-red-300 border border-red-850';
            icon = <Flame size={8} className="text-red-400 inline" />;
          }
          if (c === 'electric') {
            badgeColor = 'bg-cyan-950 text-cyan-300 border border-cyan-850';
            icon = <Zap size={8} className="text-cyan-300 inline" />;
          }
          return (
            <span key={c} className={`text-[8px] px-1 py-0.5 rounded uppercase font-mono font-bold flex items-center gap-0.5 ${badgeColor}`}>
              {icon} Carries {c.toUpperCase()}
            </span>
          );
        })}

        {/* Custom triggers / uses */}
        {item.name === 'Glue Bottle' && (
          <span className="text-[8px] px-1 py-0.5 rounded uppercase font-mono font-bold bg-amber-950 text-amber-300 border border-amber-900 flex items-center gap-0.5">
            Carries ADHESIVE
          </span>
        )}
        {item.name.startsWith('Hand Mirror') && (
          <span className="text-[8px] px-1 py-0.5 rounded uppercase font-mono font-bold bg-indigo-900 text-indigo-200 flex items-center gap-0.5">
            <CornerDownRight size={8} /> Reflects Sight
          </span>
        )}
        {item.name === 'Firecracker' && (
          <span className="text-[8px] px-1 py-0.5 rounded uppercase font-mono font-bold bg-rose-950 text-rose-300 border border-rose-900 flex items-center gap-0.5">
            <Volume2 size={8} /> Explodes on Heat
          </span>
        )}
      </div>
    );
  };

  return (
    <div id="inventory-panel" className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-4 flex flex-col h-full shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <h3 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-1.5">
          <Shield size={16} className="text-sky-400" /> PLAYER INVENTORY
        </h3>
        <span className="text-xs font-mono text-slate-500">
          {inventory.length} / 6 slots
        </span>
      </div>

      {inventory.length === 0 ? (
        <div id="empty-inventory" className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-800 rounded-lg">
          <p className="text-xs font-mono text-slate-500">Inventory is empty.</p>
          <p className="text-[10px] font-mono text-slate-600 mt-1">Walk over pickable items and tap current cell to pick them up.</p>
        </div>
      ) : (
        <div id="inventory-list" className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[220px]">
          {inventory.map((item, index) => {
            const isSelected = selectedIndex === index;
            return (
              <div
                id={`inv-item-${index}`}
                key={item.id}
                className={`relative p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 ${
                  isSelected 
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/10' 
                    : 'bg-slate-800/50 border-slate-750 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-100 font-mono">
                      {item.name}
                    </span>
                    {renderItemAttributes(item)}
                  </div>

                  <div className="flex gap-1">
                    {/* Select/Use item button */}
                    {isSelected ? (
                      <button
                        onClick={onCancelUse}
                        className="bg-amber-600 hover:bg-amber-700 text-slate-950 text-[10px] font-bold py-1 px-2 rounded font-mono transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectItem(index)}
                        className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold py-1 px-2.5 rounded font-mono transition-colors flex items-center gap-1"
                      >
                        Use
                      </button>
                    )}

                    {/* Discard item */}
                    <button
                      onClick={() => onDropItem(index)}
                      title="Discard item on floor"
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded bg-slate-850 hover:bg-slate-900 border border-slate-700 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <div className="text-[10px] text-amber-300 font-mono bg-amber-950/70 p-1.5 rounded border border-amber-900/30">
                    {item.carriers && item.carriers.includes('heat') && (
                      <span>🔥 Aim Mode: Click any tile to ignite Flammable objects.</span>
                    )}
                    {item.carriers && item.carriers.includes('electric') && (
                      <span>⚡ Aim Mode: Click any tile to conduct electricity.</span>
                    )}
                    {item.name === 'Glue Bottle' && (
                      <span>🧪 Aim Mode: Click any tile or Guard to glue and immobilize them.</span>
                    )}
                    {item.name.startsWith('Hand Mirror') && (
                      <span>🪞 Aim Mode: Click an empty grid tile to place this reflection mirror.</span>
                    )}
                    {item.name === 'Firecracker' && (
                      <span>🧨 Aim Mode: Click any empty tile to throw the firecracker there.</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
