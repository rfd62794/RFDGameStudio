import React, { useEffect } from 'react';

export interface TabConfig {
  id: string;
  label: string;
  /** Single key for keyboard shortcut. e.g. '1', '2', 'b' */
  shortcut?: string;
}

interface TabManagerProps {
  tabs: TabConfig[];
  active: string;
  onChange: (tabId: string) => void;
  /** Slot for the active tab's content */
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared tab bar + content switching component.
 * Handles keyboard shortcut registration automatically.
 * Used by new games — existing games keep their own tab handling.
 *
 * Usage:
 *   <TabManager tabs={TABS} active={activeTab} onChange={setActiveTab}>
 *     {activeTab === 'stable' && <StableTab />}
 *     {activeTab === 'betting' && <BettingTab />}
 *   </TabManager>
 */
export function TabManager({ tabs, active, onChange, children, className = '' }: TabManagerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture shortcuts when an input is focused
      if (document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement) return;
      const tab = tabs.find(t => t.shortcut === e.key);
      if (tab) onChange(tab.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs, onChange]);

  return (
    <div className={`tab-manager ${className}`}>
      <div className="tab-manager-bar" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            className={`tab-manager-btn ${active === tab.id ? 'tab-manager-btn--active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.shortcut && (
              <span className="tab-manager-shortcut">{tab.shortcut}</span>
            )}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-manager-content" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
