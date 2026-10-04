import React, { useState } from 'react';
import { UnitState, TerritoryCell } from '../types';
import {
  OPENING_TEXT,
  OPENING_GOAL,
  STAGING_TEXT_CAST_INTRO,
} from '../data/openingText';
import { CAST_INTRO_TEMPLATES, getArchetypeClassTitle } from '../data/castIntroTemplates';
import { Crown, ChevronRight, MapPin, Shield, User, Sparkles } from 'lucide-react';
import { HOVEL_NAME } from '../data/worldGeometry';
import { TerritoryScreen } from './TerritoryScreen';

export type OpeningBeat = 'text' | 'cameraZoom' | 'castIntro' | 'return';

interface OpeningSequenceProps {
  startingUnits: UnitState[];
  cells: TerritoryCell[];
  onComplete: () => void;
}

export function OpeningSequence({
  startingUnits,
  cells,
  onComplete,
}: OpeningSequenceProps) {
  const [beat, setBeat] = useState<OpeningBeat>('text');
  const [castIndex, setCastIndex] = useState(0);

  // Identify Hovel / Player Capital Cell
  const hovelCell = cells.find((c) => c.owner === 'player' && (c.type === 'capital' || c.id === 'cell_capital')) || cells[0];

  const handleNextCastUnit = () => {
    if (castIndex < startingUnits.length - 1) {
      setCastIndex(castIndex + 1);
    } else {
      setBeat('return');
    }
  };

  const currentUnit = startingUnits[castIndex] || startingUnits[0];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center overflow-y-auto p-4 md:p-8 font-sans select-none relative">
      {/* Global Skip Intro button to flow directly into Game Flow */}
      <button
        data-testid="skip-intro-button"
        onClick={onComplete}
        className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition shadow-lg backdrop-blur-md"
      >
        <span>Skip Intro & Enter Game</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Beat 1: Full-Screen Narrative Text */}
      {beat === 'text' && (
        <div className="max-w-2xl w-full bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-6 md:p-10 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
            <Crown className="w-6 h-6 text-amber-400" />
            <h1 className="text-lg md:text-xl font-serif text-amber-300 font-bold tracking-wider uppercase">
              The Fall & The Cradle
            </h1>
          </div>

          <div className="space-y-4 text-sm md:text-base text-zinc-300 leading-relaxed font-serif whitespace-pre-line">
            {OPENING_TEXT}
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-zinc-800/80">
            <span className="text-xs text-zinc-500 font-mono">Step 1 of 3</span>
            <button
              data-testid="inspect-sanctuary-button"
              onClick={() => setBeat('cameraZoom')}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/20 text-sm"
            >
              <MapPin className="w-4 h-4" />
              <span>Inspect Sanctuary</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Beat 2: Sanctuary Inspection & Map Zoom */}
      {beat === 'cameraZoom' && (
        <div className="w-full max-w-5xl bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative flex flex-col items-center space-y-6 animate-fadeIn">
          <div className="w-full flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span className="font-mono text-amber-400 font-bold uppercase tracking-wider text-xs md:text-sm">
                Sanctuary Inspection: {hovelCell ? hovelCell.name : HOVEL_NAME}
              </span>
            </div>
            <span className="text-xs text-amber-400/90 font-mono bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Seat of the Dynasty
            </span>
          </div>

          {/* Map canvas container focused on Sanctuary */}
          <div className="w-full overflow-hidden rounded-xl border border-amber-500/40 bg-zinc-950 shadow-2xl transition-all duration-700">
            <TerritoryScreen
              cells={cells}
              selectedCellId={hovelCell?.id || null}
              gold={12}
              squadUnits={[]}
              kingUnit={null}
              kingSettlingTurns={0}
              onSelectCell={() => {}}
              onScoutCell={() => {}}
              onBackToShop={() => {}}
            />
          </div>

          <div className="flex items-center justify-between w-full pt-2">
            <div className="text-xs text-zinc-400 font-serif italic">
              Focusing on the seat of your remaining followers in {hovelCell ? hovelCell.name : 'The Hovel'}.
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onComplete}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition text-xs border border-zinc-700"
              >
                Begin Campaign
              </button>
              <button
                onClick={() => setBeat('castIntro')}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition text-xs shadow-lg shadow-amber-500/20"
              >
                <span>Meet Companions</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beat 3: Cast Intro Cards */}
      {beat === 'castIntro' && currentUnit && (
        <div className="max-w-xl w-full bg-zinc-900/90 border border-amber-500/40 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-fadeIn">
          <div className="space-y-1 border-b border-zinc-800 pb-4">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{STAGING_TEXT_CAST_INTRO}</span>
            </div>
            <div className="text-xs text-zinc-400">
              Companion {castIndex + 1} of {startingUnits.length}
            </div>
          </div>

          {/* Companion Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <h2 className="text-lg font-bold text-amber-300 font-serif">{currentUnit.name}</h2>
                <div className="text-xs font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span className="text-amber-400/90 font-semibold">
                    {getArchetypeClassTitle(currentUnit.archetype)} ({currentUnit.archetype.toUpperCase()})
                  </span>
                  <span>•</span>
                  <span className="capitalize">{currentUnit.rank}</span>
                  <span>•</span>
                  <span className="capitalize text-zinc-300">{currentUnit.zodiac}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400">
                <User className="w-5 h-5" />
              </div>
            </div>

            <div className="text-sm font-serif italic text-zinc-300 leading-relaxed bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/60">
              "{CAST_INTRO_TEMPLATES[currentUnit.archetype]}"
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => castIndex > 0 && setCastIndex(castIndex - 1)}
              disabled={castIndex === 0}
              className={`text-xs font-mono px-3 py-2 rounded-lg border border-zinc-800 transition ${
                castIndex === 0 ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              ← Previous
            </button>

            <button
              onClick={handleNextCastUnit}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition text-xs shadow-lg shadow-amber-500/20"
            >
              <span>{castIndex < startingUnits.length - 1 ? 'Next Companion' : 'Complete Roster Review'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Beat 4: Return to Map & Goal Handoff */}
      {beat === 'return' && (
        <div className="w-full max-w-4xl bg-zinc-900/90 border border-amber-500/50 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col items-center space-y-6 text-center animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Crown className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-serif text-amber-300 font-bold tracking-wide uppercase">
              {OPENING_GOAL}
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg font-serif">
              The crown was stolen in blood and chaos, but your campaign to reclaim the realm begins now in {HOVEL_NAME}.
            </p>
          </div>

          <div className="pt-4">
            <button
              data-testid="begin-campaign-button"
              onClick={onComplete}
              className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition text-sm shadow-xl shadow-amber-500/30 font-mono tracking-wider uppercase"
            >
              <Shield className="w-4 h-4" />
              <span>Begin Campaign</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

