import { Gem, Coins, ArrowRight } from 'lucide-react';
import { Button, Card } from '../../../ui/components';
import type { RunState, TreasureOffer } from '../types';

interface TreasurePhaseProps {
  run: RunState;
  onChoice: (choice: 'essence' | 'relic') => void;
  onLeave: () => void;
}

export default function TreasurePhase({ run, onChoice, onLeave }: TreasurePhaseProps) {
  const offer: TreasureOffer = run.currentTreasure ?? { essence: 30, relicId: null };
  const hasRelic = !!offer.relicId;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-6)',
        maxWidth: '576px',
        margin: 'var(--space-6) auto',
        padding: 'var(--space-8)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        textAlign: 'center',
      }}
      id="viewport-treasure-phase"
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--font-size-xl)',
          fontWeight: 400,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          margin: 0,
          color: 'var(--text)',
        }}
      >
        Treasure Cache
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
        The room hums with stabilized resonance. Choose one reward.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          width: '100%',
        }}
      >
        <Card id="treasure-essence-btn" onClick={() => onChoice('essence')} className="treasure-option">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Coins style={{ width: '1.5rem', height: '1.5rem', color: 'var(--amber)' }} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text)' }}>
              Take {offer.essence} Essence
            </span>
          </div>
        </Card>

        <Card
          id="treasure-relic-btn"
          onClick={() => onChoice('relic')}
          className="treasure-option"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              opacity: hasRelic ? 1 : 0.3,
              pointerEvents: hasRelic ? 'auto' : 'none',
            }}
          >
            <Gem style={{ width: '1.5rem', height: '1.5rem', color: 'var(--accent)' }} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text)' }}>
              {hasRelic ? `Claim Relic: ${offer.relicId}` : 'No relic remains'}
            </span>
          </div>
        </Card>
      </div>

      <Button
        id="treasure-leave-btn"
        label="Leave Cache — Return to Map"
        icon={<ArrowRight style={{ width: '1rem', height: '1rem' }} />}
        onClick={onLeave}
        variant="neutral"
        size="sm"
      />
    </div>
  );
}
