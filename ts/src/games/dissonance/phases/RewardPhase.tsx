import { Heart, Layers, Gem, Sparkles, ArrowRight } from 'lucide-react';
import { Button, Card } from '../../../ui/components';
import type { RewardSlot } from '../types';

interface RewardPhaseProps {
  slots: RewardSlot[];
  onClaimAll: () => void;
}

const SLOT_ICON: Record<RewardSlot['kind'], typeof Heart> = {
  heal: Heart,
  card: Layers,
  benefit: Sparkles,
  relic: Gem,
};

function slotLabel(slot: RewardSlot): string {
  switch (slot.kind) {
    case 'heal':
      return `+${slot.amount} HP`;
    case 'card':
      return `Card: ${slot.cardId}`;
    case 'benefit':
      return `Boon: ${slot.boonId}`;
    case 'relic':
      return `Relic: ${slot.relicId}`;
  }
}

export default function RewardPhase({ slots, onClaimAll }: RewardPhaseProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-6)',
        maxWidth: '768px',
        margin: 'var(--space-6) auto',
        padding: 'var(--space-8)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
      }}
      id="viewport-reward-phase"
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
        Victory — Claim Rewards
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--space-4)',
          width: '100%',
        }}
      >
        {slots.map((slot, i) => {
          const Icon = SLOT_ICON[slot.kind];
          return (
            <Card
              key={i}
              className="reward-slot"
              id={`reward-slot-${i}`}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <Icon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--amber)' }} />
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text)' }}>
                  {slotLabel(slot)}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <Button
        id="reward-claim-all-btn"
        label="Claim All — Return to Map"
        icon={<ArrowRight style={{ width: '1rem', height: '1rem' }} />}
        onClick={onClaimAll}
        variant="primary"
        size="lg"
        className="reward-claim-all-btn"
      />
    </div>
  );
}
