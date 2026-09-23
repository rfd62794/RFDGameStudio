import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}

export function Card({ children, className, onClick, id }: CardProps) {
  const cls = ['card-base', className].filter(Boolean).join(' ');
  return (
    <div id={id} className={cls} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {children}
    </div>
  );
}
