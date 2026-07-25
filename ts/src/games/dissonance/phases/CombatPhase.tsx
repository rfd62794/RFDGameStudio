import { Swords, Shield, Skull } from 'lucide-react';
import { Card, Panel, StatBar } from '../../../ui/components';
import type { DeckCard, RunState } from '../types';

interface CombatPhaseProps {
  run: RunState;
  onPlayCard: (card: DeckCard) => void;
}

const COMPONENT_LABEL: Record<string, string> = {
  sever: 'Damage',
  mend: 'Heal',
  guard: 'Shield',
  unmake: 'DoT',
};

export default function CombatPhase({ run, onPlayCard }: CombatPhaseProps) {
  const enemy = run.enemy;
  if (!enemy) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        maxWidth: '1024px',
        margin: 'var(--space-6) auto',
        padding: 'var(--space-6)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
      }}
      id="viewport-combat-phase"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            You
          </span>
          <StatBar label="HP" value={run.playerHp} max={run.playerMaxHp} />
          {run.playerShield > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--accent)', fontSize: 'var(--font-size-sm)' }}>
              <Shield style={{ width: '1rem', height: '1rem' }} /> {run.playerShield}
            </span>
          )}
        </div>
        <Swords style={{ width: '1.5rem', height: '1.5rem', color: 'var(--amber)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignItems: 'flex-end' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {enemy.name}
          </span>
          <StatBar label="HP" value={enemy.hp} max={enemy.maxHp} color="var(--red)" />
        </div>
      </div>

      <Panel padding="sm">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--amber)',
          }}
        >
          <Skull style={{ width: '1rem', height: '1rem' }} />
          <span>Enemy Intent: {enemy.intent.description}</span>
        </div>
      </Panel>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 'var(--space-3)',
        }}
        id="combat-hand"
      >
        {run.deckState.hand.map((card) => (
          <Card
            key={card.id}
            id={`combat-card-${card.id}`}
            onClick={() => onPlayCard(card)}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--amber)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {COMPONENT_LABEL[card.component] ?? card.component}
            </span>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text)' }}>{card.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              {card.el1}{card.el2 ? ` + ${card.el2}` : ''} · {card.relationType}
            </span>
          </Card>
        ))}
      </div>

      <Panel padding="sm" className="combat-log-panel">
        <div
          style={{
            maxHeight: '10rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted)',
          }}
          id="combat-log"
        >
          {run.logs.slice(-12).map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
