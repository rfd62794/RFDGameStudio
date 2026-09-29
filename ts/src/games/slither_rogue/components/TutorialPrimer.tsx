import { MousePointer, Cherry, ShieldAlert, Sparkles, Clock } from 'lucide-react';

/**
 * Slither Rogue — First-Run Field Primer
 * One-screen onboarding card fired through the shared OnboardingGate
 * (boolean mode) the first time a run is launched. Covers movement,
 * growth, joint theft, evolution, and the run clock.
 */

interface TutorialPrimerProps {
  onBegin: () => void;
}

const PRIMER_LINES: { icon: React.ComponentType<{ className?: string }>; cls: string; text: string }[] = [
  {
    icon: MousePointer,
    cls: 'sr-step--amber',
    text: 'Move — your snake follows the mouse (or WASD / arrow keys). Glide toward the glowing fruit.',
  },
  {
    icon: Cherry,
    cls: 'sr-step--purple',
    text: 'Grow — every fruit adds body segments and score. Golden fruit are worth several times more.',
  },
  {
    icon: ShieldAlert,
    cls: 'sr-step--rose',
    text: 'Joint exposure — an enemy head that touches your joints steals everything behind it. Guard your flanks and aim your head at theirs.',
  },
  {
    icon: Sparkles,
    cls: 'sr-step--amber',
    text: 'Evolve — every few fruits the run pauses and you pick 1 of 3 DNA mutations. They stack until the clock runs out.',
  },
  {
    icon: Clock,
    cls: 'sr-step--purple',
    text: 'The clock — when the timer empties the run ends and your genome is rated. Long body, high score, better grade.',
  },
];

export default function TutorialPrimer({ onBegin }: TutorialPrimerProps) {
  return (
    <div className="sr-primer-wrap" data-testid="sr-tutorial-primer">
      <div className="sr-primer-card">
        <div className="sr-primer-header">
          <span className="sr-menu-badge">
            <Sparkles className="sr-icon-sm" /> Field Primer
          </span>
          <h2 className="sr-primer-title">First Run Briefing</h2>
          <p className="sr-primer-sub">Five things that keep a slitherer alive</p>
        </div>

        <ul className="sr-primer-list">
          {PRIMER_LINES.map(({ icon: Icon, cls, text }) => (
            <li key={text} className="sr-primer-item">
              <span className={`sr-step ${cls}`}>
                <Icon className="sr-icon-xs" />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <button className="sr-launch-btn" data-testid="sr-primer-begin" onClick={onBegin}>
          Begin the Run
        </button>
      </div>
    </div>
  );
}
