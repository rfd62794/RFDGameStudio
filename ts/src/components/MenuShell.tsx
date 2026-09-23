import type { ReactNode } from 'react';

export interface MenuShellClassNames {
  shell?: string;
  inner?: string;
  titleWrap?: string;
  title?: string;
  subtitle?: string;
  grid?: string;
  cta?: string;
  launchBtn?: string;
}

export interface MenuShellProps {
  gameTitle: string;
  subtitle?: string;
  heroSlot?: ReactNode;
  children: ReactNode;
  ctaLabel: string;
  onCta: () => void;
  classNames?: Partial<MenuShellClassNames>;
  beforeInner?: ReactNode;
}

export function MenuShell({
  gameTitle,
  subtitle,
  heroSlot,
  children,
  ctaLabel,
  onCta,
  classNames,
  beforeInner,
}: MenuShellProps) {
  const cn = classNames ?? {};
  return (
    <div className={cn.shell ?? 'menu-shell'}>
      {beforeInner}
      {heroSlot && <div className="menu-hero">{heroSlot}</div>}
      <div className={cn.inner ?? 'menu-shell-inner'}>
        <div className={cn.titleWrap ?? 'menu-title-wrap'}>
          <h1 className={cn.title ?? 'menu-title'}>{gameTitle}</h1>
          {subtitle && <p className={cn.subtitle ?? 'menu-subtitle'}>{subtitle}</p>}
        </div>
        <div className={cn.grid ?? 'menu-grid'}>{children}</div>
        <div className={cn.cta ?? 'menu-cta'}>
          <button className={cn.launchBtn ?? 'menu-launch-btn'} onClick={onCta}>
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
