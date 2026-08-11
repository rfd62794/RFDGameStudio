import { Sparkles, Coins, ArrowRight } from 'lucide-react';
import { Button, Card } from '../../../ui/components';
import type { RunState, StoreSlot } from '../types';

interface StorePhaseProps {
  run: RunState;
  onPurchase: (index: number) => void;
  onLeave: () => void;
}

export default function StorePhase({ run, onPurchase, onLeave }: StorePhaseProps) {
  const slots: StoreSlot[] = run.currentStoreSlots ?? [];
  const essence = run.essence ?? 0;

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
        textAlign: 'center',
      }}
      id="viewport-store-phase"
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
        Resonance Exchange
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
        Essence: {essence}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--space-4)',
          width: '100%',
        }}
      >
        {slots.map((slot, i) => {
          const canAfford = essence >= slot.price;
          return (
            <Card
              key={slot.boonId}
              id={`store-slot-${i}`}
              onClick={() => canAfford && onPurchase(i)}
              className="store-option"
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  opacity: canAfford ? 1 : 0.4,
                  pointerEvents: canAfford ? 'auto' : 'none',
                }}
              >
                <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: 'var(--accent)' }} />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text)' }}>
                  {slot.name ?? slot.boonId}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--amber)' }}>
                  <Coins style={{ width: '0.75rem', height: '0.75rem', display: 'inline' }} /> {slot.price} Essence
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {slot.description}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {slots.length === 0 && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          The exchange is empty this visit.
        </p>
      )}

      <Button
        id="store-leave-btn"
        label="Leave Store — Return to Map"
        icon={<ArrowRight style={{ width: '1rem', height: '1rem' }} />}
        onClick={onLeave}
        variant="neutral"
        size="sm"
      />
    </div>
  );
}
