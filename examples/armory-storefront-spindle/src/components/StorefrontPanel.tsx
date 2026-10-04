import React, { useState } from 'react';
import { 
  GameState, 
  RawPartId, 
  WeaponId 
} from '../types';
import { RAW_PARTS, WEAPON_RECIPES } from '../engine/recipes';
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
  Cpu, 
  Lock, 
  Check 
} from 'lucide-react';

interface StorefrontPanelProps {
  state: GameState;
  onBuyPart: (partId: RawPartId, qty: number) => void;
  onBuyUpgrade: (upgradeId: string) => void;
}

export const StorefrontPanel: React.FC<StorefrontPanelProps> = ({
  state,
  onBuyPart,
  onBuyUpgrade,
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'supplies' | 'tech' | 'logs'>('store');
  const [batchQty, setBatchQty] = useState<1 | 5 | 20>(5);

  const isSpecOpsUnlocked = state.upgrades.some(u => u.id === 'tech_specops' && u.purchased);
  const isPrecisionUnlocked = state.upgrades.some(u => u.id === 'tech_precision' && u.purchased);

  const weaponList: WeaponId[] = ['pistol', 'shotgun', 'rifle'];
  if (isSpecOpsUnlocked) weaponList.push('smg');
  if (isPrecisionUnlocked) weaponList.push('dmr');

  const availableParts: RawPartId[] = ['chassis', 'barrel', 'magazine'];
  if (isSpecOpsUnlocked) availableParts.push('stock');
  if (isPrecisionUnlocked) availableParts.push('optic');

  return (
    <div className="w-full lg:w-96 xl:w-[420px] flex-shrink-0 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full overflow-hidden select-none">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'store'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store size={15} />
          <span>Storefront</span>
          {state.activeCustomers.length > 0 && (
            <span className="bg-cyan-500/20 text-cyan-300 font-mono text-[10px] px-1.5 py-0.5 rounded-full">
              {state.activeCustomers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('supplies')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'supplies'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={15} />
          <span>Hoppers</span>
        </button>

        <button
          onClick={() => setActiveTab('tech')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'tech'
              ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap size={15} />
          <span>R&D Tech</span>
          {state.upgrades.filter(u => !u.purchased && state.funds >= u.cost).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock size={15} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: STOREFRONT & CUSTOMER QUEUE */}
        {activeTab === 'store' && (
          <>
            {/* Shelf Holding Racks */}
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5 shadow-md">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Storefront Shelf Rack
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Cap: <strong className="text-slate-200">{state.shelfCapacity}</strong>/wep
                </span>
              </div>

              <div className="space-y-2">
                {weaponList.map((wId) => {
                  const recipe = WEAPON_RECIPES[wId];
                  const inStock = state.shelfStock[wId] || 0;
                  const pct = Math.min(100, (inStock / state.shelfCapacity) * 100);

                  return (
                    <div
                      key={wId}
                      className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between"
                    >
                      <div className="flex-1 mr-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: recipe.color }}
                            />
                            {recipe.name}
                          </span>
                          <span className="font-mono text-slate-300 font-bold">
                            {inStock} / {state.shelfCapacity}
                          </span>
                        </div>

                        {/* Progress Stock Bar */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: inStock === 0 ? '#ef4444' : recipe.color,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>Sell: <strong className="text-emerald-400 font-mono">${recipe.salePrice}</strong></span>
                          <span>Margin: <strong className="text-cyan-400 font-mono">+${recipe.margin}</strong></span>
                        </div>
                      </div>

                      <div className="text-right">
                        {inStock > 0 ? (
                          <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[10px] font-semibold rounded-full">
                            Ready
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-950/60 border border-rose-800/80 text-rose-400 text-[10px] font-semibold rounded-full animate-pulse">
                            Empty!
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Automated AI Customer Queue */}
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5 shadow-md">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Client Walk-In Queue
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {state.activeCustomers.length} Waiting
                </span>
              </div>

              {state.activeCustomers.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  Counter clear. Next customer arriving shortly...
                </div>
              ) : (
                <div className="space-y-2.5">
                  {state.activeCustomers.map((cust) => {
                    const recipe = WEAPON_RECIPES[cust.weaponId];
                    const patiencePct = (cust.remainingPatienceTicks / cust.maxPatienceTicks) * 100;
                    const isUrgent = patiencePct < 35;
                    const canFulfill = state.shelfStock[cust.weaponId] >= cust.quantity;

                    return (
                      <div
                        key={cust.id}
                        className={`bg-slate-900/90 border rounded-lg p-3 transition-all ${
                          canFulfill
                            ? 'border-emerald-700/80 bg-emerald-950/20'
                            : isUrgent
                            ? 'border-rose-700/80 bg-rose-950/20'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950"
                              style={{ backgroundColor: cust.avatarBg }}
                            >
                              {cust.customerName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-200 leading-tight">
                                {cust.customerName}
                              </div>
                              <div className="text-[10px] text-slate-400 leading-tight">
                                {cust.customerRole}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              +${recipe.salePrice * cust.quantity}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs my-1 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                          <span className="text-slate-300">
                            Requested: <strong className="text-cyan-300">{cust.quantity}x {recipe.name}</strong>
                          </span>
                          {canFulfill ? (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Auto-Fulfilling
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                              <AlertTriangle size={12} /> Awaiting Factory
                            </span>
                          )}
                        </div>

                        {/* Patience Bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>Client Patience</span>
                            <span className="font-mono">{cust.remainingPatienceTicks}s</span>
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${patiencePct}%`,
                                backgroundColor: isUrgent ? '#ef4444' : patiencePct < 60 ? '#f59e0b' : '#10b981',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Performance KPI Card */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Fulfilled Sales</div>
                <div className="text-base font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  {state.metrics.fulfilledOrders}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Rev: ${state.metrics.totalRevenue}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Missed Orders</div>
                <div className="text-base font-mono font-bold text-rose-400 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {state.metrics.missedSalesCount}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Efficiency: {state.metrics.currentEfficiency}%
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: RAW STOCK HOPPERS */}
        {activeTab === 'supplies' && (
          <div className="space-y-3">
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Warehouse Parts Hoppers
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Buy raw stock to keep intake spawners flowing.
                  </p>
                </div>

                {/* Batch Quantity Selector */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {([1, 5, 20] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setBatchQty(q)}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                        batchQty === q ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      x{q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {availableParts.map((pId) => {
                  const part = RAW_PARTS[pId];
                  const inStock = state.hopperStock[pId] || 0;
                  const totalCost = part.cost * batchQty;
                  const canAfford = state.funds >= totalCost;

                  return (
                    <div
                      key={pId}
                      className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs"
                          style={{ backgroundColor: `${part.color}25`, color: part.color, border: `1px solid ${part.color}60` }}
                        >
                          {part.shortName}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">{part.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Unit Cost: <strong className="text-slate-300 font-mono">${part.cost}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-slate-200">
                            {inStock} in stock
                          </div>
                          {inStock <= 2 && (
                            <div className="text-[9px] text-rose-400 font-semibold animate-pulse">
                              Low Stock!
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => onBuyPart(pId, batchQty)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                            canAfford
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-sm font-mono'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Plus size={13} />
                          <span>Buy {batchQty}</span>
                          <span className="text-[10px] opacity-80">(${totalCost})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TECH R&D UPGRADES */}
        {activeTab === 'tech' && (
          <div className="space-y-3">
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5">
              <div className="mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Zap size={16} />
                  Technology Progression Tree
                </h3>
                <p className="text-[11px] text-slate-400">
                  Reinvest factory capital into machinery speeds, capacities, and weapon licenses.
                </p>
              </div>

              <div className="space-y-2.5">
                {state.upgrades.map((upg) => {
                  const canAfford = state.funds >= upg.cost;
                  const isLocked = upg.prerequisiteId && !state.upgrades.find(u => u.id === upg.prerequisiteId)?.purchased;

                  return (
                    <div
                      key={upg.id}
                      className={`border rounded-lg p-3 transition-all ${
                        upg.purchased
                          ? 'bg-purple-950/20 border-purple-800/60'
                          : isLocked
                          ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-bold">
                            T{upg.tier}
                          </span>
                          <h4 className="text-xs font-bold text-slate-100">{upg.name}</h4>
                        </div>

                        {upg.purchased ? (
                          <span className="text-[10px] font-semibold text-purple-400 flex items-center gap-1">
                            <Check size={13} /> Active
                          </span>
                        ) : isLocked ? (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Lock size={12} /> Prereq Needed
                          </span>
                        ) : (
                          <button
                            onClick={() => onBuyUpgrade(upg.id)}
                            disabled={!canAfford}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                              canAfford
                                ? 'bg-purple-600 hover:bg-purple-500 text-slate-950 shadow-md shadow-purple-950/50'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <DollarSign size={12} />
                            ${upg.cost}
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {upg.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE TELEMETRY LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Factory & Sales Telemetry
            </h3>

            {state.recentLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                No activity logged yet.
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-[11px]">
                {state.recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border flex items-start justify-between gap-2 ${
                      log.type === 'sale'
                        ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                        : log.type === 'craft'
                        ? 'bg-sky-950/30 border-sky-800/40 text-sky-300'
                        : log.type === 'miss'
                        ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{log.text}</span>
                    <span className="text-[9px] text-slate-500 flex-shrink-0">T+{log.tick}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
