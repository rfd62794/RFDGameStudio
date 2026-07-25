import { useState } from 'react';
import { Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import { Button, Card, Badge } from '../../../ui/components';
import type { OpeningPackItem } from '../types';

interface OpeningPhaseProps {
  pack: OpeningPackItem[];
  onComplete: () => void;
}

export default function OpeningPhase({ pack, onComplete }: OpeningPhaseProps) {
  const [flippedCount, setFlippedCount] = useState(0);

  const flipNext = () => {
    if (flippedCount < pack.length) setFlippedCount((prev) => prev + 1);
  };

  const allFlipped = flippedCount >= pack.length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-8)',
        maxWidth: '896px',
        margin: 'var(--space-6) auto',
        padding: 'var(--space-8)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        textAlign: 'center',
      }}
      id="viewport-opening-phase"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Badge label="ECHO Core Initialization — First Pack Reveal" variant="amber" />
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
          Resonance Capsule Opening
        </h2>
      </div>

      {!allFlipped && (
        <Button
          id="opening-flip-next-btn"
          label={`Flip Top Card (${flippedCount + 1}/${pack.length})`}
          icon={<Sparkles style={{ width: '1rem', height: '1rem' }} />}
          onClick={flipNext}
          variant="primary"
        />
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 'var(--space-4)',
          width: '100%',
        }}
      >
        {pack.map((item, idx) => {
          const isFlipped = idx < flippedCount;
          return (
            <Card
              key={item.action}
              id={`opening-hand-card-${item.action}`}
              className="opening-hand-card"
              onClick={isFlipped ? undefined : flipNext}
            >
              <div
                style={{
                  minHeight: '12rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  opacity: isFlipped ? 1 : 0.5,
                  transition: 'opacity 0.3s',
                }}
              >
                {!isFlipped ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-2)' }}>
                    <HelpCircle style={{ width: '1.5rem', height: '1.5rem', color: 'var(--text-muted)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Slot {idx + 1} Empty
                    </span>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--font-size-xs)',
                        textTransform: 'capitalize',
                        color: 'var(--text)',
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{item.element}</span>
                      <Badge label={item.action} variant="amber" />
                    </div>
                    <h3
                      style={{
                        fontSize: 'var(--font-size-md)',
                        fontWeight: 700,
                        color: 'var(--text)',
                        textAlign: 'center',
                        margin: 'auto 0',
                      }}
                    >
                      {item.name}
                    </h3>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {allFlipped && (
        <Button
          id="opening-continue-btn"
          label="Begin Run — Enter Floor 1 Map"
          icon={<ArrowRight style={{ width: '1rem', height: '1rem' }} />}
          onClick={onComplete}
          variant="primary"
          size="lg"
        />
      )}
    </div>
  );
}
