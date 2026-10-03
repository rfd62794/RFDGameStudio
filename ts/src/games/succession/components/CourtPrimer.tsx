import React from 'react';
import { Crown, Scroll } from 'lucide-react';

interface CourtPrimerProps {
  onComplete: () => void;
}

/**
 * First-run court primer — the shared OnboardingGate's modal surface
 * for Succession (ADR-007: the screen shows the five mechanical
 * commitments new players get wrong up front; the per-move contextual
 * first-use tips from ADR-005 still fire on first real use in play).
 *
 * `useOnboardingGate` (boolean mode) owns the display flag for the
 * session; App writes the `<game>_tutorial_seen` save on completion so
 * it never re-fires on later visits — the same pattern as
 * scrapcrawl's CrawlPrimer and slither_rogue's TutorialPrimer.
 */
const CourtPrimer: React.FC<CourtPrimerProps> = ({ onComplete }) => (
  <dialog
    id="succession-court-primer"
    data-testid="succession-court-primer"
    open
    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-sm w-full h-full m-0 max-w-none max-h-none border-none"
    aria-label="Court primer — how to win the succession"
  >
    <div className="max-w-md w-full bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
      <div className="text-center mb-5">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-950/60 border border-amber-800/50 flex items-center justify-center mb-3">
          <Crown className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-amber-400 tracking-wide">
          The Court Primer
        </h2>
        <p className="text-xs text-stone-500 font-serif italic mt-1">
          Eight bells. Three votes. One throne.
        </p>
      </div>

      <ul className="space-y-3 text-xs text-stone-300 leading-relaxed mb-6">
        <li>
          <strong className="text-amber-300">Three councilors, three tastes.</strong>{' '}
          Each values one approach above the rest — whispers, open appeal, or
          archival proof. Their dossier shows which; other approaches still
          work, but at a fraction of the favor.
        </li>
        <li>
          <strong className="text-amber-300">Whispers plant claims.</strong>{' '}
          The rivals whisper too, and the court listens — claim something a
          known whisper contradicts and you are exposed.
        </li>
        <li>
          <strong className="text-amber-300">Evidence must be scouted.</strong>{' '}
          Scout the palace archives, then present each discovery to the
          councilor it actually concerns.
        </li>
        <li>
          <strong className="text-amber-300">The King's murder has a culprit.</strong>{' '}
          Gather the suspect, the method, and the motive — indict before the
          final bell.
        </li>
        <li>
          <strong className="text-amber-300">The verdict is a race.</strong>{' '}
          Discredit a rival or release a hostile vote to win a close count.
        </li>
      </ul>

      <button
        type="button"
        id="succession-primer-complete-button"
        data-testid="succession-primer-complete"
        onClick={onComplete}
        className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-sm tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2"
      >
        <Scroll className="w-4 h-4" />
        Take Your Seat
      </button>
    </div>
  </dialog>
);

export default CourtPrimer;
