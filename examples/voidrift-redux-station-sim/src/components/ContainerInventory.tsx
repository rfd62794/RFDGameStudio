import React from 'react';
import { GameState } from '../services/simulation';
import { Wind, Droplets, Boxes, Layers, AlertTriangle, ShieldCheck, Wrench, Trash2 } from 'lucide-react';
import { soundEngine } from '../services/audio';

interface Props {
  gameState: GameState;
  onPurgeSlot: (slotId: string) => void;
  onRepairSlot: (slotId: string) => void;
  onSelectModule: (moduleId: string) => void;
}

export const ContainerInventory: React.FC<Props> = ({
  gameState,
  onPurgeSlot,
  onRepairSlot,
  onSelectModule,
}) => {
  // Group slots by type
  const gasSlots = gameState.containerSlots.filter((s) => s.stateType === 'gas');
  const liquidSlots = gameState.containerSlots.filter((s) => s.stateType === 'liquid');
  const solidSlots = gameState.containerSlots.filter((s) => s.stateType === 'solid');
  const dustSlots = gameState.containerSlots.filter((s) => s.stateType === 'dust');

  return (
    <div id="container-inventory-dashboard" className="p-4 flex flex-col gap-6 select-none">
      {/* Overview Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            Physical Containment Matrix (Astroneer Typed Storage)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Containers are state-specific. Gas requires Pressurized Tanks, Liquid requires Sealed Flasks, Solid requires Resource Bins. No cross-filling.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-sky-400">
            <Wind className="w-4 h-4" />
            <span>{gasSlots.length} Tanks</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Droplets className="w-4 h-4" />
            <span>{liquidSlots.length} Flasks</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <Boxes className="w-4 h-4" />
            <span>{solidSlots.length} Bins</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Layers className="w-4 h-4" />
            <span>{dustSlots.length} Hoppers</span>
          </div>
        </div>
      </div>

      {/* 1. Gas Tanks (Pressurized) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-sky-200">Pressurized Gas Tanks</h3>
            <span className="text-[11px] text-slate-400 font-mono">
              (Volatile • Requires careful isolation)
            </span>
          </div>
        </div>

        {gasSlots.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No Gas Tanks constructed. Build Pressurized Tanks on station grid to store gases.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gasSlots.map((slot) => {
              const comp = gameState.compounds.find((c) => c.id === slot.compoundId);
              const mod = gameState.modules.find((m) => m.id === slot.moduleId);
              const fillRatio = (slot.amount / slot.capacity) * 100;
              const hasWarning = mod?.warning;

              return (
                <div
                  key={slot.id}
                  id={`slot-${slot.id}`}
                  onClick={() => mod && onSelectModule(mod.id)}
                  className={`relative p-3.5 rounded-xl bg-slate-900/80 border transition-all cursor-pointer hover:border-sky-500/60 ${
                    hasWarning
                      ? 'border-red-500/80 bg-red-950/20'
                      : 'border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <Wind className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">
                          {comp ? comp.name : 'Empty Tank'}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {mod ? `Grid (${mod.x}, ${mod.y})` : 'Detached'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {comp && slot.amount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPurgeSlot(slot.id);
                            soundEngine.playContainerHiss();
                          }}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Purge compound from tank"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Level Meter */}
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Stored:</span>
                      <span className="text-sky-300 font-semibold">
                        {Math.floor(slot.amount)} / {slot.capacity} u
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-400 transition-all duration-300 rounded-full"
                        style={{ width: `${fillRatio}%` }}
                      />
                    </div>
                  </div>

                  {/* Status / Warnings */}
                  {hasWarning && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-red-400 font-mono bg-red-950/40 p-1.5 rounded border border-red-500/30">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      <span>{hasWarning}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Liquid Flasks (Sealed) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-200">Sealed Liquid Flasks</h3>
            <span className="text-[11px] text-slate-400 font-mono">
              (Corrosive • Degrades without Void Stabilizer)
            </span>
          </div>
        </div>

        {liquidSlots.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No Liquid Flasks constructed. Build Sealed Flasks on station grid to store liquids.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {liquidSlots.map((slot) => {
              const comp = gameState.compounds.find((c) => c.id === slot.compoundId);
              const mod = gameState.modules.find((m) => m.id === slot.moduleId);
              const fillRatio = (slot.amount / slot.capacity) * 100;

              return (
                <div
                  key={slot.id}
                  id={`slot-${slot.id}`}
                  onClick={() => mod && onSelectModule(mod.id)}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 transition-all cursor-pointer hover:border-emerald-500/60 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Droplets className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">
                          {comp ? comp.name : 'Empty Flask'}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {mod ? `Grid (${mod.x}, ${mod.y})` : 'Detached'}
                        </span>
                      </div>
                    </div>

                    {comp && slot.amount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPurgeSlot(slot.id);
                          soundEngine.playContainerHiss();
                        }}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Purge liquid"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Level Meter */}
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Stored:</span>
                      <span className="text-emerald-300 font-semibold">
                        {Math.floor(slot.amount)} / {slot.capacity} u
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                        style={{ width: `${fillRatio}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Solid Resource Bins */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-200">Solid Resource Bins</h3>
            <span className="text-[11px] text-slate-400 font-mono">(Stable • Heavy ore storage)</span>
          </div>
        </div>

        {solidSlots.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No Solid Bins constructed. Build Resource Bins on station grid to store mineral shards.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {solidSlots.map((slot) => {
              const comp = gameState.compounds.find((c) => c.id === slot.compoundId);
              const mod = gameState.modules.find((m) => m.id === slot.moduleId);
              const fillRatio = (slot.amount / slot.capacity) * 100;

              return (
                <div
                  key={slot.id}
                  id={`slot-${slot.id}`}
                  onClick={() => mod && onSelectModule(mod.id)}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 transition-all cursor-pointer hover:border-amber-500/60 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Boxes className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">
                          {comp ? comp.name : 'Empty Bin'}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {mod ? `Grid (${mod.x}, ${mod.y})` : 'Detached'}
                        </span>
                      </div>
                    </div>

                    {comp && slot.amount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPurgeSlot(slot.id);
                          soundEngine.playContainerHiss();
                        }}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Purge solid ore"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Level Meter */}
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Stored:</span>
                      <span className="text-amber-300 font-semibold">
                        {Math.floor(slot.amount)} / {slot.capacity} u
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300 rounded-full"
                        style={{ width: `${fillRatio}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
