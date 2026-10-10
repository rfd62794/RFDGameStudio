import React, { useEffect, useRef } from 'react';
import { X, RotateCcw, Check, Ban } from 'lucide-react';
import {
  BuildingInstance,
  MaterialType,
  MATERIAL_DEFS,
} from '../types';
import { getMaterialState, SOCKET_STATE_COLORS } from '../simulation/buildingDefs';

interface FilterPopupProps {
  building: BuildingInstance;
  position: { x: number; y: number };
  onUpdateFilter: (socketId: string, material: MaterialType, allow: boolean) => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

export const FilterPopup: React.FC<FilterPopupProps> = ({
  building,
  position,
  onUpdateFilter,
  onResetDefaults,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const allMaterials = [
    MaterialType.DUST,
    MaterialType.GAS,
    MaterialType.LIQUID,
    MaterialType.SOLID,
    MaterialType.PLASMA,
    MaterialType.VOID_CRYSTAL,
    MaterialType.MINERAL_SLURRY,
    MaterialType.REACTIVE_VAPOR,
    MaterialType.CONDENSATE,
    MaterialType.LUMINITE,
    MaterialType.STRUCTURAL_SOLID,
  ];

  // Clamp screen coordinates so popup doesn't overflow
  const popupWidth = 270;
  const left = Math.min(Math.max(10, position.x), window.innerWidth - popupWidth - 15);
  const top = Math.min(Math.max(60, position.y), window.innerHeight - 380);

  return (
    <div
      ref={popupRef}
      id={`filter-popup-${building.id}`}
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 w-[270px] bg-[#0c101c] border border-cyan-500/40 rounded-lg shadow-2xl overflow-hidden font-mono text-xs text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141b2d] border-b border-cyan-500/30">
        <div>
          <div className="text-[10px] uppercase text-cyan-400 font-semibold tracking-wider">
            Material Routing Filter
          </div>
          <div className="text-xs font-bold text-white uppercase tracking-wide">
            {building.buildingId.replace('processor_', '').replace('container_', '').replace('collector_', '').replace('_', ' ')}
          </div>
        </div>
        <button
          id="btn-close-filter-popup"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sockets Container */}
      <div className="p-2.5 max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
        {building.sockets.map((socket) => {
          const compatibleMaterials = allMaterials.filter((m) =>
            socket.acceptedStates.includes(getMaterialState(m))
          );
          const allowedSet = building.filter.allowed[socket.id] || new Set();

          const socketLabel = `${socket.kind.toUpperCase()} (${socket.side.toUpperCase()}) — ${socket.acceptedStates.join('/').toUpperCase()}`;
          const stateColor = SOCKET_STATE_COLORS[socket.acceptedStates[0]] || '#38bdf8';

          return (
            <div
              key={socket.id}
              className="bg-[#121829] border border-slate-700/60 rounded p-2 space-y-1.5"
            >
              {/* Socket Title */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-700/40 text-[10px]">
                <div className="flex items-center gap-1.5 font-bold" style={{ color: stateColor }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: stateColor }} />
                  {socketLabel}
                </div>
              </div>

              {/* Compatible Materials Toggle List */}
              <div className="space-y-1 pt-0.5">
                {compatibleMaterials.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic py-1">No compatible materials</div>
                ) : (
                  compatibleMaterials.map((mat) => {
                    const matDef = MATERIAL_DEFS[mat];
                    const isAllowed = allowedSet.has(mat);

                    return (
                      <div
                        key={mat}
                        className="flex items-center justify-between py-1 px-1.5 rounded bg-[#090d17] hover:bg-[#161e33] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm border border-black/50 shrink-0"
                            style={{ backgroundColor: matDef.color }}
                          />
                          <span className="text-[11px] text-slate-300 font-medium">
                            {matDef.name}
                          </span>
                        </div>

                        <button
                          id={`btn-filter-toggle-${socket.id}-${mat}`}
                          onClick={() => onUpdateFilter(socket.id, mat, !isAllowed)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            isAllowed
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-500/50 hover:bg-rose-900'
                          }`}
                        >
                          {isAllowed ? (
                            <>
                              <Check className="w-2.5 h-2.5" />
                              <span>ALLOW</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-2.5 h-2.5" />
                              <span>DENY</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Reset Button */}
      <div className="px-3 py-2 bg-[#141b2d] border-t border-slate-700/50 flex items-center justify-between">
        <button
          id="btn-reset-filter-defaults"
          onClick={onResetDefaults}
          className="flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-200 transition-colors py-1 px-2 rounded hover:bg-cyan-500/10"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset to defaults</span>
        </button>
        <span className="text-[9px] text-slate-500">Denied items spill to CA</span>
      </div>
    </div>
  );
};
