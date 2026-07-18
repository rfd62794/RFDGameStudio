// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Info, Coins, Database, Dna, HelpCircle, BookOpen, Beaker } from 'lucide-react';
import { LabState, SlimeColor, SlimePattern, Slime } from '../types';
import { COLOR_SPECS, PATTERN_DESCRIPTIONS, getColorRegentCost, getTargetRegentCost, RawColorTarget, RawShapeTarget } from '../gameLogic';
import { getStaticList } from '../../../engine/runtime';
import type { GameSession } from '../../../engine/types';
import { SlimeVisual } from './SlimeVisual';

interface SlimeDexTabProps {
  state: LabState;
  session: GameSession;
  onBuyRegent: (pattern: SlimePattern) => void;
  onBuyColorRegent: (color: SlimeColor) => void;
  onBuyTargetRegent?: (targetId: string) => void;
}

type SelectedGene = 
  | { type: 'color'; id: SlimeColor }
  | { type: 'pattern'; id: SlimePattern }
  | { type: 'target'; id: string }
  | { type: 'shapeTarget'; id: string };

export function SlimeDexTab({ state, session, onBuyRegent, onBuyColorRegent, onBuyTargetRegent }: SlimeDexTabProps) {
  const currentSlimes = state.slimes;
  const colorTargets = getStaticList(session, 'color_targets') as RawColorTarget[];
  const shapeTargets = getStaticList(session, 'shape_targets') as RawShapeTarget[];

  // Selection state
  const [selectedGene, setSelectedGene] = useState<SelectedGene>({ type: 'color', id: 'Red' });

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

  // 1. Compute dynamic read-derived Hint States
  const isColorHinted = (color: SlimeColor): boolean => {
    if (state.colorCodex?.[color]?.discovered) return false;

    if (color === 'Purple') {
      return ownedColors.has('Red') || ownedColors.has('Blue');
    }
    if (color === 'Orange') {
      return ownedColors.has('Red') || ownedColors.has('Yellow');
    }
    if (color === 'Green') {
      return ownedColors.has('Blue') || ownedColors.has('Yellow');
    }

    return false;
  };

  const isPatternHinted = (pattern: SlimePattern): boolean => {
    if (state.patternCodex?.[pattern]?.discovered) return false;

    const tier = patternTiers[pattern];
    if (tier === 0) return false;

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
    const HUE_MAP: Record<SlimeColor, number> = {
      Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300, Gray: 0
    };
    const hue = HUE_MAP[color] !== undefined ? HUE_MAP[color] : 0;
    const saturation = color === 'Gray' ? 0 : 100;
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
      colorSaturation: saturation,
      hue,
      saturation,
      createdAt: Date.now()
    };
  };

  // Compute Regent Costs: 50 + tier * 25, doubled if undiscovered
  const getRegentCost = (pattern: SlimePattern): number => {
    const baseCost = 50 + (patternTiers[pattern] || 0) * 25;
    const isDiscovered = state.patternCodex?.[pattern]?.discovered;
    return isDiscovered ? baseCost : Math.round(baseCost * 2);
  };

  return (
    <div className="flex flex-col flex-1" id="slimedex_tab_root">
      {/* Top Ledger Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800/60 pb-4 mb-5">
        <div>
          <h2 className="text-base font-bold font-display text-white flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Asteroid-317 Genetics Codex</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Biomedical ledger cataloging discovered colors, membrane traits, and splicing routes.
          </p>
        </div>
        <div className="mt-2 md:mt-0 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="text-right font-mono">
            <div className="text-[9px] text-slate-500 uppercase">Available Credits</div>
            <div className="text-sm font-bold text-yellow-400">{state.credits} Credits</div>
          </div>
        </div>
      </div>

      {/* Two Panel Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        {/* Left Panel: Gene Catalog Grid (7 Columns) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          
          {/* Colors Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
              <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-2 text-cyan-400" />
                Color Strains
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {colorsList.filter(c => state.colorCodex?.[c]?.discovered).length} / {colorsList.length} Decoded
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {colorsList.map((color) => {
                const isDiscovered = !!state.colorCodex?.[color]?.discovered;
                const isHinted = isColorHinted(color);
                const spec = COLOR_SPECS[color];
                const isSelected = selectedGene.type === 'color' && selectedGene.id === color;

                return (
                  <button
                    key={`color_btn_${color}`}
                    onClick={() => setSelectedGene({ type: 'color', id: color })}
                    className={`relative p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all group ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/15 ring-1 ring-cyan-500/20'
                        : isDiscovered
                          ? 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40'
                          : isHinted
                            ? 'border-yellow-650/40 bg-yellow-950/10 hover:border-yellow-600/50 hover:bg-yellow-950/20'
                            : 'border-slate-900/60 bg-slate-950/30 opacity-40 hover:opacity-60'
                    }`}
                  >
                    {isDiscovered && (
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: spec.rgb }} />
                    )}
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-mono text-xs font-bold uppercase truncate ${
                        isSelected ? 'text-cyan-400' : isDiscovered ? 'text-white' : isHinted ? 'text-yellow-500' : 'text-slate-500'
                      }`}>
                        {color}
                      </span>
                      {isDiscovered ? (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: spec.rgb }} />
                      ) : isHinted ? (
                        <HelpCircle className="w-3.5 h-3.5 text-yellow-500/80" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-700" />
                      )}
                    </div>
                    <div className="mt-2 text-[9px] font-mono text-slate-500">
                      {isDiscovered ? 'DECODED' : isHinted ? 'RECIPE CLUE' : 'LOCKED'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patterns Section */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
              <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center">
                <Dna className="w-3.5 h-3.5 mr-2 text-cyan-400" />
                Membrane Patterns
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {patternsList.filter(p => state.patternCodex?.[p]?.discovered).length} / {patternsList.length} Decoded
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {patternsList.map((pattern) => {
                const isDiscovered = !!state.patternCodex?.[pattern]?.discovered;
                const isHinted = isPatternHinted(pattern);
                const isSelected = selectedGene.type === 'pattern' && selectedGene.id === pattern;
                const desc = PATTERN_DESCRIPTIONS[pattern];
                const tier = patternTiers[pattern];

                return (
                  <button
                    key={`pattern_btn_${pattern}`}
                    onClick={() => setSelectedGene({ type: 'pattern', id: pattern })}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all group ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/15 ring-1 ring-cyan-500/20'
                        : isDiscovered
                          ? 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40'
                          : isHinted
                            ? 'border-yellow-650/40 bg-yellow-950/10 hover:border-yellow-600/50 hover:bg-yellow-950/20'
                            : 'border-slate-900/60 bg-slate-950/30 opacity-40 hover:opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-mono text-xs font-bold uppercase truncate ${
                        isSelected ? 'text-cyan-400' : isDiscovered ? 'text-white' : isHinted ? 'text-yellow-500' : 'text-slate-500'
                      }`}>
                        {desc?.name || pattern}
                      </span>
                      {isDiscovered ? (
                        <span className="text-[8px] font-mono font-bold bg-slate-800 text-slate-300 px-1 rounded">T{tier}</span>
                      ) : isHinted ? (
                        <HelpCircle className="w-3.5 h-3.5 text-yellow-500/80" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-700" />
                      )}
                    </div>
                    <div className="mt-2 text-[9px] font-mono text-slate-500">
                      {isDiscovered ? `T${tier} • DISCOVERED` : isHinted ? `T${tier} • EVOLVING` : 'LOCKED'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spectral Color Targets (Color Codex) */}
          <div className="space-y-3 pt-4 border-t border-slate-850/40">
            <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
              <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center">
                <Beaker className="w-3.5 h-3.5 mr-2 text-yellow-500" />
                Spectral Color Targets
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {colorTargets.filter(t => !!state.colorTargetCodex?.[t.id]).length} / {colorTargets.length} Decoded
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {colorTargets.map((target) => {
                const isDiscovered = !!state.colorTargetCodex?.[target.id];
                const isSelected = selectedGene.type === 'target' && selectedGene.id === target.id;

                return (
                  <button
                    key={`target_btn_${target.id}`}
                    onClick={() => setSelectedGene({ type: 'target', id: target.id })}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all group relative ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/15 ring-1 ring-cyan-500/20'
                        : isDiscovered
                          ? 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40'
                          : 'border-slate-900/40 bg-slate-950/10 opacity-50 hover:opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-mono text-[10px] font-bold uppercase truncate ${
                        isSelected ? 'text-cyan-400' : isDiscovered ? 'text-white' : 'text-slate-500'
                      }`}>
                        {isDiscovered ? target.name : `???`}
                      </span>
                      {isDiscovered ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      ) : (
                        <Lock className="w-2.5 h-2.5 text-slate-700" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between w-full text-[8px] font-mono uppercase text-slate-500">
                      <span>{target.tier.replace('_', ' ')}</span>
                      {isDiscovered ? <span className="text-cyan-500">Decoded</span> : <span>Locked</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Morphological Shape Targets (Shape Codex) */}
          <div className="space-y-3 pt-4 border-t border-slate-850/40">
            <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
              <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center">
                <Dna className="w-3.5 h-3.5 mr-2 text-purple-500" />
                Morphological Shape Targets
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {shapeTargets.filter(t => !!state.shapeTargetCodex?.[t.id]).length} / {shapeTargets.length} Decoded
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {shapeTargets.map((target) => {
                const isDiscovered = !!state.shapeTargetCodex?.[target.id];
                const isSelected = selectedGene.type === 'shapeTarget' && selectedGene.id === target.id;

                return (
                  <button
                    key={`shape_btn_${target.id}`}
                    onClick={() => setSelectedGene({ type: 'shapeTarget', id: target.id })}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all group relative ${
                      isSelected
                        ? 'border-purple-500 bg-purple-950/15 ring-1 ring-purple-500/20'
                        : isDiscovered
                          ? 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40'
                          : 'border-slate-900/40 bg-slate-950/10 opacity-50 hover:opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-mono text-[10px] font-bold uppercase truncate ${
                        isSelected ? 'text-purple-400' : isDiscovered ? 'text-white' : 'text-slate-500'
                      }`}>
                        {isDiscovered ? target.name : `???`}
                      </span>
                      {isDiscovered ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      ) : (
                        <Lock className="w-2.5 h-2.5 text-slate-700" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between w-full text-[8px] font-mono uppercase text-slate-500">
                      <span>T{target.tier}</span>
                      {isDiscovered ? <span className="text-purple-500">Decoded</span> : <span>Locked</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: High Fidelity Bio-Scan Details Card (5 Columns) */}
        <div className="lg:col-span-5">
          <div className="border border-slate-800 bg-[#090d16]/90 rounded-xl p-5 h-full flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-950/10 rounded-full filter blur-xl pointer-events-none" />
            
            {/* Dynamic Card Content based on selection */}
            <AnimatePresence mode="wait">
              {selectedGene.type === 'color' ? (
                (() => {
                  const color = selectedGene.id;
                  const isDiscovered = !!state.colorCodex?.[color]?.discovered;
                  const isHinted = isColorHinted(color);
                  const entry = state.colorCodex?.[color];
                  const spec = COLOR_SPECS[color];
                  const isPrimary = color === 'Red' || color === 'Blue' || color === 'Yellow';
                  const colorCost = !isPrimary ? getColorRegentCost(color, isDiscovered) : 0;
                  const colorRegentCount = state.colorRegentInventory?.[color] || 0;

                  return (
                    <motion.div
                      key={`details_color_${color}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 flex flex-col justify-between space-y-5"
                    >
                      {/* Top Header */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                          <div>
                            <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider block font-bold">GENE SCAN : STRAIN_RGB</span>
                            <h3 className="text-sm font-bold font-mono text-white uppercase">{color} Color Core</h3>
                          </div>
                          {isDiscovered ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/20 text-emerald-400">
                              DECODED
                            </span>
                          ) : isHinted ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-950/20 text-yellow-400 animate-pulse">
                              CLUE REVEALED
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-500">
                              SECURE LOCK
                            </span>
                          )}
                        </div>

                        {/* Holographic Slime Preview */}
                        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-6 flex flex-col items-center justify-center relative group min-h-[160px] shadow-inner">
                          {isDiscovered ? (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                <div className="w-24 h-24 rounded-full border border-dashed border-cyan-500 animate-spin" style={{ animationDuration: '20s' }} />
                              </div>
                              <div className="relative transform hover:scale-110 transition-transform duration-300">
                                <SlimeVisual slime={makeDummySlime(color, 'Solid')} size="md" />
                              </div>
                              <span className="text-[9px] font-mono text-slate-500 mt-4 uppercase tracking-widest">Active Chromatic Bio-resonance</span>
                            </>
                          ) : isHinted ? (
                            <div className="text-center py-6">
                              <HelpCircle className="w-10 h-10 text-yellow-500/30 mx-auto mb-2 animate-bounce" />
                              <span className="text-[10px] font-mono text-yellow-600 font-bold uppercase tracking-wider">Undiscovered Splicing Path</span>
                              <p className="text-[9px] text-slate-500 mt-1 max-w-xs mx-auto">Ingredients exist in containment. Incubate parent types.</p>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <Lock className="w-10 h-10 text-slate-800 mx-auto mb-2" />
                              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Data Core Encrypted</span>
                              <p className="text-[9px] text-slate-600 mt-1 max-w-xs mx-auto">Splice more mutations to capture chromatic metadata.</p>
                            </div>
                          )}
                        </div>

                        {/* Analysis / Specialty / Clues */}
                        <div className="space-y-3">
                          {isDiscovered ? (
                            <div className="space-y-2.5">
                              <div className="p-3 bg-slate-950/30 border border-slate-900 rounded-lg">
                                <span className="text-[9px] font-mono font-bold text-cyan-400 block mb-1 uppercase tracking-wider">Culture Specialty</span>
                                <p className="text-xs font-mono text-slate-300 leading-relaxed">{spec.specialty}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2.5 bg-slate-950/20 border border-slate-900 rounded-lg text-center">
                                  <div className="text-[8px] font-mono text-slate-500 uppercase">Primary Stat Boost</div>
                                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase mt-0.5">
                                    {color === 'Red' ? 'ATK' : color === 'Blue' ? 'DEF' : color === 'Yellow' ? 'AGI' : color === 'Purple' ? 'HP' : color === 'Orange' ? 'INT' : color === 'Green' ? 'CHM' : 'ALL STATS'}
                                  </div>
                                </div>
                                <div className="p-2.5 bg-slate-950/20 border border-slate-900 rounded-lg text-center">
                                  <div className="text-[8px] font-mono text-slate-500 uppercase">Decoded Log</div>
                                  <div className="text-xs font-mono font-bold text-slate-300 mt-0.5">
                                    {entry?.discoveredAt ? new Date(entry.discoveredAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Initial'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : isHinted ? (
                            <div className="p-3 bg-yellow-950/5 border border-yellow-900/20 rounded-lg space-y-1.5">
                              <span className="text-[9px] font-mono font-bold text-yellow-500 block uppercase tracking-wider">Genetics Lab Recipe clue</span>
                              <p className="text-xs font-mono text-slate-400 leading-relaxed italic">
                                "{colorClues[color] || 'Ingredients available in active containment cells.'}"
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-lg text-center py-6">
                              <p className="text-xs font-mono text-slate-500">Secure locks protect this strain. Mutate higher-tier specimens to reveal clues.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Regent Action Block */}
                      {!isPrimary && (isDiscovered || isHinted) && (
                        <div className="pt-4 border-t border-slate-850 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500 uppercase">Chromoplasm Regent Supply</span>
                            <span className="text-cyan-400 font-bold">{colorRegentCount} unspent</span>
                          </div>
                          <button
                            onClick={() => onBuyColorRegent(color)}
                            disabled={state.credits < colorCost}
                            className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider border flex items-center justify-center space-x-2 transition-all ${
                              state.credits >= colorCost
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 border-yellow-500 cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Synthesize Chromoplasm — {colorCost} Cr</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })()
              ) : selectedGene.type === 'target' ? (
                (() => {
                  const targetId = selectedGene.id;
                  const target = colorTargets.find(t => t.id === targetId)!;
                  const isDiscovered = !!state.colorTargetCodex?.[targetId];
                  const regentCount = state.targetRegentInventory?.[targetId] || 0;
                  const regentCost = getTargetRegentCost(targetId, isDiscovered);

                  // Create a dummy slime representing the target hue range
                  // Let's pick target's first center Hue as a demo!
                  const targetHue = target.center_hues[0];
                  // Let's pick average of target saturation
                  const targetSat = (target.saturation_min + target.saturation_max) / 2;

                  const targetDummySlime = {
                    id: `dummy_target_${targetId}`,
                    name: isDiscovered ? target.name : 'Unknown Target',
                    color: 'Gray' as SlimeColor, // will snapToFaction inside render
                    pattern: 'Solid' as SlimePattern,
                    level: 1,
                    xp: 0,
                    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
                    role: 'idle' as const,
                    generation: 1,
                    colorSaturation: targetSat,
                    hue: targetHue,
                    saturation: targetSat,
                    createdAt: Date.now()
                  };
                  
                  const isGray = targetSat < 15;
                  const targetColor = isGray ? 'Gray' : (() => {
                    const ANCHORS = { Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300 };
                    let closest: SlimeColor = 'Red';
                    let minDist = 360;
                    Object.entries(ANCHORS).forEach(([c, h]) => {
                      const diff = Math.abs(targetHue - h) % 360;
                      const d = Math.min(diff, 360 - diff);
                      if (d < minDist) {
                        minDist = d;
                        closest = c as SlimeColor;
                      }
                    });
                    return closest;
                  })();
                  targetDummySlime.color = targetColor;

                  const tierDescriptions = {
                    guild: 'A highly cohesive, hyper-saturated breeding target representing the pinnacle alignment of two adjacent cultures.',
                    rival: 'An unstable, intermediate spectrum target resulting from the blending of two opposing, conflicting cultures.',
                    arc_triad: 'A delicate pastel spectrum target spanning three consecutive cultures with low-to-medium saturation bands.',
                    skip_triad: 'An extremely rare, highly unsaturated spectrum target aligning three alternating cultures.'
                  };

                  return (
                    <motion.div
                      key={`details_target_${targetId}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 flex flex-col justify-between space-y-5"
                    >
                      {/* Top Header */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                          <div>
                            <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider block font-bold">GENE SCAN : TARGET_{target.tier.toUpperCase()}</span>
                            <h3 className="text-sm font-bold font-mono text-white uppercase">{isDiscovered ? target.name : '??? Locked Target ???'}</h3>
                          </div>
                          {isDiscovered ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/20 text-emerald-400">
                              DECODED
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-850 bg-slate-900 text-slate-500">
                              LOCKED
                            </span>
                          )}
                        </div>

                        {/* Holographic Slime Preview */}
                        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-6 flex flex-col items-center justify-center relative group min-h-[160px] shadow-inner">
                          {isDiscovered ? (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                <div className="w-24 h-24 rounded-full border border-dashed border-cyan-500 animate-spin" style={{ animationDuration: '20s' }} />
                              </div>
                              <div className="relative transform hover:scale-110 transition-transform duration-300">
                                <SlimeVisual slime={targetDummySlime} size="md" />
                              </div>
                              <span className="text-[9px] font-mono text-slate-500 mt-4 uppercase tracking-widest">Target Chromatic Bio-resonance</span>
                            </>
                          ) : (
                            <div className="text-center py-6">
                              <Lock className="w-10 h-10 text-slate-800 mx-auto mb-2" />
                              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Coordinates Unidentified</span>
                              <p className="text-[9px] text-slate-600 mt-1 max-w-xs mx-auto">Incubate specimens with different Hue & Saturation to hit the right parameters.</p>
                            </div>
                          )}
                        </div>

                        {/* Analysis / Specialty / Clues */}
                        <div className="space-y-3">
                          <div className="p-3 bg-slate-950/30 border border-slate-900 rounded-lg space-y-2">
                            <span className="text-[9px] font-mono font-bold text-cyan-400 block mb-1 uppercase tracking-wider">Classification</span>
                            <p className="text-xs font-mono text-slate-300 leading-relaxed capitalize font-bold">{target.tier.replace('_', ' ')}</p>
                            <p className="text-[11px] font-mono text-slate-400 leading-relaxed">{tierDescriptions[target.tier]}</p>
                          </div>

                          <div className="p-3 bg-slate-950/10 border border-slate-900 rounded-lg space-y-2.5">
                            <span className="text-[9px] font-mono font-bold text-slate-500 block mb-1 uppercase tracking-wider">Spectral Signatures</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-slate-950/40 rounded border border-slate-900 text-center font-mono">
                                <div className="text-[8px] text-slate-500">HUE TARGET</div>
                                <div className="text-xs font-bold text-slate-300 mt-0.5">
                                  {isDiscovered 
                                    ? target.center_hues.map(h => `${h}°`).join(' / ') 
                                    : '???'}
                                </div>
                              </div>
                              <div className="p-2 bg-slate-950/40 rounded border border-slate-900 text-center font-mono">
                                <div className="text-[8px] text-slate-500">SATURATION BAND</div>
                                <div className="text-xs font-bold text-slate-300 mt-0.5">
                                  {isDiscovered 
                                    ? `${target.saturation_min}-${target.saturation_max}%` 
                                    : '???'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Clues for Locked Targets */}
                            {!isDiscovered && (
                              <div className="mt-2 pt-2 border-t border-slate-850/40 text-[10px] text-yellow-500/80 leading-normal">
                                💡 <span className="font-bold">Target Clue:</span> Requires a specimen with{' '}
                                <span className="font-bold text-slate-200">
                                  {target.saturation_min === 65 ? 'Hyper-high Saturation (65-100%)' :
                                   target.saturation_min === 35 ? 'Moderate Saturation (35-65%)' :
                                   target.saturation_min === 20 ? 'Pastel Low Saturation (20-35%)' :
                                   'Unsaturated Near-Gray (15-20%)'}
                                </span>{' '}
                                and a Hue centered near{' '}
                                <span className="font-bold text-slate-200">
                                  {target.center_hues.map(h => {
                                    if (h === 0 || h === 360) return 'Red (0°)';
                                    if (h === 30) return 'Red-Orange (30°)';
                                    if (h === 60) return 'Orange (60°)';
                                    if (h === 90) return 'Orange-Yellow (90°)';
                                    if (h === 120) return 'Yellow (120°)';
                                    if (h === 150) return 'Yellow-Green (150°)';
                                    if (h === 180) return 'Green (180°)';
                                    if (h === 210) return 'Green-Blue (210°)';
                                    if (h === 240) return 'Blue (240°)';
                                    if (h === 270) return 'Blue-Purple (270°)';
                                    if (h === 300) return 'Purple (300°)';
                                    if (h === 330) return 'Purple-Red (330°)';
                                    return `${h}°`;
                                  }).join(' or ')}
                                </span>.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Target Regent Action Block */}
                      {(target.tier === 'guild' || target.tier === 'rival') && (
                        <div className="pt-4 border-t border-slate-850 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500 uppercase">Target Regent Supply</span>
                            <span className="text-cyan-400 font-bold">{regentCount} unspent</span>
                          </div>
                          <button
                            onClick={() => onBuyTargetRegent?.(targetId)}
                            disabled={state.credits < regentCost}
                            className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider border flex items-center justify-center space-x-2 transition-all ${
                              state.credits >= regentCost
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 border-yellow-500 cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Procure Target Regent — {regentCost} Cr</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })()
              ) : selectedGene.type === 'shapeTarget' ? (
                (() => {
                  const targetId = selectedGene.id;
                  const target = shapeTargets.find(t => t.id === targetId)!;
                  const isDiscovered = !!state.shapeTargetCodex?.[targetId];

                  const shapeDummySlime = {
                    id: `dummy_shape_${targetId}`,
                    name: isDiscovered ? target.name : 'Unknown Shape',
                    color: 'Gray' as SlimeColor,
                    pattern: 'Solid' as SlimePattern,
                    level: 1,
                    xp: 0,
                    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
                    role: 'idle' as const,
                    generation: 1,
                    colorSaturation: 0,
                    hue: 0,
                    saturation: 0,
                    vertexCount: target.vertex_count,
                    irregularity: target.irregularity_min ? (target.irregularity_min + target.irregularity_max) / 2 : 5,
                    createdAt: Date.now()
                  };

                  const tierLabels: Record<number, string> = {
                    1: 'Base Polygon',
                    2: 'Advanced Polygon',
                    3: 'Complex Morphology',
                    4: 'Rare Morphology',
                    5: 'Legendary Morphology'
                  };

                  return (
                    <motion.div
                      key={`details_shape_${targetId}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 flex flex-col justify-between space-y-5"
                    >
                      {/* Top Header */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                          <div>
                            <span className="text-[9px] font-mono text-purple-500 uppercase tracking-wider block font-bold">GENE SCAN : SHAPE_T{target.tier}</span>
                            <h3 className="text-sm font-bold font-mono text-white uppercase">{isDiscovered ? target.name : '??? Locked Shape ???'}</h3>
                          </div>
                          {isDiscovered ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/20 text-emerald-400">
                              DECODED
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-850 bg-slate-900 text-slate-500">
                              LOCKED
                            </span>
                          )}
                        </div>

                        {/* Holographic Slime Preview */}
                        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-6 flex flex-col items-center justify-center relative group min-h-[160px] shadow-inner">
                          {isDiscovered ? (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                <div className="w-24 h-24 rounded-full border border-dashed border-purple-500 animate-spin" style={{ animationDuration: '20s' }} />
                              </div>
                              <div className="relative transform hover:scale-110 transition-transform duration-300">
                                <SlimeVisual slime={shapeDummySlime} size="md" />
                              </div>
                              <span className="text-[9px] font-mono text-slate-500 mt-4 uppercase tracking-widest">Morphological Bio-resonance</span>
                            </>
                          ) : (
                            <div className="text-center py-6">
                              <Lock className="w-10 h-10 text-slate-800 mx-auto mb-2" />
                              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Morphology Unidentified</span>
                              <p className="text-[9px] text-slate-600 mt-1 max-w-xs mx-auto">Breed specimens with specific vertex counts and irregularity to discover this shape.</p>
                            </div>
                          )}
                        </div>

                        {/* Analysis / Specialty / Clues */}
                        <div className="space-y-3">
                          <div className="p-3 bg-slate-950/30 border border-slate-900 rounded-lg space-y-2">
                            <span className="text-[9px] font-mono font-bold text-purple-400 block mb-1 uppercase tracking-wider">Classification</span>
                            <p className="text-xs font-mono text-slate-300 leading-relaxed capitalize font-bold">{tierLabels[target.tier] || `Tier ${target.tier}`}</p>
                          </div>

                          <div className="p-3 bg-slate-950/10 border border-slate-900 rounded-lg space-y-2.5">
                            <span className="text-[9px] font-mono font-bold text-slate-500 block mb-1 uppercase tracking-wider">Morphological Signatures</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-slate-950/40 rounded border border-slate-900 text-center font-mono">
                                <div className="text-[8px] text-slate-500">VERTEX COUNT</div>
                                <div className="text-xs font-bold text-slate-300 mt-0.5">
                                  {isDiscovered ? target.vertex_count : '???'}
                                </div>
                              </div>
                              <div className="p-2 bg-slate-950/40 rounded border border-slate-900 text-center font-mono">
                                <div className="text-[8px] text-slate-500">IRREGULARITY</div>
                                <div className="text-xs font-bold text-slate-300 mt-0.5">
                                  {isDiscovered ? `${target.irregularity_min ?? 0}-${target.irregularity_max}` : '???'}
                                </div>
                              </div>
                            </div>

                            {!isDiscovered && (
                              <div className="mt-2 pt-2 border-t border-slate-850/40 text-[10px] text-yellow-500/80 leading-normal">
                                <span className="font-bold">Target Clue:</span> Requires a specimen with{' '}
                                <span className="font-bold text-slate-200">{target.vertex_count} vertices</span>
                                {' '}and irregularity between{' '}
                                <span className="font-bold text-slate-200">{target.irregularity_min ?? 0}-{target.irregularity_max}</span>.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()
              ) : (
                (() => {
                  const pattern = selectedGene.id;
                  const isDiscovered = !!state.patternCodex?.[pattern]?.discovered;
                  const isHinted = isPatternHinted(pattern);
                  const entry = state.patternCodex?.[pattern];
                  const desc = PATTERN_DESCRIPTIONS[pattern];
                  const tier = patternTiers[pattern];
                  const cost = getRegentCost(pattern);
                  const count = state.regentInventory?.[pattern] || 0;

                  return (
                    <motion.div
                      key={`details_pattern_${pattern}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 flex flex-col justify-between space-y-5"
                    >
                      {/* Top Header */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                          <div>
                            <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider block font-bold">GENE SCAN : PATTERN_T{tier}</span>
                            <h3 className="text-sm font-bold font-mono text-white uppercase">{desc?.name || pattern} Membrane</h3>
                          </div>
                          {isDiscovered ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/20 text-emerald-400">
                              DECODED
                            </span>
                          ) : isHinted ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-950/20 text-yellow-400 animate-pulse">
                              CLUE REVEALED
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-500">
                              SECURE LOCK
                            </span>
                          )}
                        </div>

                        {/* Holographic Slime Preview */}
                        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-6 flex flex-col items-center justify-center relative group min-h-[160px] shadow-inner">
                          {isDiscovered ? (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                <div className="w-24 h-24 rounded-full border border-dashed border-cyan-500 animate-spin" style={{ animationDuration: '20s' }} />
                              </div>
                              <div className="relative transform hover:scale-110 transition-transform duration-300">
                                <SlimeVisual slime={makeDummySlime('Gray', pattern)} size="md" />
                              </div>
                              <span className="text-[9px] font-mono text-slate-500 mt-4 uppercase tracking-widest">Membrane Structural Bio-resonance</span>
                            </>
                          ) : isHinted ? (
                            <div className="text-center py-6">
                              <HelpCircle className="w-10 h-10 text-yellow-500/30 mx-auto mb-2 animate-bounce" />
                              <span className="text-[10px] font-mono text-yellow-600 font-bold uppercase tracking-wider">Evolving Membrane Strain</span>
                              <p className="text-[9px] text-slate-500 mt-1 max-w-xs mx-auto">Breed matching lower-tier patterns to mutate this structure.</p>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <Lock className="w-10 h-10 text-slate-800 mx-auto mb-2" />
                              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pattern Locked</span>
                              <p className="text-[9px] text-slate-600 mt-1 max-w-xs mx-auto">Incubate higher-tier parent structural types.</p>
                            </div>
                          )}
                        </div>

                        {/* Analysis / Specialty / Clues */}
                        <div className="space-y-3">
                          {isDiscovered ? (
                            <div className="space-y-2.5">
                              <div className="p-3 bg-slate-950/30 border border-slate-900 rounded-lg">
                                <span className="text-[9px] font-mono font-bold text-cyan-400 block mb-1 uppercase tracking-wider">Active Structural Bonus</span>
                                <p className="text-xs font-mono text-slate-300 leading-relaxed font-bold">{desc.bonus}</p>
                              </div>
                              <div className="p-3 bg-slate-950/10 border border-slate-900 rounded-lg">
                                <span className="text-[9px] font-mono font-bold text-slate-500 block mb-1 uppercase tracking-wider">Phenotypic Description</span>
                                <p className="text-xs font-mono text-slate-400 leading-relaxed">{desc.description}</p>
                              </div>
                            </div>
                          ) : isHinted ? (
                            <div className="p-3 bg-yellow-950/5 border border-yellow-900/20 rounded-lg space-y-1.5">
                              <span className="text-[9px] font-mono font-bold text-yellow-500 block uppercase tracking-wider">Mutation Clue</span>
                              <p className="text-xs font-mono text-slate-400 leading-relaxed italic">
                                "{patternClues[pattern] || 'Requires high tier parents to mutation-splice.'}"
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-lg text-center py-6">
                              <p className="text-xs font-mono text-slate-500">Secure structural locks protect this pattern. Fusing lower tiers will trigger clues.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Regent Action Block */}
                      {tier > 0 && (isDiscovered || isHinted) && (
                        <div className="pt-4 border-t border-slate-850 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500 uppercase">Membrane Regent Supply</span>
                            <span className="text-cyan-400 font-bold">{count} unspent</span>
                          </div>
                          <button
                            onClick={() => onBuyRegent(pattern)}
                            disabled={state.credits < cost}
                            className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider border flex items-center justify-center space-x-2 transition-all ${
                              state.credits >= cost
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 border-yellow-500 cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Synthesize Regent — {cost} Cr</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })()
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
