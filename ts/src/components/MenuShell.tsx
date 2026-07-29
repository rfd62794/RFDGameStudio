import type { ReactNode } from 'react';

export interface MenuShellProps {
  gameTitle: string;
  subtitle?: string;
  heroSlot?: ReactNode;
  children: ReactNode;
  ctaLabel: string;
  onCta: () => void;
  className?: string;
}

export function MenuShell({
  gameTitle,
  subtitle,
  heroSlot,
  children,
  ctaLabel,
  onCta,
  className = '',
}: MenuShellProps) {
  return (
    <div className={`menu-shell ${className}`}>
      {heroSlot && <div className="menu-hero">{heroSlot}</div>}
      <div className="menu-shell-inner">
        <div className="menu-title-wrap">
          <h1 className="menu-title">{gameTitle}</h1>
          {subtitle && <p className="menu-subtitle">{subtitle}</p>}
        </div>
        <div className="menu-grid">{children}</div>
        <div className="menu-cta">
          <button className="menu-launch-btn" onClick={onCta}>
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
