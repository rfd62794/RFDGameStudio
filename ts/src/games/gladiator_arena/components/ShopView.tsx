/**
 * Gladiator Arena — The Forge & Limb Market View
 * Includes real-time Cyber-Organic compatibility previews and compounding Frame purchasing.
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BodyPart } from '../types';
import { previewEquipCompatibility, getNextFrameCost } from '../simulation/forgeEconomy';
import {
  ShoppingBag,
  Coins,
  RotateCw,
  Zap,
  Dna,
  Cpu,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Plus,
  Check,
  Layers
} from 'lucide-react';

export const ShopView: React.FC = () => {
  const {
    gold,
    roster,
    shopInventory,
    buyPart,
    buyNewFrame,
    refreshShop,
    selectedGladiatorId,
    setSelectedGladiatorId,
  } = useGame();

  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(shopInventory[0] || null);
  const [filterSlot, setFilterSlot] = useState<string>('all');
  const [filterOrigin, setFilterOrigin] = useState<string>('all');

  const activeGladiator = roster.find(g => g.id === selectedGladiatorId) || roster[0];
  const nextFrameCost = getNextFrameCost(roster.length);
  const canAffordFrame = gold >= nextFrameCost;

  // Compatibility preview if a part and gladiator are selected
  const compatPreview = selectedPart && activeGladiator
    ? previewEquipCompatibility(activeGladiator, selectedPart)
    : null;

  const currentEquippedPart = selectedPart && activeGladiator
    ? activeGladiator.parts[selectedPart.slot]
    : null;

  const filteredParts = shopInventory.filter(part => {
    if (filterSlot !== 'all' && part.slot !== filterSlot) return false;
    if (filterOrigin !== 'all' && part.origin !== filterOrigin) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
      {/* Header Banner & Frame Purchase Station */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-stone-100 uppercase tracking-wide">The Cyber-Organic Forge</h2>
          </div>
          <p className="text-xs text-stone-400 max-w-xl">
            Acquire precision prosthetics, biological predatory grafts, and reinforced chassis limbs.
            Always confirm <strong>Cyber-Organic Compatibility</strong> before bolting parts onto your Frame.
          </p>
        </div>

        {/* Compounding Frame Procurement Terminal */}
        <div className="bg-stone-950/80 border border-amber-600/40 rounded-xl p-3.5 flex items-center gap-4 shadow-inner w-full md:w-auto">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Chassis Procurement</span>
            <div className="text-xs font-bold text-stone-100 flex items-center gap-1.5 mt-0.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Frame #{roster.length + 1} Chassis</span>
            </div>
            <span className="text-[10px] text-stone-400 block font-mono mt-0.5">
              Cost: <strong className="text-amber-300">{nextFrameCost} Gold</strong> (Compounding Curve)
            </span>
          </div>

          <button
            id="buy-new-frame-btn"
            onClick={() => buyNewFrame()}
            disabled={!canAffordFrame}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
              canAffordFrame
                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md cursor-pointer'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Forge Frame
          </button>
        </div>
      </div>

      {/* Target Frame Switcher */}
      <div className="flex items-center justify-between gap-3 bg-stone-900 border border-stone-800 p-3 rounded-xl flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-300 uppercase">Target Frame for Compatibility:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {roster.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGladiatorId(g.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  g.id === activeGladiator.id
                    ? 'bg-amber-600 text-stone-950'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {g.frameId}: {g.name}
              </button>
            ))}
          </div>
        </div>

        <button
          id="refresh-shop-btn"
          onClick={refreshShop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs font-medium transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Restock Market
        </button>
      </div>

      {/* Main Market Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Available Parts Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={filterSlot}
              onChange={e => setFilterSlot(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none"
            >
              <option value="all">All Body Slots</option>
              <option value="head">Head</option>
              <option value="torso">Torso</option>
              <option value="left_arm">Left Arm</option>
              <option value="right_arm">Right Arm</option>
              <option value="left_leg">Left Leg</option>
              <option value="right_leg">Right Leg</option>
            </select>

            <select
              value={filterOrigin}
              onChange={e => setFilterOrigin(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none"
            >
              <option value="all">All Origins</option>
              <option value="organic">Organic Only (Bio Sinew / Chitin)</option>
              <option value="hybrid">Hybrid Only</option>
              <option value="cybernetic">Cybernetic Only (Titanium / Hydro)</option>
            </select>

            <span className="text-stone-500 ml-auto">({filteredParts.length} parts in stock)</span>
          </div>

          {/* Parts List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredParts.map(part => {
              const isSelected = selectedPart?.id === part.id;

              const isCyber = part.cyberOrganicLean > 0.3;
              const isBio = part.cyberOrganicLean < -0.3;

              return (
                <div
                  key={part.id}
                  onClick={() => setSelectedPart(part)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-400'
                      : 'bg-stone-900/90 border-stone-800 hover:border-stone-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                        {isCyber ? <Zap className="w-3 h-3 text-cyan-400" /> : isBio ? <Dna className="w-3 h-3 text-emerald-400" /> : <Cpu className="w-3 h-3 text-amber-400" />}
                        {part.slot.replace('_', ' ')}
                      </span>
                      <span className="font-mono font-bold text-amber-300 text-xs flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-400" /> {part.cost}g
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-stone-100 leading-snug">{part.name}</h4>
                    <p className="text-xs text-stone-400 line-clamp-2 mt-1">{part.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800/80 font-mono text-stone-300">
                    <span>HP: {part.maxHp}</span>
                    <span>Pwr: +{part.power}</span>
                    <span>Spd: +{part.speed}</span>
                    <span
                      className={`font-semibold ${
                        part.cyberOrganicLean > 0
                          ? 'text-cyan-400'
                          : part.cyberOrganicLean < 0
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {part.cyberOrganicLean > 0 ? `+${part.cyberOrganicLean}` : part.cyberOrganicLean}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Compatibility Assessment & Purchase Decision (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {selectedPart ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col gap-4 sticky top-20 shadow-xl">
              <div className="border-b border-stone-800 pb-3">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Diagnostic Compatibility Inspector
                </span>
                <h3 className="text-lg font-bold text-stone-100">{selectedPart.name}</h3>
                <div className="flex items-center gap-3 text-xs text-stone-400 font-mono mt-1">
                  <span>Slot: <strong className="text-stone-200">{selectedPart.slot.replace('_', ' ').toUpperCase()}</strong></span>
                  <span>Cost: <strong className="text-amber-300">{selectedPart.cost} Gold</strong></span>
                </div>
              </div>

              {/* Side-by-Side Current vs Candidate Comparison */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-950 p-3 rounded-xl border border-stone-800">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">Currently Installed</span>
                  <div className="font-bold text-stone-200 truncate mt-0.5">{currentEquippedPart?.name || 'Empty'}</div>
                  <div className="text-[11px] font-mono text-stone-400 mt-1">
                    HP: {currentEquippedPart?.maxHp} | Pwr: +{currentEquippedPart?.power} | Spd: +{currentEquippedPart?.speed}
                  </div>
                </div>

                <div className="border-l border-stone-800 pl-3">
                  <span className="text-[10px] text-amber-400 uppercase block">Candidate Upgrade</span>
                  <div className="font-bold text-stone-100 truncate mt-0.5">{selectedPart.name}</div>
                  <div className="text-[11px] font-mono text-amber-300 mt-1">
                    HP: {selectedPart.maxHp} | Pwr: +{selectedPart.power} | Spd: +{selectedPart.speed}
                  </div>
                </div>
              </div>

              {/* Compatibility Shift Analysis */}
              {compatPreview && (
                <div className="flex flex-col gap-2.5 bg-stone-950/80 p-3.5 rounded-xl border border-stone-800">
                  <span className="text-xs font-bold uppercase text-stone-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Projected Neural Shift ({activeGladiator.name})
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                      <span className="text-[10px] text-stone-400 block">Average Lean Shift</span>
                      <span className="font-mono font-bold text-stone-200 flex items-center gap-1">
                        {compatPreview.currentReport.averageLean.toFixed(2)}
                        <ArrowRight className="w-3 h-3 text-amber-400" />
                        {compatPreview.newReport.averageLean.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                      <span className="text-[10px] text-stone-400 block">Malfunction Risk Shift</span>
                      <span
                        className={`font-mono font-bold flex items-center gap-1 ${
                          compatPreview.newReport.malfunctionRiskPercent > compatPreview.currentReport.malfunctionRiskPercent
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {compatPreview.currentReport.malfunctionRiskPercent}%
                        <ArrowRight className="w-3 h-3 text-stone-500" />
                        {compatPreview.newReport.malfunctionRiskPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Warning if mismatch causes critical dissonance */}
                  {compatPreview.newReport.compatibilityTier === 'critical_rejection' && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-950/60 border border-red-600/40 text-red-300 text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>
                        <strong>DANGER: Critical Bio-Rejection!</strong> This part severely clashes with your Frame's biological/cybernetic balance.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Purchase Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-stone-800">
                <button
                  id="buy-and-equip-btn"
                  onClick={() => buyPart(selectedPart, activeGladiator.id)}
                  disabled={gold < selectedPart.cost}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    gold >= selectedPart.cost
                      ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-lg cursor-pointer'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Buy & Equip directly to {activeGladiator.name} ({selectedPart.cost}g)
                </button>

                <button
                  id="buy-to-inventory-btn"
                  onClick={() => buyPart(selectedPart)}
                  disabled={gold < selectedPart.cost}
                  className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs font-semibold transition disabled:opacity-40"
                >
                  Buy to Spare Inventory Storage ({selectedPart.cost}g)
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-stone-500 bg-stone-900 border border-stone-800 rounded-2xl">
              Select a part from the forge market to inspect compatibility.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
