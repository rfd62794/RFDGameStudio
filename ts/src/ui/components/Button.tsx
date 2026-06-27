interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'neutral';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ label, onClick, variant = 'primary', disabled, size = 'md' }: ButtonProps) {
  const cls = [
    variant === 'primary'   ? 'btn-primary'   : '',
    variant === 'secondary' ? 'btn-secondary' : '',
    variant === 'danger'    ? 'btn-danger'    : '',
    variant === 'neutral'   ? 'btn-neutral'   : '',
    size === 'sm' ? 'btn-sm' : '',
    size === 'lg' ? 'btn-lg' : '',
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
