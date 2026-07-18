import type { ReactNode } from 'react';

interface ButtonProps {
  label?: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'neutral';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  className?: string;
}

export function Button({ label, icon, onClick, variant = 'primary', disabled, size = 'md', title, className }: ButtonProps) {
  if (import.meta.env.DEV && !label && !icon) {
    console.warn('Button requires a label or icon.');
  }

  const cls = [
    variant === 'primary'   ? 'btn-primary'   : '',
    variant === 'secondary' ? 'btn-secondary' : '',
    variant === 'danger'    ? 'btn-danger'    : '',
    variant === 'neutral'   ? 'btn-neutral'   : '',
    size === 'sm' ? 'btn-sm' : '',
    size === 'lg' ? 'btn-lg' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} onClick={onClick} disabled={disabled} title={title}>
      {icon}
      {label}
    </button>
  );
}
