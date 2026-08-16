import { useState } from 'react';
import { ChevronRight, AlertTriangle, Compass, Crown } from 'lucide-react';
import { HOUSE_DESCRIPTIONS } from '../flavorText';
import type { CultureId } from '../types';

/**
 * Opening Sequence for Planet of Greed.
 *
 * Fires ONLY on a genuinely new game, never on a resumed/returning
 * session. Matches KingMaker's confirmed mechanism: a boolean flag
 * set by the new-game handler, cleared by the continue handler.
 *
 * 4 beats, following Dissonance/KingMaker's real pacing:
 *   1. The Ore — what Genesis Ore is, why the Houses are racing
 *   2. The Wheel — the six Houses and their relationships to the Ore
 *   3. The Rival — the wheel-locked rival placement (informed choice)
 *   4. The Stakes — what happens when the Engine fires
 *
 * Beat count justification: KingMaker uses 5 beats (text, camera zoom,
 * cast intro, return, goal). Dissonance uses a single opening pack
 * screen. PoG needs 4 because the player needs to understand three
 * distinct things before an informed House choice: the Ore (what
 * they're fighting over), the Houses (who they're choosing between),
 * and the stakes (what winning actually means). The rival placement
 * is a sub-beat of the House introduction — it's the reason the choice
 * matters mechanically, not a separate concept.
 *
 * Content is grounded in locked Design.md v0.2 narrative and the
 * flavor text from the prior directive. No new invention.
 */
export type OpeningBeat = 'ore' | 'wheel' | 'rival' | 'stakes';

interface OpeningSequenceProps {
  onComplete: () => void;
}

const BEAT_ORDER: OpeningBeat[] = ['ore', 'wheel', 'rival', 'stakes'];

const BEAT_LABELS: Record<OpeningBeat, string> = {
  ore: 'The Ore',
  wheel: 'The Houses',
  rival: 'The Rival',
  stakes: 'The Stakes',
};

export default function OpeningSequence({ onComplete }: OpeningSequenceProps) {
  const [beat, setBeat] = useState<OpeningBeat>('ore');
  const beatIndex = BEAT_ORDER.indexOf(beat);

  const handleNext = () => {
    if (beatIndex < BEAT_ORDER.length - 1) {
      setBeat(BEAT_ORDER[beatIndex + 1]);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (beatIndex > 0) {
      setBeat(BEAT_ORDER[beatIndex - 1]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0f0f1a] text-amber-50 flex flex-col items-center justify-center overflow-y-auto p-4 md:p-8 font-sans select-none relative"
      data-testid="pog-opening-sequence"
    >
      {/* Skip button — always available, matches KingMaker's pattern */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2 bg-[#1a1a2e] hover:bg-[#252544] text-amber-400 hover:text-amber-300 border border-amber-600/30 text-xs font-mono font-bold transition"
        data-testid="pog-skip-opening"
      >
        <span>Skip Intro</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <div className="max-w-2xl w-full">
        {/* Beat 1: The Ore */}
        {beat === 'ore' && (
          <div
            className="bg-[#1a1a2e] border border-amber-600/40 p-6 md:p-10 space-y-6 animate-fade-in"
            data-testid="pog-opening-beat-ore"
          >
            <div className="flex items-center gap-3 border-b border-amber-700/30 pb-4">
              <Crown className="w-6 h-6 text-amber-400" />
              <h1 className="text-lg md:text-xl font-serif text-amber-300 font-bold tracking-wider uppercase">
                Genesis Ore
              </h1>
            </div>
            <div className="space-y-4 text-sm md:text-base text-amber-100/80 leading-relaxed font-serif">
              <p>
                They call it Genesis Ore. It runs in veins through the planet's crust like something was planted there, waiting. Nobody fully understands what it is. The geologists have models. The believers have prayers. The financiers have projections.
              </p>
              <p>
                What everyone agrees on: the Ore is power. Not the kind that runs a generator — the kind that could complete the Seed Engine, a device none of them have built yet but all of them are building toward. Whoever finishes first wins. What they win is less clear.
              </p>
              <p className="text-amber-300/60 italic">
                Your communications officer notes a persistent signal anomaly in the background telemetry. It has been there since landing. Nobody can explain it.
              </p>
            </div>
          </div>
        )}

        {/* Beat 2: The Houses */}
        {beat === 'wheel' && (
          <div
            className="bg-[#1a1a2e] border border-amber-600/40 p-6 md:p-10 space-y-6 animate-fade-in"
            data-testid="pog-opening-beat-wheel"
          >
            <div className="flex items-center gap-3 border-b border-amber-700/30 pb-4">
              <Compass className="w-6 h-6 text-amber-400" />
              <h1 className="text-lg md:text-xl font-serif text-amber-300 font-bold tracking-wider uppercase">
                The Six Houses
              </h1>
            </div>
            <div className="space-y-3 text-sm text-amber-100/80 leading-relaxed">
              <p className="font-serif italic text-amber-100/60">
                Six Houses. Six relationships to the Ore. Your choice determines your rival — and your fate.
              </p>
              {(Object.entries(HOUSE_DESCRIPTIONS) as [CultureId, string][]).map(([id, desc]) => (
                <div key={id} className="border-l-2 border-amber-600/40 pl-3">
                  <span className="font-bold text-amber-300 uppercase text-xs tracking-wide">{id}</span>
                  <p className="text-xs text-amber-100/70 font-serif italic mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beat 3: The Rival */}
        {beat === 'rival' && (
          <div
            className="bg-[#1a1a2e] border border-amber-600/40 p-6 md:p-10 space-y-6 animate-fade-in"
            data-testid="pog-opening-beat-rival"
          >
            <div className="flex items-center gap-3 border-b border-amber-700/30 pb-4">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <h1 className="text-lg md:text-xl font-serif text-amber-300 font-bold tracking-wider uppercase">
                The Wheel Is Fate
              </h1>
            </div>
            <div className="space-y-4 text-sm md:text-base text-amber-100/80 leading-relaxed font-serif">
              <p>
                The six Houses sit on a wheel. Ember opposite Tundra. Marsh opposite Crystal. Gale opposite Tide. This is not a suggestion — it is a lock.
              </p>
              <p>
                The moment you pick a House, your hardest rival is placed as far from you as the map allows. Not randomly. By design. The same rivalry, every playthrough. You start ranked last. Climbing means either outgrowing everyone, or walking straight at the House above you and taking their rank by force.
              </p>
              <p className="text-amber-300/80 font-bold">
                Choose carefully. Your rival is not a surprise — it is a consequence.
              </p>
            </div>
          </div>
        )}

        {/* Beat 4: The Stakes */}
        {beat === 'stakes' && (
          <div
            className="bg-[#1a1a2e] border border-amber-600/40 p-6 md:p-10 space-y-6 animate-fade-in"
            data-testid="pog-opening-beat-stakes"
          >
            <div className="flex items-center gap-3 border-b border-amber-700/30 pb-4">
              <Crown className="w-6 h-6 text-amber-400" />
              <h1 className="text-lg md:text-xl font-serif text-amber-300 font-bold tracking-wider uppercase">
                What Winning Means
              </h1>
            </div>
            <div className="space-y-4 text-sm md:text-base text-amber-100/80 leading-relaxed font-serif">
              <p>
                Every rival you eliminate doesn't just fall off the map. You inherit what they built toward the Engine — their Fragments, their research, their piece of the thing that wakes up when the Engine fires.
              </p>
              <p>
                Reaching Rank 1 doesn't end the game quietly. It completes the Engine. It fires. And the thing that wakes up afterward puts humanity under arrest — starting with you.
              </p>
              <p className="text-amber-300/60 italic">
                You already know how this ends. The game never gives you a way to stop.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <span className="text-xs text-amber-100/40 font-mono">
            Beat {beatIndex + 1} of {BEAT_ORDER.length} — {BEAT_LABELS[beat]}
          </span>
          <div className="flex items-center gap-3">
            {beatIndex > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 bg-transparent border border-amber-700/40 text-amber-200 hover:bg-amber-950/30 font-bold text-xs font-mono uppercase tracking-wider transition cursor-pointer"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-[#1a1a2e] font-bold text-xs font-mono uppercase tracking-wider transition cursor-pointer border border-amber-400"
              data-testid="pog-opening-next"
            >
              {beatIndex < BEAT_ORDER.length - 1 ? 'Continue' : 'Choose Your House'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
