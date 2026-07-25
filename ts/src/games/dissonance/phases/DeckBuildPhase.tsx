import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button, Card } from '../../../ui/components';

interface CardInfo {
  id: string;
  name: string;
  el1: string;
  el2: string | null;
  component: string;
  relationType: string;
}

interface DeckBuildPhaseProps {
  unlockedCardIds: string[];
  cardPool: CardInfo[];
  deckSize: number;
  onConfirm: (selectedIds: string[]) => void;
}

export default function DeckBuildPhase({ unlockedCardIds, cardPool, deckSize, onConfirm }: DeckBuildPhaseProps) {
  const [selected, setSelected] = useState<string[]>(unlockedCardIds.slice(0, deckSize));
  const byId = new Map(cardPool.map((c) => [c.id, c]));

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= deckSize) return prev;
      return [...prev, id];
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-6)',
        maxWidth: '896px',
        margin: 'var(--space-6) auto',
        padding: 'var(--space-8)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        textAlign: 'center',
      }}
      id="viewport-deck-build-phase"
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 400,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          margin: 0,
          color: 'var(--text)',
        }}
      >
        Build Your Deck
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
        Select up to {deckSize} cards from your unlocked pool ({selected.length}/{deckSize} selected)
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 'var(--space-3)',
          width: '100%',
          maxHeight: '24rem',
          overflowY: 'auto',
          padding: 'var(--space-1)',
        }}
      >
        {unlockedCardIds.map((id) => {
          const card = byId.get(id);
          const isSelected = selected.includes(id);
          return (
            <Card
              key={id}
              id={`deck-build-card-${id}`}
              onClick={() => toggle(id)}
              className="deck-build-card"
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', textAlign: 'left' }}>
                {isSelected && (
                  <CheckCircle2
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '0.875rem',
                      height: '0.875rem',
                      color: 'var(--amber)',
                    }}
                  />
                )}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {card?.component ?? id}
                </span>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text)' }}>
                  {card?.name ?? id}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <Button
        id="deck-build-confirm-btn"
        label="Confirm Deck — Begin Run"
        icon={<ArrowRight style={{ width: '1rem', height: '1rem' }} />}
        onClick={() => onConfirm(selected)}
        variant="primary"
        size="lg"
        disabled={selected.length === 0}
      />
    </div>
  );
}
