import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  const cls = ['horse-card', className].filter(Boolean).join(' ');
  return (
    <div className={cls} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {children}
    </div>
  );
}
