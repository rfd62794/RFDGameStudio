import type { ReactNode } from 'react';
import { Trophy, Skull, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { Panel } from './Panel';

export interface EndStateStat {
  label: string;
  value: ReactNode;
}

export interface EndStateScreenProps {
  won: boolean;
  headline: string;
  flavorLine: string;
  stats: EndStateStat[];
  onRestart: () => void;
  restartLabel?: string;
  wonIcon?: ReactNode;
  lostIcon?: ReactNode;
  className?: string;
  id?: string;
}

export function EndStateScreen({
  won,
  headline,
  flavorLine,
  stats,
  onRestart,
  restartLabel = 'Play Again',
  wonIcon,
  lostIcon,
  className,
  id,
}: EndStateScreenProps) {
  const defaultWonIcon = <Trophy style={{ width: '3rem', height: '3rem', fill: 'currentColor', opacity: 0.15 }} />;
  const defaultLostIcon = <Skull style={{ width: '3rem', height: '3rem', fill: 'currentColor', opacity: 0.15 }} />;

  return (
    <div
      className={['end-state-screen', className].filter(Boolean).join(' ')}
      id={id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: 'var(--space-6)',
        textAlign: 'center',
        color: 'var(--text)',
      }}
    >
      <div
        className="end-state-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--surface)',
          border: '1px solid',
          borderColor: won ? 'var(--amber)' : 'var(--red)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div
          className="end-state-icon"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--space-6)',
            color: won ? 'var(--amber)' : 'var(--red)',
            background: won ? 'rgba(245, 158, 11, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            border: '2px solid',
            borderColor: won ? 'rgba(245, 158, 11, 0.4)' : 'rgba(248, 113, 113, 0.4)',
          }}
        >
          {won ? wonIcon ?? defaultWonIcon : lostIcon ?? defaultLostIcon}
        </div>

        <h2
          className="end-state-headline"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 400,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            margin: 0,
            marginBottom: 'var(--space-3)',
            color: won ? 'var(--amber)' : 'var(--red)',
          }}
        >
          {headline}
        </h2>

        <p
          className="end-state-flavor"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: '400px',
            margin: '0 auto var(--space-6)',
          }}
        >
          {flavorLine}
        </p>

        {stats.length > 0 && (
          <Panel className="end-state-stats" padding="md">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-4)',
                textAlign: 'left',
              }}
            >
              {stats.map((stat, i) => (
                <div key={i} className="end-state-stat">
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-md)',
                      fontWeight: 700,
                      color: 'var(--text)',
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <div style={{ marginTop: 'var(--space-6)' }}>
          <Button
            label={restartLabel}
            icon={<RotateCcw style={{ width: '1rem', height: '1rem' }} />}
            onClick={onRestart}
            variant="primary"
            size="lg"
            className="end-state-restart"
          />
        </div>
      </div>
    </div>
  );
}
