import React, { useState } from 'react';
import { DefenseForce, TerritoryCell, UnitState } from '../types';
import { ShopScreen } from './ShopScreen';
import { ForcesScreen } from './ForcesScreen';
import { ShoppingBag, Swords, ArrowRight } from 'lucide-react';

interface ShopPhaseLayoutProps {
  gold: number;
  shopLevel: number;
  shopUpgradeCost: number;
  rerollCost: number;
  maxSquadSize: number;
  units: UnitState[];
  shopPool: UnitState[];
  kingUnitId: string | null;
  defenseForces?: DefenseForce[];
  squadOutflowThisTurn?: Record<string, number>;
  cells?: TerritoryCell[];
  onBuyUnit: (unit: UnitState) => void;
  onSellUnit: (unitId: string) => void;
  onRerollShop: () => void;
  onUpgradeShop: () => void;
  onToggleSquadSlot: (unitId: string) => void;
  onToggleEscort: (unitId: string) => void;
  onTransferUnit?: (unitId: string, targetSquadId: string | null) => boolean;
  onAssignSteward?: (unitId: string, dfId: string) => void;
  onRecallSteward?: (dfId: string) => void;
  onProceedToMap: () => void;
}

export function ShopPhaseLayout({
  gold,
  shopLevel,
  shopUpgradeCost,
  rerollCost,
  maxSquadSize,
  units,
  shopPool,
  kingUnitId,
  defenseForces = [],
  squadOutflowThisTurn = {},
  cells = [],
  onBuyUnit,
  onSellUnit,
  onRerollShop,
  onUpgradeShop,
  onToggleSquadSlot,
  onToggleEscort,
  onTransferUnit,
  onAssignSteward,
  onRecallSteward,
  onProceedToMap,
}: ShopPhaseLayoutProps) {
  const [activeTab, setActiveTab] = useState<'shop' | 'forces'>('shop');

  const forwardUnits = units.filter(
    (u) => u.squadId === 'forward' || (u.squadSlot !== null && u.squadSlot !== undefined && (!u.squadId || u.squadId === 'forward'))
  );

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto pb-24">
      {/* Tab Bar & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3 shadow-lg">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-serif text-xs font-bold transition ${
              activeTab === 'shop'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Recruitment Shop</span>
          </button>

          <button
            onClick={() => setActiveTab('forces')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-serif text-xs font-bold transition ${
              activeTab === 'forces'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Forces & Squads</span>
          </button>
        </div>

        {/* Proceed Button */}
        <button
          onClick={onProceedToMap}
          disabled={forwardUnits.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-40 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-950/50"
        >
          <span>Proceed to Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'shop' && (
        <ShopScreen
          gold={gold}
          shopLevel={shopLevel}
          shopUpgradeCost={shopUpgradeCost}
          rerollCost={rerollCost}
          maxSquadSize={maxSquadSize}
          shopPool={shopPool}
          onBuyUnit={onBuyUnit}
          onRerollShop={onRerollShop}
          onUpgradeShop={onUpgradeShop}
        />
      )}

      {activeTab === 'forces' && (
        <ForcesScreen
          units={units}
          defenseForces={defenseForces}
          maxSquadSize={maxSquadSize}
          kingUnitId={kingUnitId}
          squadOutflowThisTurn={squadOutflowThisTurn}
          cells={cells}
          onToggleSquadSlot={onToggleSquadSlot}
          onToggleEscort={onToggleEscort}
          onSellUnit={onSellUnit}
          onTransferUnit={onTransferUnit}
          onAssignSteward={onAssignSteward}
          onRecallSteward={onRecallSteward}
        />
      )}
    </div>
  );
}
