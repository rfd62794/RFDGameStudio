/**
 * Gladiator Arena — Medbay & Trauma Surgery Clinic
 * Provides continuous wound patching, permanent scar regeneration, and emergency prosthetics.
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BodySlot, Gladiator } from '../types';
import { AnatomyPaperDoll } from './AnatomyPaperDoll';
import { calculateSurgeryCosts } from '../simulation/forgeEconomy';
import { getGladiatorAnatomySummary } from '../../../engine/shared/anatomy';
import { 
  HeartPulse, 
  Sparkles, 
  HeartCrack, 
  ShieldAlert, 
  Coins, 
  Bandage, 
  Activity, 
  CheckCircle2, 
  Stethoscope 
} from 'lucide-react';

export const MedbayView: React.FC = () => {
  const {
    gold,
    roster,
    patchWounds,
    removeScar,
    selectedGladiatorId,
    setSelectedGladiatorId,
  } = useGame();

  const [selectedSlot, setSelectedSlot] = useState<BodySlot>('torso');

  const activeGladiator = roster.find(g => g.id === selectedGladiatorId) || roster[0];
  const surgeryCosts = activeGladiator ? calculateSurgeryCosts(activeGladiator) : null;
  const anatomySummary = activeGladiator ? getGladiatorAnatomySummary(activeGladiator) : null;

  if (!activeGladiator || !surgeryCosts || !anatomySummary) {
    return <div className="p-8 text-center text-stone-400">No active Frame selected.</div>;
  }

  const selectedPart = activeGladiator.parts[selectedSlot];
  const selectedPartCost = surgeryCosts.perPartCost[selectedSlot];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-stone-100 uppercase tracking-wide">
              Chief Surgeon's Trauma Bay
            </h2>
          </div>
          <p className="text-xs text-stone-400 max-w-xl">
            RimWorld-derived persistent anatomical trauma. Flesh tears, cracked armor, and permanent scarring require
            expert bio-gel grafting and servo recalibration before the next match.
          </p>
        </div>

        {/* Total Roster Health Status */}
        <div className="flex items-center gap-2 bg-stone-950 px-4 py-2 rounded-xl border border-stone-800 text-xs font-mono">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Available Treasury: <strong className="text-amber-300 font-bold">{gold}g</strong></span>
        </div>
      </div>

      {/* Frame Selection Row */}
      <div className="flex items-center gap-2 flex-wrap border-b border-stone-800 pb-3">
        {roster.map(g => {
          const sum = getGladiatorAnatomySummary(g);
          const hasScars = sum.totalScars > 0;
          const isDamaged = sum.totalCurrentHp < sum.totalMaxHp;
          return (
            <button
              key={g.id}
              onClick={() => setSelectedGladiatorId(g.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                g.id === activeGladiator.id
                  ? 'bg-amber-600 border-amber-500 text-stone-950'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <span>{g.name}</span>
              {hasScars && <HeartCrack className="w-3 h-3 text-red-400" title="Sustained Scars" />}
              <span className="font-mono text-[10px] opacity-75">
                ({sum.totalCurrentHp}/{sum.totalMaxHp} HP)
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Surgery Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Paper Doll (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Anatomical Injury Map — {activeGladiator.name}
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Total Scars: <strong className="text-red-400">{anatomySummary.totalScars} HP</strong>
            </span>
          </div>

          <AnatomyPaperDoll
            gladiator={activeGladiator}
            selectedSlot={selectedSlot}
            onSelectSlot={slot => setSelectedSlot(slot)}
          />

          {/* Quick Whole-Body Patch Action */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                <Bandage className="w-4 h-4 text-emerald-400" />
                Full Body Wound Dressing & Repairs
              </span>
              <p className="text-xs text-stone-400 mt-0.5">
                Restores missing HP across all 6 body parts up to current unscarred limits.
              </p>
            </div>

            <button
              id="patch-all-wounds-btn"
              onClick={() => patchWounds(activeGladiator.id)}
              disabled={surgeryCosts.totalPatchCost === 0 || gold < surgeryCosts.totalPatchCost}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition whitespace-nowrap ${
                surgeryCosts.totalPatchCost > 0 && gold >= surgeryCosts.totalPatchCost
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-md cursor-pointer'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              {surgeryCosts.totalPatchCost > 0
                ? `Patch All Limbs (${surgeryCosts.totalPatchCost}g)`
                : 'All Limbs at Full HP'}
            </button>
          </div>
        </div>

        {/* Right Column: Selected Limb Surgical Operations (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                Surgical Console: {selectedSlot.replace('_', ' ').toUpperCase()}
              </span>
              <h3 className="text-lg font-bold text-stone-100 mt-0.5">{selectedPart.name}</h3>
              <div className="flex items-center gap-3 text-xs text-stone-400 font-mono mt-1">
                <span>HP: {selectedPart.currentHp}/{selectedPart.maxHp}</span>
                {selectedPart.scarHpPenalty > 0 && (
                  <span className="text-red-400 font-bold">Scar Penalty: -{selectedPart.scarHpPenalty} Max HP</span>
                )}
              </div>
            </div>

            {/* Diagnostic Report */}
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs flex flex-col gap-2">
              <span className="font-semibold text-stone-300">Surgeon's Diagnostic:</span>
              <p className="text-stone-400 leading-relaxed">
                {selectedPart.currentHp <= 0
                  ? '⚠️ CRITICAL CATASTROPHE! Limb is completely non-functional. Patch immediately or graft a replacement limb.'
                  : selectedPart.scarHpPenalty > 0
                  ? `🩸 Permanent fibrous scar tissue detected. Max operational health is permanently reduced by ${selectedPart.scarHpPenalty} HP until regenerative bio-gel surgery is performed.`
                  : 'Limb structural integrity is intact. Standard field dressing is sufficient.'}
              </p>
            </div>

            {/* Surgery Operations */}
            <div className="flex flex-col gap-3">
              {/* 1. Patch Selected Limb */}
              <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-stone-200 block">Patch Part Wounds</span>
                  <span className="text-[11px] text-stone-400">Restores HP to unscarred maximum</span>
                </div>

                <button
                  id={`patch-part-${selectedSlot}-btn`}
                  onClick={() => patchWounds(activeGladiator.id, selectedSlot)}
                  disabled={selectedPartCost.repairHpCost === 0 || gold < selectedPartCost.repairHpCost}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedPartCost.repairHpCost > 0 && gold >= selectedPartCost.repairHpCost
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {selectedPartCost.repairHpCost > 0 ? `Patch (${selectedPartCost.repairHpCost}g)` : 'Full HP'}
                </button>
              </div>

              {/* 2. Regenerative Scar Treatment */}
              <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-300 block flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Scar Tissue Regeneration
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Precision bio-gel grafting removes permanent scar penalty
                  </span>
                </div>

                <button
                  id={`remove-scar-${selectedSlot}-btn`}
                  onClick={() => removeScar(activeGladiator.id, selectedSlot)}
                  disabled={selectedPartCost.scarRemovalCost === 0 || gold < selectedPartCost.scarRemovalCost}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedPartCost.scarRemovalCost > 0 && gold >= selectedPartCost.scarRemovalCost
                      ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {selectedPartCost.scarRemovalCost > 0
                    ? `Treat Scar (${selectedPartCost.scarRemovalCost}g)`
                    : 'No Scars'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
