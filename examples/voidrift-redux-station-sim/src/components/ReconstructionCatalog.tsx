import React from 'react';
import { GameState } from '../services/simulation';
import { ReconstructionItem } from '../types';
import {
  Sparkles,
  Flower2,
  RadioTower,
  Waves,
  Milestone,
  Globe2,
  Mountain,
  Trees,
  SunMedium,
  Sun,
  Lock,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Flame,
} from 'lucide-react';
import { soundEngine } from '../services/audio';
import confetti from 'canvas-confetti';

interface Props {
  gameState: GameState;
  onInitiateReconstruction: (itemId: string) => void;
}

export const ReconstructionCatalog: React.FC<Props> = ({
  gameState,
  onInitiateReconstruction,
}) => {
  const tier1Items = gameState.reconstructionItems.filter((i) => i.tier === 1);
  const tier2Items = gameState.reconstructionItems.filter((i) => i.tier === 2);
  const tier3Items = gameState.reconstructionItems.filter((i) => i.tier === 3);

  const totalCompleted = gameState.reconstructionItems.filter((i) => i.isCompleted).length;

  const getItemIcon = (iconType: string, color: string) => {
    switch (iconType) {
      case 'Flower2':
        return <Flower2 className="w-5 h-5" style={{ color }} />;
      case 'RadioTower':
        return <RadioTower className="w-5 h-5" style={{ color }} />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" style={{ color }} />;
      case 'Waves':
        return <Waves className="w-5 h-5" style={{ color }} />;
      case 'Milestone':
        return <Milestone className="w-5 h-5" style={{ color }} />;
      case 'Globe2':
        return <Globe2 className="w-5 h-5" style={{ color }} />;
      case 'Mountain':
        return <Mountain className="w-5 h-5" style={{ color }} />;
      case 'Trees':
        return <Trees className="w-5 h-5" style={{ color }} />;
      case 'SunMedium':
        return <SunMedium className="w-5 h-5" style={{ color }} />;
      default:
        return <Sun className="w-5 h-5" style={{ color }} />;
    }
  };

  const renderItemCard = (item: ReconstructionItem) => {
    const hasDust = gameState.dust >= item.dustCost;

    let hasAllInputs = true;
    const inputStatus = item.requiredInputs.map((req) => {
      const prod = gameState.products[req.inputId];
      const count = prod?.count || 0;
      if (count < req.amount) {
        hasAllInputs = false;
      }
      return {
        name: prod?.name || req.inputId,
        needed: req.amount,
        available: count,
        isSatisfied: count >= req.amount,
      };
    });

    const canStart = hasDust && hasAllInputs && !item.isCompleted && !item.isReconstructing;

    return (
      <div
        key={item.id}
        id={`catalog-item-${item.id}`}
        className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 transition-all ${
          item.isCompleted
            ? 'bg-slate-900/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
            : item.isReconstructing
            ? 'bg-slate-900 border-cyan-500/50 shadow-lg ring-1 ring-cyan-500/30'
            : 'bg-slate-900/70 border-slate-800'
        }`}
      >
        <div className="flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner text-lg"
                style={{
                  backgroundColor: `${item.visualDetails?.color}15`,
                  borderColor: `${item.visualDetails?.color}40`,
                }}
              >
                {getItemIcon(item.iconType, item.visualDetails?.color || '#38bdf8')}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{item.name}</span>
                </h4>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {item.type} • Tier {item.tier}
                </span>
              </div>
            </div>

            {item.isCompleted ? (
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>EXISTS</span>
              </span>
            ) : item.isReconstructing ? (
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded-md animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>FORGING...</span>
              </span>
            ) : null}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

          {/* Lore backstory */}
          <p className="text-[11px] text-slate-400 font-serif italic border-l-2 border-slate-700 pl-2 py-0.5">
            “{item.loreBackstory}”
          </p>
        </div>

        {/* Input requirements or Progress */}
        {item.isCompleted ? (
          <div className="pt-2.5 border-t border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
            <span>Restored to Universe Catalog</span>
            <span className="text-slate-400">★ +1 Reconstructed</span>
          </div>
        ) : item.isReconstructing ? (
          <div className="pt-2.5 border-t border-slate-800 flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-cyan-300">Atomic Assembly:</span>
              <span className="text-cyan-300 font-bold">{item.progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-200 rounded-full"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="pt-2.5 border-t border-slate-800 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  hasDust
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-red-950/60 border-red-500/40 text-red-400'
                }`}
              >
                Dust: {Math.floor(gameState.dust)} / {item.dustCost}
              </span>

              {inputStatus.map((inp) => (
                <span
                  key={inp.name}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    inp.isSatisfied
                      ? 'bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-red-950/60 border-red-500/40 text-red-400'
                  }`}
                >
                  {inp.name}: {inp.available} / {inp.needed}
                </span>
              ))}
            </div>

            <button
              id={`btn-reconstruct-${item.id}`}
              disabled={!canStart}
              onClick={() => {
                if (canStart) {
                  onInitiateReconstruction(item.id);
                  soundEngine.playBuildClink();
                  confetti({
                    particleCount: 40,
                    spread: 60,
                    origin: { y: 0.8 },
                  });
                }
              }}
              className={`w-full py-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 ${
                canStart
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-md'
                  : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{canStart ? 'Synthesize & Reconstruct' : 'Awaiting Synthesis Inputs'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="reconstruction-catalog-dashboard" className="p-4 flex flex-col gap-6 select-none">
      {/* 1. Grand Premise Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-semibold text-slate-100">
              The Cosmic Catalog (Universe Reconstruction Matrix)
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            The black hole consumed the previous universe. Using the compressed matter harvested by your drones and refined via Synthesis, you are building forward — restoring entities, planetary spheres, and burning stars.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">Restored Entities</span>
            <span className="text-base font-bold text-purple-300">
              {totalCompleted} / {gameState.reconstructionItems.length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tier 1: Miscellaneous Entities & Phenomena */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flower2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-300">
              Tier 1 — Micro-Entities & Vacuum Phenomena
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {tier1Items.filter((i) => i.isCompleted).length} / {tier1Items.length} Reconstructed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tier1Items.map(renderItemCard)}
        </div>
      </section>

      {/* 3. Tier 2: Planetary Worlds */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-cyan-300">
              Tier 2 — Planetary Worlds (World-Forging)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {tier2Items.filter((i) => i.isCompleted).length} / {tier2Items.length} Reconstructed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tier2Items.map(renderItemCard)}
        </div>
      </section>

      {/* 4. Tier 3: Stars & Cosmic Cascades (Prestige Multiplier) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">
              Tier 3 — Rekindled Stars (Cosmic Cascade Igniters)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {tier3Items.filter((i) => i.isCompleted).length} / {tier3Items.length} Reconstructed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tier3Items.map(renderItemCard)}
        </div>
      </section>
    </div>
  );
};
