import { useState } from 'react';
import { STATUS_BOARD } from '../status/board.data';
import type { ProjectEntry, ProjectCategory, ProjectStatus } from '../status/types';
import { TabBar, Card, Badge } from '../ui/components';
import { navigateHome } from '../arcade/routing';

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  live_catalog: 'Live Catalog',
  separate_infrastructure: 'Separate Infra',
  ai_studio_track: 'AI Studio Track',
  retired: 'Retired',
};

const CATEGORY_ORDER: ProjectCategory[] = [
  'live_catalog',
  'separate_infrastructure',
  'ai_studio_track',
  'retired',
];

const STATUS_BADGE_VARIANT: Record<ProjectStatus, 'accent' | 'green' | 'yellow' | 'muted'> = {
  active: 'accent',
  shipped_mature: 'green',
  shipped_deliberately_paused: 'green',
  blocked: 'yellow',
  status_unconfirmed: 'yellow',
  retired: 'muted',
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  shipped_mature: 'Shipped/Mature',
  shipped_deliberately_paused: 'Shipped/Paused',
  blocked: 'Blocked',
  status_unconfirmed: 'Unconfirmed',
  retired: 'Retired',
};

function EntryCard({ entry }: { entry: ProjectEntry }) {
  return (
    <Card id={`status-entry-${entry.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <strong style={{ fontSize: '1rem' }}>{entry.name}</strong>
        <Badge label={STATUS_LABELS[entry.status]} variant={STATUS_BADGE_VARIANT[entry.status]} />
      </div>
      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', lineHeight: 1.4 }}>{entry.currentState}</p>
      {entry.nextAction && (
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem', lineHeight: 1.4, color: 'var(--text-muted, #888)' }}>
          <strong>Next:</strong> {entry.nextAction}
        </p>
      )}
      {entry.supersededBy && (
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem', lineHeight: 1.4, color: 'var(--text-muted, #888)' }}>
          <strong>Superseded by:</strong> {entry.supersededBy}
        </p>
      )}
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #888)' }} data-testid={`last-updated-${entry.id}`}>
        Updated: {entry.lastUpdated}
      </p>
    </Card>
  );
}

export default function StatusBoardPage() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'all'>('all');

  const tabs = [
    { id: 'all', label: 'All' },
    ...CATEGORY_ORDER.map(c => ({ id: c, label: CATEGORY_LABELS[c] })),
  ];

  const visibleEntries = activeCategory === 'all'
    ? STATUS_BOARD
    : STATUS_BOARD.filter(e => e.category === activeCategory);

  // Group entries by category for display (preserves order even in "all" view)
  const groupedEntries: Record<ProjectCategory, ProjectEntry[]> = {
    live_catalog: [],
    separate_infrastructure: [],
    ai_studio_track: [],
    retired: [],
  };
  for (const entry of visibleEntries) {
    groupedEntries[entry.category].push(entry);
  }

  return (
    <div className="arcade-index">
      <header className="arcade-header">
        <button
          className="arcade-back-to-site"
          onClick={() => navigateHome()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
        >
          ← Arcade
        </button>
        <div className="arcade-marquee">
          <h1 className="arcade-logo">STUDIO STATUS</h1>
          <p className="arcade-subtitle">Live rollup of every project, its state, and its staleness</p>
        </div>
      </header>

      <main className="arcade-main">
        <div data-testid="status-tabbar" style={{ marginBottom: '1.5rem' }}>
          <TabBar
            tabs={tabs}
            active={activeCategory}
            onSelect={(id) => setActiveCategory(id as ProjectCategory | 'all')}
            testIdPrefix="status-tab"
          />
        </div>

        {CATEGORY_ORDER.map(category => {
          const entries = groupedEntries[category];
          if (entries.length === 0) return null;
          return (
            <div key={category} data-testid={`status-category-${category}`}>
              <h2 className="arcade-section-title" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="arcade-grid" style={{ marginBottom: '1.5rem' }}>
                {entries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <footer className="arcade-footer">
        <span>© 2026 RFD IT Services Ltd.</span>
        <span className="arcade-footer-sep">·</span>
        <span>Generated from ts/src/status/board.data.ts</span>
      </footer>
    </div>
  );
}
