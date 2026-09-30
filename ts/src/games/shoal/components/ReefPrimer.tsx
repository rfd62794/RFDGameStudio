import { Sprout, Fish, Swords, Scissors } from 'lucide-react';

/**
 * Shoal — First-Run Reef Primer
 * One-screen onboarding card fired through the shared OnboardingGate
 * (boolean mode) the first time a reef is started, and again on demand
 * from the title screen's How to Play entry. Covers the real loop:
 * drop food, seed life, shark pressure, cull.
 */

interface ReefPrimerProps {
  onBegin: () => void;
}

const PRIMER_LINES: { icon: React.ComponentType<{ size?: number | string; className?: string }>; text: string }[] = [
  {
    icon: Sprout,
    text: 'Drop food — Spawn Algae plants a hub wherever you click. Fish graze its nodules, and fed, grown fish breed.',
  },
  {
    icon: Fish,
    text: 'Seed life — Spawn Fish adds to the school; Spawn Shark drops a hunter into the water column.',
  },
  {
    icon: Swords,
    text: 'Shark pressure thins the school — every kill bursts into flesh chunks that sharks scavenge and the reef recycles.',
  },
  {
    icon: Scissors,
    text: 'Cull removes whatever you click — fish, sharks, nodules. Deep water is cold; creatures pay for staying down there.',
  },
];

export default function ReefPrimer({ onBegin }: ReefPrimerProps) {
  return (
    <div className="shoal-primer-overlay" data-testid="shoal-reef-primer">
      <div className="shoal-primer-card">
        <span className="shoal-primer-badge">First Reef Briefing</span>
        <h2 className="shoal-primer-title">How to Play</h2>
        <p className="shoal-primer-sub">You tend the column — the reef runs itself.</p>
        <ul className="shoal-primer-list">
          {PRIMER_LINES.map(({ icon: Icon, text }) => (
            <li key={text} className="shoal-primer-item">
              <Icon size={14} className="shoal-primer-icon" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <button
          id="shoal-primer-begin"
          className="shoal-primer-begin"
          data-testid="shoal-primer-begin"
          onClick={onBegin}
        >
          Watch the Reef
        </button>
      </div>
    </div>
  );
}
