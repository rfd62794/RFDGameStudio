import React from 'react';
import { GameState } from '../types';
import { COMPOUNDS_BY_ID } from '../data/compounds';
import { Wind, Droplets, Boxes, Layers, AlertTriangle } from 'lucide-react';

interface Props {
  gameState: GameState;
  onPurgeSlot?: (slotId: string) => void;
}

export const ContainerPanel: React.FC<Props> = ({ gameState, onPurgeSlot }) => {
  const getContainerIcon = (stateType: string) => {
    switch (stateType) {
      case 'gas': return <Wind className="w-5 h-5 text-sky-400" />;
      case 'liquid': return <Droplets className="w-5 h-5 text-emerald-400" />;
      case 'solid': return <Boxes className="w-5 h-5 text-amber-400" />;
      default: return <Layers className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            Typed Storage Matrix (Astroneer Containment Model)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict container typing: Gaseous, Liquid, and Solid compounds require matched containment.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {gameState.containerSlots.length} Total Containment Pods
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {gameState.containerSlots.map((slot) => {
          const comp = slot.compoundId ? COMPOUNDS_BY_ID[slot.compoundId] : null;
          const fillRatio = slot.capacity > 0 ? (slot.amount / slot.capacity) * 100 : 0;

          return (
            <div
              key={slot.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                slot.isBreached
                  ? 'bg-red-950/40 border-red-500/50'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {getContainerIcon(slot.stateType)}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-200 capitalize">
                        {slot.stateType} Pod
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {comp ? comp.name : 'Empty Slot'}
                      </span>
                    </div>
                  </div>

                  {slot.isBreached && (
                    <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono font-bold bg-red-950 border border-red-500/40 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      BREACHED
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-xs font-mono pt-1">
                  <span className="text-slate-400">Contents:</span>
                  <span className="text-slate-200 font-bold">
                    {Math.round(slot.amount)} / {slot.capacity}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${fillRatio}%`,
                      backgroundColor: comp?.color || '#38bdf8',
                    }}
                  />
                </div>
              </div>

              {onPurgeSlot && slot.amount > 0 && (
                <button
                  onClick={() => onPurgeSlot(slot.id)}
                  className="w-full py-1 text-[11px] font-mono text-slate-400 hover:text-red-300 bg-slate-900 hover:bg-red-950/40 rounded border border-slate-800 transition-colors"
                >
                  Venting & Purge
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
