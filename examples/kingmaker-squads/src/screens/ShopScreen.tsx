import React from 'react';
import { UnitState } from '../types';
import { ARCHETYPES } from '../data/archetypes';
import { UnitCard } from '../components/UnitCard';
import { RefreshCw, ArrowUpCircle, Plus, Shield } from 'lucide-react';

interface ShopScreenProps {
  gold: number;
  shopLevel: number;
  shopUpgradeCost: number;
  rerollCost: number;
  maxSquadSize: number;
  shopPool: UnitState[];
  onBuyUnit: (unit: UnitState) => void;
  onRerollShop: () => void;
  onUpgradeShop: () => void;
}

export function ShopScreen({
  gold,
  shopLevel,
  shopUpgradeCost,
  rerollCost,
  maxSquadSize,
  shopPool,
  onBuyUnit,
  onRerollShop,
  onUpgradeShop,
}: ShopScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: Capacity Upgrade & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* War Command Upgrade */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-serif flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" /> Rebellion Command Level {shopLevel}
              </h2>
              <span className="text-xs font-mono font-bold text-amber-300">
                Max Squad Size: {maxSquadSize}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-2">
              Upgrade your Rebellion Command level to increase max squad capacity across forces.
            </p>
          </div>

          <button
            onClick={onUpgradeShop}
            disabled={gold < shopUpgradeCost || maxSquadSize >= 6}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-zinc-950 font-bold text-xs uppercase tracking-wider transition shadow-md"
          >
            <ArrowUpCircle className="w-4 h-4" />
            {maxSquadSize >= 6 ? 'Max Squad Level' : `Expand Capacity (${shopUpgradeCost}g)`}
          </button>
        </div>

        {/* Shop Overview */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif mb-1">
              Recruitment Directives
            </h2>
            <p className="text-xs text-zinc-400">
              Recruit fresh archetypes from the pool below. Purchased units go to your active squad or reserve bench.
            </p>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400 font-mono">
            <span>Treasury: <strong className="text-amber-300">{gold} Gold</strong></span>
            <span>Reroll Cost: <strong className="text-amber-300">{rerollCost} Gold</strong></span>
          </div>
        </div>
      </div>

      {/* RECRUITMENT POOL SECTION */}
      <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-serif">
              Recruitment Pool
            </h2>
            <span className="text-xs text-zinc-500 font-mono">(Level {shopLevel})</span>
          </div>

          <button
            onClick={onRerollShop}
            disabled={gold < rerollCost}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-medium text-amber-200 border border-zinc-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reroll Pool ({rerollCost}g)
          </button>
        </div>

        {/* Shop Unit Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {shopPool.map((unit) => {
            const info = ARCHETYPES[unit.archetype];
            const canAfford = gold >= unit.cost;

            return (
              <UnitCard
                key={unit.id}
                unit={unit}
                headerExtra={
                  <span className="text-xs font-bold text-amber-400 font-mono bg-amber-950/60 border border-amber-600/30 px-1.5 py-0.5 rounded leading-none">
                    {unit.cost}g
                  </span>
                }
              >
                <div>
                  {/* Tag/Role */}
                  <div className="text-[10px] text-zinc-400 font-mono text-center my-1">
                    {info.tag}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-1 bg-zinc-900/60 p-1.5 rounded-lg text-[10px] font-mono mb-2 text-zinc-300">
                    <div>HP: <span className="text-emerald-400 font-bold">{unit.stats.hp}</span></div>
                    <div>ATK: <span className="text-rose-400 font-bold">{unit.stats.atk}</span></div>
                    <div>DEF: <span className="text-blue-400 font-bold">{unit.stats.def}</span></div>
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-tight mb-3">
                    {info.description}
                  </p>
                </div>

                <button
                  onClick={() => onBuyUnit(unit)}
                  disabled={!canAfford}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Recruit ({unit.cost}g)
                </button>
              </UnitCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
