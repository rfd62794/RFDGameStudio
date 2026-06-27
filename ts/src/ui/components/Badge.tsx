interface BadgeProps {
  label: string;
  variant?: 'accent' | 'green' | 'red' | 'yellow' | 'amber' | 'muted';
}

export function Badge({ label, variant = 'muted' }: BadgeProps) {
  const variantCls: Record<string, string> = {
    accent: 'badge-player',
    green:  'badge-green',
    red:    'badge-red',
    yellow: 'badge-yellow',
    amber:  'badge-amber',
    muted:  'badge-muted',
  };
  return <span className={variantCls[variant] ?? 'badge-muted'}>{label}</span>;
}
