/**
 * Gladiator Arena — Roster & Frame Management View
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BodyPart, BodySlot, Gladiator } from '../types';
import { AnatomyPaperDoll } from './AnatomyPaperDoll';
import { CompatibilityInspector } from './CompatibilityInspector';
import { calculateEffectiveStats } from '../simulation/combatEngine';
import { getGladiatorAnatomySummary } from '../../../engine/shared/anatomy';
import { getPartScrapValue } from '../simulation/forgeEconomy';
import { 
  Users, 
  Swords, 
  Shield, 
  Zap, 
  Dna, 
  Cpu, 
  Crosshair, 
  Flame, 
  Trash2, 
  ArrowRightLeft, 
  Edit3, 
  Check, 
  Plus, 
  Sparkles,
  HeartCrack,
  Activity
} from 'lucide-react';

export const RosterView: React.FC = () => {
  const {
    roster,
    inventory,
    selectedGladiatorId,
    setSelectedGladiatorId,
    equipPart,
    scrapPart,
    updateGladiatorProfile,
  } = useGame();

  const [selectedSlot, setSelectedSlot] = useState<BodySlot>('torso');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPersonality, setEditPersonality] = useState<Gladiator['personality']>('brawler');

  const activeGladiator = roster.find(g => g.id === selectedGladiatorId) || roster[0];

  if (!activeGladiator) {
    return <div className="p-8 text-center text-stone-400">No Frames found in roster.</div>;
  }

  const effectiveStats = calculateEffectiveStats(activeGladiator);
  const anatomySummary = getGladiatorAnatomySummary(activeGladiator);
  const activePart = activeGladiator.parts[selectedSlot];

  // Spare inventory parts matching the selected slot
  const matchingSpareParts = inventory.filter(p => p.slot === selectedSlot);

  const startEdit = () => {
    setEditName(activeGladiator.name);
    setEditTitle(activeGladiator.title);
    setEditPersonality(activeGladiator.personality);
    setIsEditingProfile(true);
  };

  const saveEdit = () => {
    updateGladiatorProfile(activeGladiator.id, editName, editTitle, editPersonality);
    setIsEditingProfile(false);
  };

  const personalityDescriptions: Record<Gladiator['personality'], { label: string; desc: string }> = {
    berserker: {
      label: 'Berserker',
      desc: 'Aggressively prioritizes Power Attacks and Charges. Never retreats, even when crippled.',
    },
    tactician: {
      label: 'Tactician',
      desc: 'Calculates high-accuracy Quick Attacks, exploits enemy vulnerabilities, and parries strategically.',
    },
    showman: {
      label: 'Showman',
      desc: 'Taunts often to build Crowd Favor & Adrenaline, maximizing purse payout and audience hype.',
    },
    brawler: {
      label: 'Brawler',
      desc: 'Relentless kinetic pressure. Balances Charges with heavy counter-punches.',
    },
    survivor: {
      label: 'Survivor',
      desc: 'Defensive specialist. Turtles when low on HP and triggers tactical tag-outs when available.',
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
      {/* Frame Tabs Selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-stone-800 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {roster.map((g, idx) => {
            const isSel = g.id === activeGladiator.id;
            const sum = getGladiatorAnatomySummary(g);
            return (
              <button
                key={g.id}
                id={`roster-frame-tab-${idx}`}
                onClick={() => {
                  setSelectedGladiatorId(g.id);
                  setIsEditingProfile(false);
                }}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all ${
                  isSel
                    ? 'bg-amber-600 border-amber-500 text-stone-950 font-bold shadow-md shadow-amber-950/40'
                    : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${sum.isKnockedOut ? 'bg-red-500 animate-ping' : sum.overallHpRatio < 0.4 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span>{g.frameId}: {g.name}</span>
                <span className="text-xs opacity-75 font-mono">({Math.round(sum.overallHpRatio * 100)}% HP)</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-stone-400 font-mono">
          Owned Frames: <span className="text-stone-200 font-bold">{roster.length}</span> | Battle Record: <span className="text-emerald-400 font-bold">{activeGladiator.wins}W</span> - <span className="text-red-400 font-bold">{activeGladiator.losses}L</span>
        </div>
      </div>

      {/* Main Gladiator Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile & Anatomy Visualizer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Gladiator Header Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3">
            {!isEditingProfile ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-stone-100">{activeGladiator.name}</h2>
                    <span className="text-xs text-amber-400 font-serif italic">"{activeGladiator.title}"</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 font-mono">
                      {activeGladiator.frameId}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-stone-400">
                    <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/30 text-amber-300 font-semibold uppercase">
                      {personalityDescriptions[activeGladiator.personality].label} AI Agent
                    </span>
                    <span>•</span>
                    <span>{personalityDescriptions[activeGladiator.personality].desc}</span>
                  </div>
                </div>

                <button
                  id="edit-gladiator-profile-btn"
                  onClick={startEdit}
                  className="p-2 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition"
                  title="Edit Gladiator Name & Personality Profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 uppercase">Gladiator Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 uppercase">Honorary Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-400 uppercase">Agent Decision Personality</label>
                  <select
                    value={editPersonality}
                    onChange={e => setEditPersonality(e.target.value as any)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="brawler">Brawler (Balanced Kinetic Pressure & Counter-Strikes)</option>
                    <option value="berserker">Berserker (Heavy Power Attacks & Charging Strikes)</option>
                    <option value="tactician">Tactician (High-Accuracy Quick Strikes & Smart Parrying)</option>
                    <option value="showman">Showman (Audience Taunts, Adrenaline Crits & High Purse)</option>
                    <option value="survivor">Survivor (Defensive Guarding & Early Tag-Outs)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-1">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-1 text-xs text-stone-400 hover:text-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-amber-600 text-stone-950 font-bold hover:bg-amber-500"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Profile
                  </button>
                </div>
              </div>
            )}

            {/* Live Effective Combat Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-stone-800 text-xs">
              <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 uppercase flex items-center gap-1">
                  <Swords className="w-3 h-3 text-red-400" /> Power
                </span>
                <span className="text-sm font-mono font-bold text-stone-100">{effectiveStats.power}</span>
                <span className="text-[10px] text-stone-500 block">Arm Eff: {Math.round(anatomySummary.armEfficiency * 100)}%</span>
              </div>

              <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Speed
                </span>
                <span className="text-sm font-mono font-bold text-stone-100">{effectiveStats.speed}</span>
                <span className="text-[10px] text-stone-500 block">Leg Eff: {Math.round(anatomySummary.legEfficiency * 100)}%</span>
              </div>

              <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-400" /> Armor
                </span>
                <span className="text-sm font-mono font-bold text-stone-100">{effectiveStats.armor}</span>
                <span className="text-[10px] text-stone-500 block">Plating Reduc</span>
              </div>

              <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 uppercase flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-emerald-400" /> Accuracy
                </span>
                <span className="text-sm font-mono font-bold text-stone-100">+{effectiveStats.accuracy}%</span>
                <span className="text-[10px] text-stone-500 block">Head Eff: {Math.round(anatomySummary.headEfficiency * 100)}%</span>
              </div>

              <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" /> Crit
                </span>
                <span className="text-sm font-mono font-bold text-stone-100">{effectiveStats.critChance}%</span>
                <span className="text-[10px] text-stone-500 block">Vitals Strike</span>
              </div>
            </div>
          </div>

          {/* Interactive Paper Doll */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Anatomical Structural Matrix (Click limb to inspect)
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Total Vital HP: {anatomySummary.totalCurrentHp}/{anatomySummary.totalMaxHp}
              </span>
            </div>
            <AnatomyPaperDoll
              gladiator={activeGladiator}
              selectedSlot={selectedSlot}
              onSelectSlot={slot => setSelectedSlot(slot)}
            />
          </div>

          {/* Compatibility Inspector */}
          <CompatibilityInspector gladiator={activeGladiator} />
        </div>

        {/* Right Column: Selected Limb Inspector & Spare Inventory (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Selected Limb Details */}
          {activePart && (
            <div className="bg-stone-900 border border-amber-600/40 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Equipped {selectedSlot.replace('_', ' ')}
                  </span>
                  <h3 className="text-base font-bold text-stone-100">{activePart.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-stone-950 border border-stone-800 text-xs font-mono">
                  {activePart.cyberOrganicLean > 0 ? (
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Cyber (+{activePart.cyberOrganicLean.toFixed(1)})
                    </span>
                  ) : activePart.cyberOrganicLean < 0 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Dna className="w-3 h-3" /> Bio ({activePart.cyberOrganicLean.toFixed(1)})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> Hybrid
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">{activePart.description}</p>

              {activePart.specialTrait && (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-600/30 px-2.5 py-1.5 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Trait: <strong className="font-semibold">{activePart.specialTrait}</strong></span>
                </div>
              )}

              {/* Part Stats Matrix */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                <div>
                  <span className="text-[10px] text-stone-400 block">Condition</span>
                  <span className="font-mono font-bold text-stone-200">
                    {activePart.currentHp}/{activePart.maxHp} HP
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">Power / Speed</span>
                  <span className="font-mono font-bold text-stone-200">
                    +{activePart.power} / +{activePart.speed}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">Armor Plating</span>
                  <span className="font-mono font-bold text-stone-200">+{activePart.armor}</span>
                </div>
              </div>

              {activePart.scarHpPenalty > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-950/60 border border-red-600/40 text-red-300 text-xs">
                  <HeartCrack className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>Permanent Scar (-{activePart.scarHpPenalty} Max HP)</strong>. Visit the Medbay Clinic for advanced regenerative surgery.
                  </span>
                </div>
              )}

              {/* Scrap Button */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                <span className="text-xs text-stone-400 font-mono">
                  Scrap value: <strong className="text-amber-400">{getPartScrapValue(activePart)}g</strong>
                </span>
                <button
                  id={`scrap-equipped-${selectedSlot}-btn`}
                  onClick={() => scrapPart(activePart.id, false, activeGladiator.id, selectedSlot)}
                  disabled={inventory.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-red-300 hover:bg-red-950/50 border border-stone-700 text-xs transition disabled:opacity-40"
                  title="Scrap this part (Requires replacement in inventory)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Scrap Limb
                </button>
              </div>
            </div>
          )}

          {/* Compatible Spare Inventory for Selected Slot */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                Inventory Spares for [{selectedSlot.replace('_', ' ').toUpperCase()}]
              </span>
              <span className="text-xs text-stone-400 font-mono">({matchingSpareParts.length} available)</span>
            </div>

            {matchingSpareParts.length === 0 ? (
              <div className="p-6 text-center text-stone-500 text-xs flex flex-col items-center gap-2">
                <p>No spare {selectedSlot.replace('_', ' ')} limbs in inventory.</p>
                <p className="text-stone-400">Visit <strong>The Forge</strong> shop to buy new biological or cybernetic attachments.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {matchingSpareParts.map(spare => (
                  <div
                    key={spare.id}
                    className="p-3 rounded-xl bg-stone-950 border border-stone-800 hover:border-stone-600 flex flex-col gap-2 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-100">{spare.name}</span>
                      <span className="text-[11px] font-mono text-stone-400">{spare.currentHp}/{spare.maxHp} HP</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono">
                      <span>Pwr: +{spare.power}</span>
                      <span>Spd: +{spare.speed}</span>
                      <span>Arm: +{spare.armor}</span>
                      <span
                        className={
                          spare.cyberOrganicLean > 0
                            ? 'text-cyan-400'
                            : spare.cyberOrganicLean < 0
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }
                      >
                        Lean: {spare.cyberOrganicLean > 0 ? `+${spare.cyberOrganicLean}` : spare.cyberOrganicLean}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-800/60">
                      <button
                        onClick={() => scrapPart(spare.id, true)}
                        className="text-[11px] text-stone-400 hover:text-red-400 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Scrap ({getPartScrapValue(spare)}g)
                      </button>

                      <button
                        id={`equip-spare-${spare.id}-btn`}
                        onClick={() => equipPart(activeGladiator.id, spare)}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Equip Limb
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
