type Tab = 'chamber' | 'mutate' | 'codex' | 'market'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const NAV_ITEMS: Array<{ icon: string; label: string; tab: Tab | null }> = [
  { icon: 'database', label: 'CHAMBER', tab: 'chamber' },
  { icon: 'science',  label: 'MUTATE',  tab: 'mutate' },
  { icon: 'menu_book', label: 'CODEX',  tab: 'codex' },
  { icon: 'storefront', label: 'MARKET',  tab: 'market' },
]

export function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 flex justify-around items-stretch bg-surface-container-lowest z-50">
      {NAV_ITEMS.map(({ icon, label, tab }) => (
        <button
          key={label}
          onClick={() => tab && onTabChange(tab)}
          disabled={tab === null}
          className={`flex flex-col items-center justify-center h-full w-full transition-colors ${
            tab === activeTab
              ? 'bg-primary-container text-on-primary-container'
              : tab !== null
                ? 'text-on-surface-variant hover:bg-surface-container'
                : 'text-outline-variant cursor-not-allowed'
          }`}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={tab === activeTab ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {icon}
          </span>
          <span className="font-label text-[10px] tracking-tighter uppercase mt-0.5">{label}</span>
        </button>
      ))}
    </nav>
  )
}
