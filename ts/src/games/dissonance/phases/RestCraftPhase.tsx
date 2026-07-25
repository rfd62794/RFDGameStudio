import { Flame, Package, ArrowRight } from 'lucide-react';
import { Button, Card } from '../../../ui/components';
import type { RunState } from '../types';

interface RestCraftPhaseProps {
  run: RunState;
  onRest: () => void;
  onAttachment: () => void;
  onContinue: () => void;
}

export default function RestCraftPhase({ run, onRest, onAttachment, onContinue }: RestCraftPhaseProps) {
  // Real backend guard: restCraftResolvedNodeId is set by apply_rest/apply_attachment
  // in Lua, not just disabled client-side.
  const resolved = run.restCraftResolvedNodeId === run.currentNodeId;

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
      id="viewport-rest-craft-phase"
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
        Rest &amp; Craft Stop
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
        HP {run.playerHp}/{run.playerMaxHp}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          width: '100%',
        }}
      >
        <Card
          id="rest-craft-rest-btn"
          onClick={onRest}
          className="rest-craft-option"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              opacity: resolved ? 0.3 : 1,
              pointerEvents: resolved ? 'none' : 'auto',
            }}
          >
            <Flame style={{ width: '1.5rem', height: '1.5rem', color: 'var(--green)' }} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text)' }}>
              Rest (+40% Max HP)
            </span>
          </div>
        </Card>

        <Card
          id="rest-craft-attachment-btn"
          onClick={onAttachment}
          className="rest-craft-option"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              opacity: resolved ? 0.3 : 1,
              pointerEvents: resolved ? 'none' : 'auto',
            }}
          >
            <Package style={{ width: '1.5rem', height: '1.5rem', color: 'var(--accent)' }} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text)' }}>
              Attachment (Peek/Gift/Treasure)
            </span>
          </div>
        </Card>
      </div>

      {run.lastAttachmentOutcome && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--accent)' }}>
          Attachment resolved: {run.lastAttachmentOutcome}
        </p>
      )}

      {resolved && (
        <Button
          id="rest-craft-continue-btn"
          label="Continue — Return to Map"
          icon={<ArrowRight style={{ width: '1rem', height: '1rem' }} />}
          onClick={onContinue}
          variant="primary"
          size="lg"
        />
      )}
    </div>
  );
}
