import React from 'react';
import { GameState } from '../services/simulation';
import { CompoundProductItem } from '../types';
import {
  FlaskConical,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
  Orbit,
  Wrench,
  Dna,
  Globe,
  Sun,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { soundEngine } from '../services/audio';

interface Props {
  gameState: GameState;
  onSetChamberRecipe: (moduleId: string, recipeId: string) => void;
  onSelectModule: (moduleId: string) => void;
}

export const SynthesisChamber: React.FC<Props> = ({
  gameState,
  onSetChamberRecipe,
  onSelectModule,
}) => {
  const chambers = gameState.modules.filter((m) => m.type === 'processing_chamber');

  const getProductIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-sky-400" />;
      case 'Radio':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Orbit':
        return <Orbit className="w-4 h-4 text-pink-400" />;
      case 'Wrench':
        return <Wrench className="w-4 h-4 text-slate-300" />;
      case 'Dna':
        return <Dna className="w-4 h-4 text-emerald-400" />;
      case 'Globe':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'Sun':
        return <Sun className="w-4 h-4 text-yellow-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div id="synthesis-chamber-dashboard" className="p-4 flex flex-col gap-6 select-none">
      {/* 1. SS13 Synergy Active Multipliers Banner */}
      <section className="bg-slate-900/70 border border-purple-500/30 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-semibold text-purple-200">
              Active Synthesis Multipliers (SS13 Synergy Engine)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Products feed back into all station systems
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-1">
          {(Object.values(gameState.products) as CompoundProductItem[]).map((prod) => {
            const isActive = prod.count > 0;
            return (
              <div
                key={prod.id}
                id={`prod-card-${prod.id}`}
                className={`p-3 rounded-lg border transition-all flex items-start gap-2.5 ${
                  isActive
                    ? 'bg-slate-900 border-purple-500/40 text-slate-200 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-purple-950/80 border border-purple-500/40' : 'bg-slate-900'
                  }`}
                >
                  {getProductIcon(prod.iconName)}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate">{prod.name}</span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        isActive ? 'text-purple-300' : 'text-slate-600'
                      }`}
                    >
                      x{prod.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {prod.effectDescription}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Processing Chambers on Station */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">Active Processing Chambers</h3>
            <span className="text-xs text-slate-400 font-mono">({chambers.length} Built)</span>
          </div>
        </div>

        {chambers.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No Processing Chambers constructed. Place one via the Construction menu to synthesize products.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {chambers.map((chamber, idx) => {
              const activeRecipe = gameState.recipes.find((r) => r.id === chamber.activeRecipeId);
              const progress = chamber.processingProgress || 0;

              // Check input availability
              const hasDust = !activeRecipe?.dustCost || gameState.dust >= activeRecipe.dustCost;
              const inputStatus = activeRecipe?.inputs.map((inp) => {
                const comp = gameState.compounds.find((c) => c.id === inp.compoundId);
                const slotsWithComp = gameState.containerSlots.filter(
                  (s) => s.compoundId === inp.compoundId && !s.isBreached
                );
                const totalAvail = slotsWithComp.reduce((sum, s) => sum + s.amount, 0);
                return {
                  name: comp?.name || inp.compoundId,
                  needed: inp.amount,
                  available: Math.floor(totalAvail),
                  isSatisfied: totalAvail >= inp.amount,
                };
              });

              const canRun = hasDust && inputStatus?.every((i) => i.isSatisfied) && chamber.isPowered;

              return (
                <div
                  key={chamber.id}
                  id={`chamber-${chamber.id}`}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">
                          Synthesis Unit #{idx + 1}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Grid ({chamber.x}, {chamber.y}) • Level {chamber.level}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          canRun
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                            : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                        }`}
                      >
                        {canRun ? 'SYNTHESIZING' : 'WAITING FOR INPUTS'}
                      </span>
                    </div>
                  </div>

                  {/* Active Recipe Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-400 font-mono">Assigned Recipe:</label>
                    <select
                      id={`select-recipe-${chamber.id}`}
                      value={chamber.activeRecipeId || ''}
                      onChange={(e) => {
                        onSetChamberRecipe(chamber.id, e.target.value);
                        soundEngine.playBuildClink();
                      }}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 font-mono"
                    >
                      <option value="">-- Standby / No Recipe --</option>
                      {gameState.recipes.map((rec) => {
                        const isUnlocked =
                          rec.unlockedByDefault ||
                          gameState.signalKeys.find((k) => k.id === rec.requiredKeyId)?.unlocked;
                        return (
                          <option key={rec.id} value={rec.id} disabled={!isUnlocked}>
                            {rec.name} (Tier {rec.tier}) {!isUnlocked ? '[LOCKED - Decipher Key]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Active Recipe Details & Inputs Flow */}
                  {activeRecipe && (
                    <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 flex flex-col gap-2">
                      <p className="text-[11px] text-slate-300 leading-tight">
                        {activeRecipe.description}
                      </p>

                      {/* Required Ingredients */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {activeRecipe.dustCost && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              gameState.dust >= activeRecipe.dustCost
                                ? 'bg-slate-800 border-slate-700 text-slate-300'
                                : 'bg-red-950/60 border-red-500/40 text-red-400'
                            }`}
                          >
                            Dust: {Math.floor(gameState.dust)} / {activeRecipe.dustCost}
                          </span>
                        )}

                        {inputStatus?.map((inp) => (
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

                      {/* Live Progress Bar */}
                      <div className="mt-2 flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-400">Cycle Progress:</span>
                          <span className="text-purple-300 font-semibold">
                            {progress.toFixed(0)}% ({activeRecipe.durationSeconds}s)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-purple-500 transition-all duration-200 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Synthesis Recipe Catalog */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Synthesis Recipe Blueprint Library</h3>
          <span className="text-xs text-slate-400 font-mono">
            {gameState.recipes.filter((r) => r.unlockedByDefault || gameState.signalKeys.find((k) => k.id === r.requiredKeyId)?.unlocked).length} / {gameState.recipes.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gameState.recipes.map((rec) => {
            const isUnlocked =
              rec.unlockedByDefault ||
              gameState.signalKeys.find((k) => k.id === rec.requiredKeyId)?.unlocked;
            const keyReq = gameState.signalKeys.find((k) => k.id === rec.requiredKeyId);

            return (
              <div
                key={rec.id}
                id={`recipe-card-${rec.id}`}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                  isUnlocked
                    ? 'bg-slate-900/80 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-200">{rec.name}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-purple-400 border border-slate-700">
                      Tier {rec.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{rec.description}</p>
                </div>

                {isUnlocked ? (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Yield:</span>
                    <span className="text-purple-300 font-semibold">
                      +{rec.outputProduct.amount} {rec.outputProduct.name}
                    </span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <Lock className="w-3 h-3" />
                    <span>Requires: {keyReq?.name || 'Decoded Signal Key'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
