import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Panel({ children, className, padding = 'md' }: PanelProps) {
  const padCls = padding === 'sm' ? 'panel-sm' : padding === 'lg' ? 'panel-lg' : '';
  const cls = ['bet-panel', padCls, className].filter(Boolean).join(' ');
  return <div className={cls}>{children}</div>;
}
