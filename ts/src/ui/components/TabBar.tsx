interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onSelect: (id: string) => void;
  variant?: 'default' | 'mobile';
}

export function TabBar({ tabs, active, onSelect, variant = 'default' }: TabBarProps) {
  const barCls = variant === 'mobile' ? 'mobile-tab-bar' : 'tab-bar';
  const btnCls = variant === 'mobile' ? 'mobile-tab-btn' : 'tab-btn';
  return (
    <nav className={barCls}>
      {tabs.map(t => (
        <button
          key={t.id}
          className={`${btnCls}${active === t.id ? ' active' : ''}`}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
