interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  showValue?: boolean;
}

export function StatBar({ label, value, max = 100, color, showValue = true }: StatBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="stat-row">
      <span>{label}</span>
      {showValue && <span>{value}</span>}
      <div className="stat-bar-wrap">
        <div className="stat-bar-bg">
          <div
            className="stat-bar-fill"
            style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
          />
        </div>
      </div>
    </div>
  );
}
