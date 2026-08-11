import { Zap, ArrowRight } from 'lucide-react';
import { Button, Card } from '../../../ui/components';
import type { RunState } from '../types';

interface AnomalyPhaseProps {
  run: RunState;
  onAccept: () => void;
}

const ANOMALY_TEXT: Record<string, { title: string; description: string; button: string }> = {
  echo_memory: {
    title: "Echo's Memory",
    description: 'A faint recording surfaces — one unknown combination resolves into focus, free of cost.',
    button: 'Receive the Echo',
  },
  fragment_surge: {
    title: 'Fragment Surge',
    description: 'Raw fragments spike through the room. Take 3 HP damage to harvest 15 Essence.',
    button: 'Harvest Fragments',
  },
  corrupted_merge: {
    title: 'Corrupted Merge',
    description: 'A failed elemental fusion lunges. Fight it off for 5 HP damage and extract 10 Essence.',
    button: 'Break the Merge',
  },
  unstable_cache: {
    title: 'Unstable Cache',
    description: 'A half-formed reward flickers in and out of phase. Accept whatever stabilizes.',
    button: 'Open Cache',
  },
  silence: {
    title: 'Silence',
    description: 'The station goes quiet. The next Reward roll will favor one relation tier.',
    button: 'Listen to the Silence',
  },
};

export default function AnomalyPhase({ run, onAccept }: AnomalyPhaseProps) {
  const eventId = run.currentAnomaly ?? 'echo_memory';
  const event = ANOMALY_TEXT[eventId] ?? ANOMALY_TEXT.echo_memory;

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
      id="viewport-anomaly-phase"
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
        {event.title}
      </h2>

      <Card id="anomaly-panel" className="anomaly-panel">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Zap style={{ width: '1.5rem', height: '1.5rem', color: 'var(--amber)' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: 0 }}>
            {event.description}
          </p>
        </div>
      </Card>

      <Button
        id="anomaly-accept-btn"
        label={event.button}
        icon={<ArrowRight style={{ width: '1rem', height: '1rem' }} />}
        onClick={onAccept}
        variant="primary"
        size="lg"
      />
    </div>
  );
}
