import React from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, Info, Coins, Database, Dna, HelpCircle } from 'lucide-react';
import { LabState, SlimeColor, SlimePattern, CodexEntry, Slime } from '../types';
import { COLOR_SPECS, PATTERN_DESCRIPTIONS, getColorRegentCost } from '../gameLogic';
import { SlimeVisual } from './SlimeVisual';

interface SlimeDexTabProps {
  state: LabState;
  onBuyRegent: (pattern: SlimePattern) => void;
  onBuyColorRegent: (color: SlimeColor) => void;
}

export function SlimeDexTab({ state, onBuyRegent, onBuyColorRegent }: SlimeDexTabProps) {
  const currentSlimes = state.slimes;

  // Derive Roster presence for hint reveal checks
  const ownedColors = new Set<SlimeColor>(currentSlimes.map(s => s.color));
  const ownedPatterns = new Set<SlimePattern>(currentSlimes.map(s => s.pattern));

  // Pattern Tier definition (for cost & hint calculations)
  const patternTiers: Record<SlimePattern, number> = {
    Solid: 0,
    Stripe: 1,
    Polka: 2,
    Glow: 3,
    Crown: 4,
    Ringed: 5,
    Nebula: 6,
    Obsidian: 7
  };

  const colorsList: SlimeColor[] = ['Red', 'Blue', 'Yellow', 'Purple', 'Orange', 'Green', 'Gray'];
  const patternsList: SlimePattern[] = ['Solid', 'Stripe', 'Polka', 'Glow', 'Crown', 'Ringed', 'Nebula', 'Obsidian'];

  // 1. Compute dynamic read-derived Hint States
  const isColorHinted = (color: SlimeColor): boolean => {
    // Already discovered? No need to hint
    if (state.colorCodex?.[color]?.discovered) return false;

    // Standard three pairing recipes:
    // Purple = Red + Blue
    // Orange = Red + Yellow
    // Green = Blue + Yellow
    if (color === 'Purple') {
      return ownedColors.has('Red') || ownedColors.has('Blue');
    }
    if (color === 'Orange') {
      return ownedColors.has('Red') || ownedColors.has('Yellow');
    }
    if (color === 'Green') {
      return ownedColors.has('Blue') || ownedColors.has('Yellow');
    }

    return false; // Gray & others stay locked with no recipe hints
  };

  const isPatternHinted = (pattern: SlimePattern): boolean => {
    // Already discovered? No need to hint
    if (state.patternCodex?.[pattern]?.discovered) return false;

    const tier = patternTiers[pattern];
    if (tier === 0) return false; // Solid is starter, shouldn't be locked anyway

    // Check if player owns any pattern of tier-1 (one level below this pattern)
    // Stripe (1) -> check Solid (0)
    // Polka (2) -> check Stripe (1)
    // Glow (3) -> check Stripe (1) or Polka (2)
    // Crown (4) -> check Polka (2) or Glow (3)
    // Ringed (5) -> check Glow (3) or Crown (4)
    // Nebula (6) -> check Crown (4) or Ringed (5)
    // Obsidian (7) -> check Ringed (5) or Nebula (6)

    if (pattern === 'Stripe') return ownedPatterns.has('Solid');
    if (pattern === 'Polka') return ownedPatterns.has('Stripe');
    if (pattern === 'Glow') return ownedPatterns.has('Stripe') || ownedPatterns.has('Polka');
    if (pattern === 'Crown') return ownedPatterns.has('Polka') || ownedPatterns.has('Glow');
    if (pattern === 'Ringed') return ownedPatterns.has('Glow') || ownedPatterns.has('Crown');
    if (pattern === 'Nebula') return ownedPatterns.has('Crown') || ownedPatterns.has('Ringed');
    if (pattern === 'Obsidian') return ownedPatterns.has('Ringed') || ownedPatterns.has('Nebula');

    return false;
  };

  // Helper to construct a dummy slime object for rendering
  const makeDummySlime = (color: SlimeColor, pattern: SlimePattern): Slime => {
    return {
      id: `dummy_${color}_${pattern}`,
      name: `${color} ${pattern}`,
      color,
      pattern,
      level: 1,
      xp: 0,
      stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
      role: 'idle',
      generation: 1,
      createdAt: Date.now()
    };
  };

  // Cryptic descriptions for color pairings
  const colorClues: Record<string, string> = {
    Purple: 'A Red specimen paired with something Blue may yield the unexpected.',
    Orange: 'Splicing a Red specimen with a Yellow strain may spark solar combustion.',
    Green: 'Fusing a Blue specimen with a Yellow strain might trigger a jungle mutation.'
  };

  // Cryptic clues for pattern upgrades
  const patternClues: Record<string, string> = {
    Stripe: 'Fusing multiple Solid specimens might result in parallel banding.',
    Polka: 'Breeding Stripe patterns together could cluster their cells into mitosis spheres.',
    Glow: 'Nurturing Stripe or Polka membranes may stimulate bioluminescence.',
    Crown: 'Incubating Polka or Glow membranes could solidify calcified solar debris.',
    Ringed: 'Fusing Glow or Crown specimens might generate electromagnetic orbits.',
    Nebula: 'Bridging Crown or Ringed patterns may swirl their membranes into nebulas.',
    Obsidian: 'Fusing Ringed or Nebula specimens might crystallize their structures into obsidian.'
  };

  // Compute Regent Costs: 50 + tier * 25, doubled if undiscovered
  const getRegentCost = (pattern: SlimePattern): number => {
    const baseCost = 50 + (patternTiers[pattern] || 0) * 25;
    const isDiscovered = state.patternCodex?.[pattern]?.discovered;
    return isDiscovered ? baseCost : Math.round(baseCost * 2);
  };

  return (
    <div className="space-y-8 flex-1">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-base font-bold font-display text-white flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Asteroid-317 Genetics Codex</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Biomedical ledger cataloging discovered colors, membrane traits, and splicing routes.
          </p>
        </div>
        <div className="mt-4 md:mt-0 px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center space-x-4">
          <div className="text-right font-mono">
            <div className="text-[9px] text-slate-500 uppercase">Available Credits</div>
            <div className="text-sm font-bold text-yellow-400">{state.credits} Credits</div>
          </div>
        </div>
      </div>

      {/* Colors Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
          <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-cyan-400" />
            Core Color Strains
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            {colorsList.filter(c => state.colorCodex?.[c]?.discovered).length} / {colorsList.length} Decoded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {colorsList.map(color => {
            const isDiscovered = !!state.colorCodex?.[color]?.discovered;
            const isHinted = isColorHinted(color);
            const entry = state.colorCodex?.[color];
            const spec = COLOR_SPECS[color];
            const isPrimary = color === 'Red' || color === 'Blue' || color === 'Yellow';
            const colorCost = !isPrimary ? getColorRegentCost(color, isDiscovered) : 0;
            const colorRegentCount = state.colorRegentInventory?.[color] || 0;

            // 1. Discovered State
            if (isDiscovered) {
              const discoveryDateStr = entry?.discoveredAt 
                ? new Date(entry.discoveredAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Initial';

              return (
                <div 
                  key={color}
                  className="bg-slate-900/20 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all"
                >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: spec.rgb }} />
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-white uppercase">{color} Strain</h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Decoded: {discoveryDateStr}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-950/40 border border-slate-850">
                      <SlimeVisual slime={makeDummySlime(color, 'Solid')} size="xs" />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950/40 border border-slate-900 rounded-lg text-[10px] font-mono text-slate-300 leading-normal">
                    <span className="font-bold text-cyan-400 block mb-0.5 uppercase text-[9px] tracking-wider">Culture Specialty</span>
                    {spec.specialty}
                  </div>

                  {/* Buy Regent Option (Only for non-primary colors) */}
                  {!isPrimary && (
                    <div className="pt-2.5 border-t border-slate-850/50 space-y-2 mt-auto">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Regent Inventory</span>
                        <span className="text-cyan-400 font-bold">{colorRegentCount} unspent</span>
                      </div>
                      <button
                        onClick={() => onBuyColorRegent(color)}
                        disabled={state.credits < colorCost}
                        className={`w-full py-1.5 px-2 rounded font-mono text-[10px] font-bold uppercase tracking-wider border flex items-center justify-center space-x-1.5 transition-all ${
                          state.credits >= colorCost
                            ? 'bg-yellow-600/90 hover:bg-yellow-500 text-slate-950 border-yellow-500 cursor-pointer shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                            : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3 h-3" />
                        <span>Buy Regent — {colorCost} Cr</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // 2. Hinted State
            if (isHinted) {
              return (
                <div 
                  key={color}
                  className="bg-yellow-950/5 border border-yellow-800/20 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden min-h-[140px] animate-pulse"
                >
                  <div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-600/40" />
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-mono text-xs font-bold text-yellow-500 uppercase tracking-wide">Possible Blend</h4>
                        <p className="text-[9px] text-yellow-600/60 font-mono mt-0.5">RECIPE CLUE FOUND</p>
                      </div>
                      <HelpCircle className="w-4 h-4 text-yellow-500/50" />
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 leading-relaxed bg-slate-950/30 p-2.5 rounded-lg border border-yellow-950/40 mt-3">
                      "{colorClues[color] || 'Ingredients available in active containment cells.'}"
                    </div>
                  </div>

                  {/* Buy Regent Option (Only for non-primary colors) */}
                  {!isPrimary && (
                    <div className="pt-2.5 border-t border-yellow-950/30 space-y-2 mt-auto">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Regent Inventory</span>
                        <span className="text-cyan-400 font-bold">{colorRegentCount} unspent</span>
                      </div>
                      <button
                        onClick={() => onBuyColorRegent(color)}
                        disabled={state.credits < colorCost}
                        className={`w-full py-1.5 px-2 rounded font-mono text-[10px] font-bold uppercase tracking-wider border flex items-center justify-center space-x-1.5 transition-all ${
                          state.credits >= colorCost
                            ? 'bg-yellow-600/90 hover:bg-yellow-500 text-slate-950 border-yellow-500 cursor-pointer shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                            : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3 h-3" />
                        <span>Buy Regent — {colorCost} Cr</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // 3. Locked State
            return (
              <div 
                key={color}
                className="border border-dashed border-slate-850 bg-slate-950/20 rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[140px] space-y-2 opacity-50"
              >
                <Lock className="w-4 h-4 text-slate-700" />
                <span className="font-mono text-[10px] font-bold text-slate-600 tracking-wider uppercase">Unconfirmed Strain</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Patterns Grid */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
          <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center">
            <Dna className="w-3.5 h-3.5 mr-2 text-cyan-400" />
            Membrane Patterns & Regents
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            {patternsList.filter(p => state.patternCodex?.[p]?.discovered).length} / {patternsList.length} Decoded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {patternsList.map(pattern => {
            const isDiscovered = !!state.patternCodex?.[pattern]?.discovered;
            const isHinted = isPatternHinted(pattern);
            const entry = state.patternCodex?.[pattern];
            const desc = PATTERN_DESCRIPTIONS[pattern];
            const tier = patternTiers[pattern];
            const cost = getRegentCost(pattern);
            const count = state.regentInventory?.[pattern] || 0;

            // 1. Discovered State
            if (isDiscovered) {
              const discoveryDateStr = entry?.discoveredAt 
                ? new Date(entry.discoveredAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Initial';

              return (
                <div 
                  key={pattern}
                  className="bg-slate-900/20 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between border-b border-slate-850/50 pb-2">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-white uppercase">{desc.name}</h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Tier {tier} • Decoded: {discoveryDateStr}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-950/40 border border-slate-850">
                      <SlimeVisual slime={makeDummySlime('Gray', pattern)} size="xs" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-cyan-400 font-semibold uppercase">
                      Bonus: {desc.bonus}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                      {desc.description}
                    </p>
                  </div>

                  {/* Buy Regent Option (Only for non-starter Solid patterns) */}
                  {tier > 0 && (
                    <div className="pt-2.5 border-t border-slate-850/50 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Regent Inventory</span>
                        <span className="text-cyan-400 font-bold">{count} unspent</span>
                      </div>
                      <button
                        onClick={() => onBuyRegent(pattern)}
                        disabled={state.credits < cost}
                        className={`w-full py-1.5 px-2 rounded font-mono text-[10px] font-bold uppercase tracking-wider border flex items-center justify-center space-x-1.5 transition-all ${
                          state.credits >= cost
                            ? 'bg-yellow-600/90 hover:bg-yellow-500 text-slate-950 border-yellow-500 cursor-pointer shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                            : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3 h-3" />
                        <span>Buy Regent — {cost} Cr</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // 2. Hinted State
            if (isHinted) {
              return (
                <div 
                  key={pattern}
                  className="bg-yellow-950/5 border border-yellow-800/20 rounded-xl p-4 flex flex-col justify-between space-y-3 relative min-h-[140px] animate-pulse"
                >
                  <div>
                    <div className="flex items-start justify-between border-b border-yellow-950/30 pb-2">
                      <div>
                        <h4 className="font-mono text-xs font-bold text-yellow-500 uppercase tracking-wide">Evolving Membrane</h4>
                        <p className="text-[9px] text-yellow-600/60 font-mono mt-0.5">Tier {tier} Clue</p>
                      </div>
                      <HelpCircle className="w-4 h-4 text-yellow-500/50" />
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 leading-relaxed bg-slate-950/30 p-2.5 rounded-lg border border-yellow-950/40 mt-3">
                      "{patternClues[pattern] || 'Requires high tier parents to mutation-splice.'}"
                    </div>
                  </div>

                  {/* Buy Regent Option (Only for non-starter Solid patterns) */}
                  {tier > 0 && (
                    <div className="pt-2.5 border-t border-yellow-950/30 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Regent Inventory</span>
                        <span className="text-cyan-400 font-bold">{count} unspent</span>
                      </div>
                      <button
                        onClick={() => onBuyRegent(pattern)}
                        disabled={state.credits < cost}
                        className={`w-full py-1.5 px-2 rounded font-mono text-[10px] font-bold uppercase tracking-wider border flex items-center justify-center space-x-1.5 transition-all ${
                          state.credits >= cost
                            ? 'bg-yellow-600/90 hover:bg-yellow-500 text-slate-950 border-yellow-500 cursor-pointer shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                            : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3 h-3" />
                        <span>Buy Regent — {cost} Cr</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // 3. Locked State
            return (
              <div 
                key={pattern}
                className="border border-dashed border-slate-850 bg-slate-950/20 rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[140px] space-y-2 opacity-50"
              >
                <Lock className="w-4 h-4 text-slate-700" />
                <span className="font-mono text-[10px] font-bold text-slate-600 tracking-wider uppercase">Unconfirmed Pattern</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
