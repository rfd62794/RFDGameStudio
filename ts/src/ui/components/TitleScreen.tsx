import type { ReactNode } from 'react';
import { Button } from './Button';

export interface TitleScreenMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'neutral';
  disabled?: boolean;
}

export interface TitleScreenProps {
  title: string;
  tagline?: ReactNode;
  pitch?: string;
  quote?: string;
  menuItems: TitleScreenMenuItem[];
  children?: ReactNode;
  className?: string;
  id?: string;
}

export function TitleScreen({
  title,
  tagline,
  pitch,
  quote,
  menuItems,
  children,
  className,
  id,
}: TitleScreenProps) {
  return (
    <div
      className={['title-screen', className].filter(Boolean).join(' ')}
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
        className="title-screen-card"
        style={{
          width: '100%',
          maxWidth: '640px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
          position: 'relative',
        }}
      >
        {tagline && (
          <div
            className="title-screen-tagline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              border: '1px solid var(--accent-dim)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 10px',
              marginBottom: 'var(--space-4)',
              background: 'rgba(108, 142, 247, 0.08)',
            }}
          >
            {tagline}
          </div>
        )}

        <h1
          className="title-screen-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 400,
            letterSpacing: '0.06em',
            lineHeight: 1,
            textTransform: 'uppercase',
            margin: 0,
            marginBottom: 'var(--space-3)',
            textShadow: 'var(--marquee-glow)',
          }}
        >
          {title}
        </h1>

        {pitch && (
          <p
            className="title-screen-pitch"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '480px',
              margin: '0 auto var(--space-6)',
            }}
          >
            {pitch}
          </p>
        )}

        {quote && (
          <blockquote
            className="title-screen-quote"
            style={{
              fontStyle: 'italic',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--muted)',
              borderLeft: '2px solid var(--accent-dim)',
              background: 'var(--bg)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              textAlign: 'left',
              marginBottom: 'var(--space-6)',
            }}
          >
            &ldquo;{quote}&rdquo;
          </blockquote>
        )}

        <nav
          className="title-screen-menu"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            width: '100%',
            maxWidth: '320px',
            margin: '0 auto var(--space-6)',
          }}
        >
          {menuItems.map((item) => (
            <Button
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              onClick={item.onClick}
              variant={item.variant ?? 'primary'}
              disabled={item.disabled}
              size="lg"
              className="title-screen-menu-item"
            />
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}
