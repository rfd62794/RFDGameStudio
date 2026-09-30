import { ArrowLeftRight, ChevronsDown, Coins, Layers, Pocket, Sparkles } from 'lucide-react';

/**
 * SlimeCoin — First-Run Pusher Primer
 * One-screen onboarding card fired through the shared OnboardingGate
 * (boolean mode) the first time a run is launched. Covers firing, the
 * two-layer board, vat scoring, the card shop, and pocket coins.
 */

interface CoinPrimerProps {
  onBegin: () => void;
}

const PRIMER_LINES: { icon: React.ComponentType<{ size?: number | string; className?: string }>; cls: string; text: string }[] = [
  {
    icon: ArrowLeftRight,
    cls: 'sc-step--accent',
    text: 'Fire — ← launches a coin from the right-side shooter, → from the left. Each shot spends one coin from your Hand.',
  },
  {
    icon: ChevronsDown,
    cls: 'sc-step--purple',
    text: 'Ride — the pusher sweeps the upper shelf; coins slide forward, drop to the lower floor, then off the edge into the vat.',
  },
  {
    icon: Coins,
    cls: 'sc-step--green',
    text: 'Score — only coins that reach the vat pay out score and tokens. Collect in quick succession to build combo and raise the ×rate.',
  },
  {
    icon: Layers,
    cls: 'sc-step--accent',
    text: 'Round end — an empty Hand opens the chip shop: pick 1 of 3 cards, then the next round starts at a higher target. 15 rounds per run.',
  },
  {
    icon: Pocket,
    cls: 'sc-step--purple',
    text: 'Pocket — press P to load special coins like Boom or Pull. An empty Hand can be refilled by exchanging tokens, up to 3× per round.',
  },
];

export default function CoinPrimer({ onBegin }: CoinPrimerProps) {
  return (
    <div className="sc-primer-wrap" data-testid="sc-coin-primer">
      <div className="sc-primer-card">
        <div className="sc-primer-header">
          <span className="sc-primer-badge">
            <Sparkles size={12} /> Field Primer
          </span>
          <h2 className="sc-primer-title">First Run Briefing</h2>
          <p className="sc-primer-sub">Five things that keep a pusher paying</p>
        </div>

        <ul className="sc-primer-list">
          {PRIMER_LINES.map(({ icon: Icon, cls, text }) => (
            <li key={text} className="sc-primer-item">
              <span className={`sc-step ${cls}`}>
                <Icon size={14} />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <button className="sc-primer-begin" data-testid="sc-primer-begin" onClick={onBegin}>
          Start Dropping
        </button>
      </div>
    </div>
  );
}
