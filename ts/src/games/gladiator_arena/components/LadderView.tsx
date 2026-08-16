/**
 * Gladiator Arena — Champion Ladder & Match Deployment View
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ArenaOpponent, Gladiator } from '../types';
import { ARENA_TIERS } from '../simulation/championLadder';
import { getGladiatorAnatomySummary } from '../../../engine/shared/anatomy';
import { AnatomyPaperDoll } from './AnatomyPaperDoll';
import {
  Trophy,
  Swords,
  Coins,
  Users,
  Lock,
  Check,
  AlertTriangle,
  Sparkles,
  Eye,
  Skull
} from 'lucide-react';

export const LadderView: React.FC = () => {
  const {
    roster,
    currentTierId,
    wins,
    startBout,
  } = useGame();

  const [selectedTierId, setSelectedTierId] = useState<number>(currentTierId);
  const [selectedOpponent, setSelectedOpponent] = useState<ArenaOpponent | null>(null);
  const [selectedFighterIds, setSelectedFighterIds] = useState<string[]>([roster[0]?.id || '']);
  const [scoutingGladiator, setScoutingGladiator] = useState<Gladiator | null>(null);

  const activeTier = ARENA_TIERS.find(t => t.id === selectedTierId) || ARENA_TIERS[0];
  const allOpponents = [...activeTier.opponents, activeTier.champion];

  // Set default opponent if none selected
  React.useEffect(() => {
    if (!selectedOpponent || !allOpponents.some(o => o.id === selectedOpponent.id)) {
      setSelectedOpponent(allOpponents[0]);
    }
  }, [selectedTierId]);

  // Set default scouting gladiator
  React.useEffect(() => {
    if (selectedOpponent && selectedOpponent.gladiators.length > 0) {
      setScoutingGladiator(selectedOpponent.gladiators[0]);
    }
  }, [selectedOpponent]);

  // Toggle fighter deployment checkbox
  const toggleFighter = (id: string) => {
    if (selectedFighterIds.includes(id)) {
      if (selectedFighterIds.length > 1) {
        setSelectedFighterIds(prev => prev.filter(fId => fId !== id));
      }
    } else {
      setSelectedFighterIds(prev => [...prev, id]);
    }
  };

  const handleLaunchBout = () => {
    if (!selectedOpponent || selectedFighterIds.length === 0) return;
    startBout(selectedOpponent, selectedFighterIds);
  };

  // Check if any selected gladiator is severely injured
  const hasInjuredFighters = roster
    .filter(g => selectedFighterIds.includes(g.id))
    .some(g => getGladiatorAnatomySummary(g).overallHpRatio < 0.5);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
      {/* Tier Tabs (Swords & Sandals Ladder) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-800">
        {ARENA_TIERS.map(tier => {
          const isUnlocked = wins >= tier.minWinsToUnlock;
          const isSelected = selectedTierId === tier.id;

          return (
            <button
              key={tier.id}
              id={`ladder-tier-tab-${tier.id}`}
              onClick={() => isUnlocked && setSelectedTierId(tier.id)}
              disabled={!isUnlocked}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs whitespace-nowrap transition ${
                isSelected
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/50'
                  : isUnlocked
                  ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                  : 'bg-stone-950/40 border-stone-800/40 text-stone-600 cursor-not-allowed'
              }`}
            >
              {!isUnlocked ? <Lock className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5 text-amber-400" />}
              <span>Tier {tier.id}: {tier.name}</span>
              {!isUnlocked && <span className="text-[10px] opacity-60">({tier.minWinsToUnlock} Wins Req)</span>}
            </button>
          );
        })}
      </div>

      {/* Arena Overview Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
              {activeTier.location}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-stone-100 uppercase tracking-wide">{activeTier.name}</h2>
          <p className="text-xs text-stone-400 max-w-xl mt-1">{activeTier.description}</p>
        </div>

        <div className="text-xs text-stone-400 bg-stone-950 px-4 py-2 rounded-xl border border-stone-800 font-mono">
          Tier Status: <strong className="text-emerald-400 font-bold">ACTIVE CIRCUIT</strong>
        </div>
      </div>

      {/* Main Bout Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Opponent Roster Selection (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
            Select Arena Match / Bout
          </span>

          <div className="flex flex-col gap-3">
            {allOpponents.map(opp => {
              const isSelected = selectedOpponent?.id === opp.id;
              const isBoss = opp.difficulty === 'boss' || opp.difficulty === 'champion';
              const isTagTeam = opp.gladiators.length > 1;

              return (
                <div
                  key={opp.id}
                  id={`opponent-card-${opp.id}`}
                  onClick={() => setSelectedOpponent(opp)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-2.5 ${
                    isSelected
                      ? isBoss
                        ? 'bg-red-950/60 border-red-500 ring-2 ring-red-400 shadow-xl'
                        : 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-400 shadow-xl'
                      : isBoss
                      ? 'bg-stone-900 border-red-900/60 hover:border-red-600'
                      : 'bg-stone-900 border-stone-800 hover:border-stone-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {isBoss ? (
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                            <Skull className="w-3 h-3" /> Tier Champion
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px] font-bold uppercase tracking-wider">
                            {opp.difficulty}
                          </span>
                        )}
                        {isTagTeam && (
                          <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-600/30 text-blue-300 text-[10px] font-bold uppercase flex items-center gap-1">
                            <Users className="w-3 h-3" /> {opp.gladiators.length}-Frame Tag Team
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-stone-100 mt-1">{opp.name}</h3>
                      <span className="text-xs text-amber-400 font-serif italic">"{opp.title}"</span>
                    </div>

                    {/* Purse */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-stone-400 uppercase font-mono">Bout Purse</span>
                      <span className="font-mono font-bold text-amber-300 text-sm flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        {opp.purseReward}g
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">{opp.description}</p>

                  {opp.specialLootPart && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-600/40 p-2 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Special Salvage: <strong>{opp.specialLootPart.name}</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Squad Deployment & Scouting Inspector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Squad Deployment Picker */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Manager Deployment
                </span>
                <h3 className="text-base font-bold text-stone-100">
                  Select Fielded Frames ({selectedFighterIds.length} Selected)
                </h3>
              </div>
              <span className="text-xs text-stone-400 font-mono">
                {selectedFighterIds.length > 1 ? 'Tag-Team Squad Mode' : 'Solo Duel Mode'}
              </span>
            </div>

            {/* Frame Checkbox Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roster.map(g => {
                const isSelected = selectedFighterIds.includes(g.id);
                const sum = getGladiatorAnatomySummary(g);
                const isSeverelyHurt = sum.overallHpRatio < 0.4;

                return (
                  <div
                    key={g.id}
                    onClick={() => toggleFighter(g.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-400'
                        : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border ${
                          isSelected
                            ? 'bg-amber-600 border-amber-500 text-stone-950'
                            : 'bg-stone-900 border-stone-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-xs text-stone-100 truncate">{g.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {sum.totalCurrentHp}/{sum.totalMaxHp} HP ({Math.round(sum.overallHpRatio * 100)}%)
                        </div>
                      </div>
                    </div>

                    {isSeverelyHurt && (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {hasInjuredFighters && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/50 border border-red-600/40 text-red-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Warning:</strong> One or more selected gladiators are carrying significant injuries! Visit the Medbay before launching to prevent permanent limb destruction.
                </span>
              </div>
            )}

            {/* Launch Bout CTA */}
            <button
              id="enter-arena-btn"
              onClick={handleLaunchBout}
              disabled={selectedFighterIds.length === 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition transform active:scale-95 cursor-pointer"
            >
              <Swords className="w-5 h-5" />
              Enter the Arena ({selectedOpponent?.name})
            </button>
          </div>

          {/* Enemy Scouting Paper Doll */}
          {selectedOpponent && scoutingGladiator && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                    Anatomy Telemetry Scout: {scoutingGladiator.name}
                  </span>
                </div>
                {selectedOpponent.gladiators.length > 1 && (
                  <div className="flex items-center gap-1">
                    {selectedOpponent.gladiators.map(eg => (
                      <button
                        key={eg.id}
                        onClick={() => setScoutingGladiator(eg)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          scoutingGladiator.id === eg.id
                            ? 'bg-amber-600 text-stone-950'
                            : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {eg.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <AnatomyPaperDoll gladiator={scoutingGladiator} compact={true} readOnly={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
