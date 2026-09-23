import React, { useState } from 'react';
import { 
  GameState, 
  RawPartId, 
  WeaponId, 
  GridTile 
} from '../types';
import { RAW_PARTS, WEAPON_RECIPES, BUILDING_DEFS } from '../engine/recipes';
import { 
  Store, 
  ShoppingBag, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Plus, 
  Zap, 
  Lock, 
  Check, 
  MousePointer, 
  RotateCw, 
  Power, 
  Cpu, 
  FlaskConical, 
  ArrowUpCircle 
} from 'lucide-react';

interface StorefrontPanelProps {
  state: GameState;
  selectedTile: { x: number; y: number } | null;
  onBuyPart: (partId: RawPartId, qty: number) => void;
  onBuyUpgrade: (upgradeId: string) => void;
  onToggleTilePower: (x: number, y: number) => void;
  onRotateTile: (x: number, y: number) => void;
  onUpgradeTier: (x: number, y: number) => void;
  onSetSpawnerPart: (x: number, y: number, part: RawPartId) => void;
  onToggleSpawnerAutoBuy: (x: number, y: number) => void;
  onSetFitterTarget: (x: number, y: number, recipe: WeaponId) => void;
  onSetFilterPart: (x: number, y: number, part: RawPartId) => void;
}

export const StorefrontPanel: React.FC<StorefrontPanelProps> = ({
  state,
  selectedTile,
  onBuyPart,
  onBuyUpgrade,
  onToggleTilePower,
  onRotateTile,
  onUpgradeTier,
  onSetSpawnerPart,
  onToggleSpawnerAutoBuy,
  onSetFitterTarget,
  onSetFilterPart,
}) => {
  const [activeTab, setActiveTab] = useState<'inspect' | 'store' | 'supplies' | 'tech' | 'logs'>('inspect');
  const [batchQty, setBatchQty] = useState<1 | 5 | 20>(5);

  const selectedGridTile: GridTile | undefined = selectedTile 
    ? state.grid[selectedTile.y]?.[selectedTile.x] 
    : undefined;

  const isScattershotUnlocked = state.upgrades.some(u => u.id === 'tech_scattershot' && u.purchased);
  const isRifleUnlocked = state.upgrades.some(u => u.id === 'tech_rifle_license' && u.purchased);
  const isSpecOpsUnlocked = state.upgrades.some(u => u.id === 'tech_specops' && u.purchased);
  const isPrecisionUnlocked = state.upgrades.some(u => u.id === 'tech_precision' && u.purchased);

  const weaponList: WeaponId[] = ['pistol'];
  if (isScattershotUnlocked) weaponList.push('shotgun');
  if (isRifleUnlocked) weaponList.push('rifle');
  if (isSpecOpsUnlocked) weaponList.push('smg');
  if (isPrecisionUnlocked) weaponList.push('dmr');

  const availableParts: RawPartId[] = ['chassis', 'magazine'];
  if (isScattershotUnlocked) availableParts.push('barrel');
  if (isSpecOpsUnlocked) availableParts.push('stock');
  if (isPrecisionUnlocked) availableParts.push('optic');

  return (
    <aside className="w-full lg:w-80 xl:w-88 flex-shrink-0 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full overflow-hidden select-none z-10 shadow-xl">
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/80 p-1 gap-1">
        <button
          onClick={() => setActiveTab('inspect')}
          className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'inspect'
              ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MousePointer size={13} />
          <span>Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'store'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store size={13} />
          <span>Shop</span>
          {state.activeCustomers.length > 0 && (
            <span className="bg-cyan-500/20 text-cyan-300 font-mono text-[9px] px-1 py-0.2 rounded-full font-bold">
              {state.activeCustomers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('supplies')}
          className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'supplies'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={13} />
          <span>Hoppers</span>
        </button>

        <button
          onClick={() => setActiveTab('tech')}
          className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'tech'
              ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FlaskConical size={13} />
          <span>R&D</span>
          {state.upgrades.filter(u => !u.purchased && state.funds >= u.cost && state.researchPoints >= u.rpCost).length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-2 py-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Activity Logs"
        >
          <Clock size={13} />
        </button>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 0: TILE INSPECTOR (Factory Idle Deep Diagnostics) */}
        {activeTab === 'inspect' && (
          <div className="space-y-3">
            {selectedGridTile && selectedGridTile.type !== 'empty' ? (
              <div className="bg-slate-950/90 rounded-lg border border-slate-800 p-3 shadow-md space-y-3">
                {/* Header info */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Grid Coordinate [{selectedGridTile.x}, {selectedGridTile.y}]
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{BUILDING_DEFS[selectedGridTile.type]?.name || selectedGridTile.type.toUpperCase()}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 font-bold">
                        Mk{selectedGridTile.tier || 1}
                      </span>
                    </h3>
                  </div>

                  {/* Status LED Badge */}
                  <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                    selectedGridTile.isEnabled !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedGridTile.isEnabled !== false ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {selectedGridTile.isEnabled !== false ? 'ONLINE' : 'PAUSED'}
                  </div>
                </div>

                {/* Primary Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onToggleTilePower(selectedGridTile.x, selectedGridTile.y)}
                    className={`py-1.5 px-2 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      selectedGridTile.isEnabled !== false
                        ? 'bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    <Power size={13} />
                    <span>{selectedGridTile.isEnabled !== false ? 'Shut Off' : 'Power On'}</span>
                  </button>

                  <button
                    onClick={() => onRotateTile(selectedGridTile.x, selectedGridTile.y)}
                    className="py-1.5 px-2 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCw size={13} className="text-amber-400" />
                    <span>Rotate ({selectedGridTile.direction})</span>
                  </button>
                </div>

                {/* Tier Upgrade Button */}
                {(selectedGridTile.tier || 1) < 3 && (
                  <button
                    onClick={() => onUpgradeTier(selectedGridTile.x, selectedGridTile.y)}
                    className="w-full py-1.5 px-2 rounded-md bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/80 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ArrowUpCircle size={14} className="text-amber-400" />
                    <span>Upgrade to Mk{(selectedGridTile.tier || 1) + 1} (${(selectedGridTile.tier || 1) === 1 ? '60' : '150'})</span>
                  </button>
                )}

                {/* Machine Specific Configuration */}
                {selectedGridTile.type === 'spawner' && (
                  <div className="bg-slate-900/90 rounded-md p-2 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">Dispense Part:</span>
                      <button
                        onClick={() => onToggleSpawnerAutoBuy(selectedGridTile.x, selectedGridTile.y)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition-all ${
                          selectedGridTile.spawnerAutoBuy
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        Auto-Buy: {selectedGridTile.spawnerAutoBuy ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {availableParts.map((pId) => (
                        <button
                          key={pId}
                          onClick={() => onSetSpawnerPart(selectedGridTile.x, selectedGridTile.y, pId)}
                          className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                            selectedGridTile.spawnerPart === pId
                              ? 'bg-emerald-600 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {RAW_PARTS[pId].shortName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGridTile.type === 'fitter' && (
                  <div className="bg-slate-900/90 rounded-md p-2 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300">Target Firearm Recipe:</div>
                    <div className="grid grid-cols-2 gap-1">
                      {weaponList.map((wId) => {
                        const rec = WEAPON_RECIPES[wId];
                        return (
                          <button
                            key={wId}
                            onClick={() => onSetFitterTarget(selectedGridTile.x, selectedGridTile.y, wId)}
                            className={`py-1 px-1.5 rounded text-[10px] font-bold text-left transition-all truncate ${
                              selectedGridTile.fitterTargetRecipe === wId
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {rec.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Buffer Contents */}
                    <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                      Buffer ({selectedGridTile.fitterBuffer?.length || 0}):{' '}
                      {selectedGridTile.fitterBuffer && selectedGridTile.fitterBuffer.length > 0
                        ? selectedGridTile.fitterBuffer.map(p => RAW_PARTS[p].shortName).join(', ')
                        : 'Empty'}
                    </div>
                  </div>
                )}

                {selectedGridTile.type === 'filter' && (
                  <div className="bg-slate-900/90 rounded-md p-2 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-300">Pass-Through Part:</div>
                    <div className="grid grid-cols-3 gap-1">
                      {availableParts.map((pId) => (
                        <button
                          key={pId}
                          onClick={() => onSetFilterPart(selectedGridTile.x, selectedGridTile.y, pId)}
                          className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                            selectedGridTile.filterPart === pId
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {RAW_PARTS[pId].shortName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Telemetry Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800 font-mono">
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-[9px] text-slate-500">POWER USAGE</div>
                    <div className="font-bold text-amber-400">
                      {BUILDING_DEFS[selectedGridTile.type]?.powerUsage * (selectedGridTile.tier || 1)} kW
                    </div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-[9px] text-slate-500">THROUGHPUT</div>
                    <div className="font-bold text-slate-200">
                      {selectedGridTile.totalPassed || selectedGridTile.totalAssembled || selectedGridTile.totalSold || 0} items
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-6 text-center text-slate-500 space-y-2">
                <MousePointer size={24} className="mx-auto text-slate-600 animate-bounce" />
                <div className="text-xs font-semibold text-slate-400">No Tile Selected</div>
                <div className="text-[10px] leading-relaxed">
                  Click any conveyor, machine, generator, or lab on the grid to inspect buffers, adjust power, or upgrade tiers.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: STOREFRONT & CUSTOMER QUEUE */}
        {activeTab === 'store' && (
          <>
            {/* Shelf Holding Racks */}
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5 shadow-sm">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-cyan-400" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                    Storefront Shelf
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Cap: <strong className="text-slate-200">{state.shelfCapacity}</strong>/wep
                </span>
              </div>

              <div className="space-y-2">
                {weaponList.map((wId) => {
                  const recipe = WEAPON_RECIPES[wId];
                  const inStock = state.shelfStock[wId] || 0;
                  const cap = state.shelfCapacity;

                  return (
                    <div
                      key={wId}
                      className="bg-slate-900/90 border border-slate-800/90 rounded-md p-2 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: recipe.color }}
                          />
                          <span className="text-xs font-bold text-slate-100">
                            {recipe.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-200">
                            {inStock}/{cap}
                          </span>
                          {inStock > 0 ? (
                            <span className="px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 text-[9px] font-semibold rounded">
                              Ready
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 bg-rose-950/80 border border-rose-700/80 text-rose-400 text-[9px] font-semibold rounded animate-pulse">
                              Empty
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Discrete Block Status Bar */}
                      <div className="flex items-center gap-1 w-full">
                        {Array.from({ length: cap }).map((_, idx) => {
                          const isFilled = idx < inStock;
                          return (
                            <div
                              key={idx}
                              className={`h-2 flex-1 rounded-sm transition-all duration-200 ${
                                isFilled
                                  ? 'shadow-xs'
                                  : 'bg-slate-800/80 border border-slate-700/40'
                              }`}
                              style={{
                                backgroundColor: isFilled ? recipe.color : undefined,
                              }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Sell: <strong className="text-emerald-400">${recipe.salePrice}</strong></span>
                        <span>Margin: <strong className="text-cyan-400">+${recipe.margin}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Customer Queue */}
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5 shadow-sm">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                    Client Orders
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {state.activeCustomers.length} Waiting
                </span>
              </div>

              {state.activeCustomers.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-[11px] italic">
                  Counter clear. Next customer approaching...
                </div>
              ) : (
                <div className="space-y-2">
                  {state.activeCustomers.map((cust) => {
                    const recipe = WEAPON_RECIPES[cust.weaponId];
                    const patiencePct = (cust.remainingPatienceTicks / cust.maxPatienceTicks) * 100;
                    const isUrgent = patiencePct < 35;
                    const canFulfill = state.shelfStock[cust.weaponId] >= cust.quantity;

                    return (
                      <div
                        key={cust.id}
                        className={`bg-slate-900/90 border rounded-md p-2 transition-all ${
                          canFulfill
                            ? 'border-emerald-700/70 bg-emerald-950/15'
                            : isUrgent
                            ? 'border-rose-700/70 bg-rose-950/15'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-100 truncate">
                              {cust.customerName}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate leading-tight">
                              {cust.customerRole}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 font-mono">
                            <span className="text-xs font-bold text-emerald-400">
                              +${recipe.salePrice * cust.quantity}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] mt-1.5 pt-1 border-t border-slate-800/60">
                          <span className="text-slate-300">
                            Wants: <strong className="text-cyan-300">{cust.quantity}x {recipe.name}</strong>
                          </span>
                          {canFulfill ? (
                            <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Auto-Fulfill
                            </span>
                          ) : (
                            <span className="text-[9px] text-rose-400 font-semibold flex items-center gap-0.5">
                              <AlertTriangle size={10} /> In Production
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: RAW STOCK HOPPERS */}
        {activeTab === 'supplies' && (
          <div className="space-y-2.5">
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Parts Hoppers
                </h3>
                {/* Batch Quantity Selector */}
                <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-800">
                  {([1, 5, 20] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setBatchQty(q)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        batchQty === q ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      x{q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {availableParts.map((pId) => {
                  const part = RAW_PARTS[pId];
                  const inStock = state.hopperStock[pId] || 0;
                  const totalCost = part.cost * batchQty;
                  const canAfford = state.funds >= totalCost;

                  return (
                    <div
                      key={pId}
                      className="bg-slate-900/90 border border-slate-800 rounded-md p-2 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded flex-shrink-0 flex items-center justify-center font-mono font-bold text-[10px]"
                          style={{ backgroundColor: `${part.color}25`, color: part.color, border: `1px solid ${part.color}60` }}
                        >
                          {part.shortName}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 truncate">{part.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            Stock: <strong className={inStock <= 2 ? 'text-rose-400' : 'text-slate-200'}>{inStock}</strong> (${part.cost}/ea)
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onBuyPart(pId, batchQty)}
                        disabled={!canAfford}
                        className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all flex-shrink-0 ${
                          canAfford
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-sm font-mono font-bold'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed font-mono'
                        }`}
                      >
                        <Plus size={11} />
                        <span>+{batchQty}</span>
                        <span className="text-[9px] opacity-80 font-normal">(${totalCost})</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TECH & R&D MATRIX */}
        {activeTab === 'tech' && (
          <div className="space-y-2.5">
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
              <div className="mb-2 pb-1.5 border-b border-slate-800/80 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                  <FlaskConical size={13} />
                  Research Matrix
                </h3>
                <span className="text-[10px] font-mono text-blue-300 font-bold">
                  {Math.floor(state.researchPoints)} RP Available
                </span>
              </div>

              <div className="space-y-2">
                {state.upgrades.map((upg) => {
                  const canAfford = state.funds >= upg.cost && state.researchPoints >= upg.rpCost;
                  const isLocked = upg.prerequisiteId && !state.upgrades.find(u => u.id === upg.prerequisiteId)?.purchased;

                  return (
                    <div
                      key={upg.id}
                      className={`border rounded-md p-2 transition-all ${
                        upg.purchased
                          ? 'bg-blue-950/20 border-blue-800/60'
                          : isLocked
                          ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-blue-300 font-bold">
                            T{upg.tier}
                          </span>
                          <h4 className="text-xs font-bold text-slate-100">{upg.name}</h4>
                        </div>

                        {upg.purchased ? (
                          <span className="text-[9px] font-semibold text-blue-400 flex items-center gap-0.5">
                            <Check size={11} /> Unlocked
                          </span>
                        ) : isLocked ? (
                          <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                            <Lock size={10} /> Locked
                          </span>
                        ) : (
                          <button
                            onClick={() => onBuyUpgrade(upg.id)}
                            disabled={!canAfford}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                              canAfford
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Unlock (${upg.cost}{upg.rpCost > 0 ? ` + ${upg.rpCost}RP` : ''})
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 leading-tight">
                        {upg.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REAL-TIME ACTIVITY LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-200 mb-2 pb-1.5 border-b border-slate-800/80">
              Operations Log
            </h3>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto font-mono text-[10px]">
              {state.recentLogs.map((log) => {
                const color = 
                  log.type === 'sale' ? 'text-emerald-400' :
                  log.type === 'craft' ? 'text-cyan-300' :
                  log.type === 'research' ? 'text-blue-400' :
                  log.type === 'miss' ? 'text-rose-400' : 'text-slate-400';

                return (
                  <div key={log.id} className="leading-tight flex items-start gap-1">
                    <span className="text-slate-600 font-bold flex-shrink-0">T{log.tick}:</span>
                    <span className={color}>{log.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
