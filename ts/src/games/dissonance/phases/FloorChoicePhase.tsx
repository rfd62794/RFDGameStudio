import { Lock, ArrowRight } from 'lucide-react';
import { Card } from '../../../ui/components';

interface FloorFlavor {
  name: string;
  description: string;
}

interface FloorChoicePhaseProps {
  floorFlavor: Record<string, FloorFlavor>;
  onChoose: (floor: number) => void;
}

// Only Floor 1 is selectable for real: floors 2-5 are gated in data.yaml by
// minRoster/maxDeckSize thresholds against a meta-progression roster system
// that was never ported (no BankedEssence/roster state exists yet). Showing
// them as clickable would be fake gating, so they are honestly locked.
export default function FloorChoicePhase({ floorFlavor, onChoose }: FloorChoicePhaseProps) {
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
      id="viewport-floor-choice-phase"
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
        Select Descent Floor
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          width: '100%',
        }}
      >
        {[1, 2, 3, 4, 5].map((floor) => {
          const flavor = floorFlavor[String(floor)];
          const locked = floor !== 1;
          return (
            <Card
              key={floor}
              id={`floor-choice-${floor}`}
              onClick={locked ? undefined : () => onChoose(floor)}
              className="floor-choice-card"
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-1)',
                  textAlign: 'left',
                  opacity: locked ? 0.5 : 1,
                  pointerEvents: locked ? 'none' : 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--font-size-xs)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--amber)',
                    }}
                  >
                    Floor {floor}{flavor ? ` — ${flavor.name}` : ''}
                  </span>
                  {locked
                    ? <Lock style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                    : <ArrowRight style={{ width: '0.875rem', height: '0.875rem', color: 'var(--amber)' }} />}
                </div>
                {flavor && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{flavor.description}</p>}
                {locked && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Requires meta-progression roster gating (not yet ported).
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
