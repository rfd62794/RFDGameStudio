import React from 'react';
import { WeaponId, RawPartId } from '../types';
import { WEAPON_RECIPES, RAW_PARTS } from '../engine/recipes';
import { X, BookOpen, Layers, CheckCircle2, ArrowRight, Zap } from 'lucide-react';

interface RecipeBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedUpgrades: string[];
}

export const RecipeBookModal: React.FC<RecipeBookModalProps> = ({
  isOpen,
  onClose,
  unlockedUpgrades,
}) => {
  if (!isOpen) return null;

  const weaponKeys = Object.keys(WEAPON_RECIPES) as WeaponId[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Firearms Blueprint & Schematic Codex
              </h2>
              <p className="text-xs text-slate-400">
                Formula compositions, component costs, and retail margins.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Base Components Glossary */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers size={14} className="text-emerald-400" />
              Standardized Modular Component Primitives
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(RAW_PARTS) as RawPartId[]).map((pId) => {
                const part = RAW_PARTS[pId];
                return (
                  <div
                    key={pId}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0"
                      style={{
                        backgroundColor: `${part.color}25`,
                        color: part.color,
                        border: `1px solid ${part.color}60`,
                      }}
                    >
                      {part.shortName}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{part.name}</div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {part.description}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono font-semibold mt-1">
                        Cost: ${part.cost}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weapon Schematics Matrix */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" />
              Firearm Assembly Formulations
            </h3>

            <div className="space-y-3">
              {weaponKeys.map((wId) => {
                const recipe = WEAPON_RECIPES[wId];
                const isUnlocked = !recipe.requiredTechId || unlockedUpgrades.includes(recipe.requiredTechId);

                return (
                  <div
                    key={wId}
                    className={`p-4 rounded-xl border transition-all ${
                      isUnlocked
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-950/30 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: recipe.color }}
                        />
                        <h4 className="text-sm font-bold text-slate-100">{recipe.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                          {recipe.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-400">
                          Cost: <strong className="text-slate-200">${recipe.baseCost}</strong>
                        </span>
                        <span className="text-emerald-400">
                          Sale: <strong>${recipe.salePrice}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                          +${recipe.margin} Profit
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Formula Chits */}
                    <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[11px] font-bold text-slate-400">Recipe:</span>
                      {Object.entries(recipe.requiredParts).map(([partId, count]) => {
                        if (count <= 0) return null;
                        const part = RAW_PARTS[partId as RawPartId];
                        return (
                          <span
                            key={partId}
                            className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1"
                            style={{
                              backgroundColor: `${part.color}20`,
                              color: part.color,
                              border: `1px solid ${part.color}50`,
                            }}
                          >
                            {count > 1 && `${count}x `}
                            {part.name}
                          </span>
                        );
                      })}
                      <ArrowRight size={14} className="text-slate-600" />
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-100 font-mono"
                        style={{ backgroundColor: `${recipe.color}30`, border: `1px solid ${recipe.color}` }}
                      >
                        {recipe.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Tips */}
          <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-xl p-4 text-xs text-cyan-200 space-y-1.5">
            <h4 className="font-bold flex items-center gap-1.5 text-cyan-300">
              <CheckCircle2 size={15} />
              Factory Automation Tips
            </h4>
            <p className="leading-relaxed text-slate-300">
              • <strong>Fitter Buffering:</strong> An Assembly Fitter collects incoming parts in its internal buffer until all parts for the highest-value available recipe arrive.
            </p>
            <p className="leading-relaxed text-slate-300">
              • <strong>Storefront Buffer:</strong> Packing Crates deliver finished firearms directly into the Storefront Shelf. AI Customer Agents automatically purchase available stock.
            </p>
            <p className="leading-relaxed text-slate-300">
              • <strong>Preventing Missed Sales:</strong> Maintain a steady conveyor flow of finished weapons so customer patience bars do not expire.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors"
          >
            Close Codex
          </button>
        </div>
      </div>
    </div>
  );
};
