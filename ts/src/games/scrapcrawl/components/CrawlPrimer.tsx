import { Compass, Dices, ShieldAlert, Wrench, Sparkles } from 'lucide-react';

/**
 * ScrapCrawl — First-Run Crawl Primer
 * One-screen onboarding card fired through the shared OnboardingGate
 * (boolean mode) the first time a new game is started. Covers node
 * traversal, D20 combat, equipment wear, and the workbench loop.
 */

interface CrawlPrimerProps {
  onBegin: () => void;
}

const PRIMER_LINES: { icon: React.ComponentType<{ size?: number | string; className?: string }>; cls: string; text: string }[] = [
  {
    icon: Compass,
    cls: 'sc-step--accent',
    text: 'Explore — move between connected nodes on the World Graph. Red nodes hold hostiles; the workbench sits at Home Base.',
  },
  {
    icon: Dices,
    cls: 'sc-step--red',
    text: 'Scavenge — combat rolls a D20 plus your weapon attack against the node difficulty. Wins pay scrap and weapon proficiency.',
  },
  {
    icon: ShieldAlert,
    cls: 'sc-step--red',
    text: 'Survive — every fight wears your weapon down. At zero life it breaks and you fall back to the unarmed baseline.',
  },
  {
    icon: Wrench,
    cls: 'sc-step--amber',
    text: 'Craft — spend scrap at the Home Base workbench on disposable gear. Craft the Tool once to unlock Tier 2 equipment.',
  },
];

export default function CrawlPrimer({ onBegin }: CrawlPrimerProps) {
  return (
    <div className="sc-primer-wrap" data-testid="sc-crawl-primer">
      <div className="sc-primer-card">
        <div className="sc-primer-header">
          <span className="sc-primer-badge">
            <Sparkles size={12} /> Field Primer
          </span>
          <h2 className="sc-primer-title">First Crawl Briefing</h2>
          <p className="sc-primer-sub">Four things that keep a scavenger running</p>
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
          Enter the Crawl
        </button>
      </div>
    </div>
  );
}
