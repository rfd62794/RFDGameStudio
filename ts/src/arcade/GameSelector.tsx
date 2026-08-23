import { useMemo, useState } from 'react';
import { GAME_REGISTRY } from '../games/registry';
import { loadGameFiles } from '../engine/loader';
import { navigateTo } from './routing';
import { navigateToPage } from './routing';
import { GameDetailView } from './GameDetailView';
import { useHoverCapable } from './useHoverCapable';
import gameMetadata from '../games/game-metadata.json';

type GameMetadataEntry = { last_updated?: string };
const GAME_METADATA = gameMetadata as Record<string, GameMetadataEntry>;

const GENRE_LABELS: Record<string, string> = {
  'creature-collector': 'Creature Collector',
  'combat-arena': 'Combat Arena',
  'economic-precarity': 'Economic Precarity',
  'colony-4x': 'Colony/4X',
  'idle-incremental': 'Idle/Incremental',
  'roguelike': 'Roguelike',
  'racing': 'Racing',
  'puzzle-stealth': 'Puzzle/Stealth',
  'cooperative': 'Cooperative',
  'narrative-persuasion': 'Narrative/Persuasion',
  'management-sim': 'Management/Sim',
};

const PYGAME_GAMES = new Set(['horse_racing', 'slither_rogue']);

function countArray(data: Record<string, unknown>, key: string): number {
  const value = data[key];
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return 0;
}

function getRuntimeDetail(gameId: string, data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (PYGAME_GAMES.has(gameId)) parts.push('PyGame renderer');
  switch (gameId) {
    case 'horse_racing':
      parts.push(`${countArray(data, 'race_classes')} race classes`);
      break;
    case 'slither_rogue':
      parts.push(`${countArray(data, 'evolution_cards')} evolution cards`);
      break;
    case 'mutant_battle_ball':
      parts.push(`${countArray(data, 'parts')} mutant parts`, `${countArray(data, 'opponents')} opponents`);
      break;
    case 'slime_coin': {
      const rounds = (data.round_config as Record<string, number> | undefined)?.total_rounds ?? 0;
      parts.push(`${rounds} rounds`, `${countArray(data, 'chip_cards')} chip cards`);
      break;
    }
    case 'chimera_wilds':
      parts.push(`${countArray(data, 'parts')} mutant parts`, `${countArray(data, 'part_slots')} body slots`);
      break;
    case 'scrapcrawl': {
      const catalog = data.catalog as Record<string, unknown> | undefined;
      parts.push(`${countArray(data, 'rooms')} rooms`, `${Object.keys(catalog ?? {}).length} craftables`);
      break;
    }
  }
  return parts.join(' · ');
}

export default function GameSelector() {
  const [detailGameId, setDetailGameId] = useState<string | null>(null);
  const hoverCapable = useHoverCapable();
  // Real tap-to-reveal state for touch devices — hover-capable desktops
  // rely on pure CSS (:hover/:focus-within), never this state.
  const [openPreviewId, setOpenPreviewId] = useState<string | null>(null);
  const details = useMemo(() => {
    const map: Record<string, string> = {};
    for (const config of GAME_REGISTRY) {
      if (config.externalUrl && config.embedUrl) {
        map[config.gameId] = 'Rust/Bevy · itch.io';
        continue;
      }
      if (config.embedUrl) {
        map[config.gameId] = 'React/Tailwind · Standalone';
        continue;
      }
      if (config.externalUrl) {
        map[config.gameId] = 'External link';
        continue;
      }
      if (config.status === 'tool') {
        map[config.gameId] = 'Sandbox tool · TS-native';
        continue;
      }
      try {
        const files = loadGameFiles(config.gameId);
        map[config.gameId] = getRuntimeDetail(config.gameId, files.data);
      } catch {
        map[config.gameId] = 'data unavailable';
      }
    }
    return map;
  }, []);

  return (
    <div className="arcade-index">
      <header className="arcade-header">
        <a href="https://rfditservices.com/games/" className="arcade-back-to-site">
          ← rfditservices.com
        </a>
        <div className="arcade-marquee">
          <h1 className="arcade-logo">RFD GAME STUDIO</h1>
          <p className="arcade-subtitle">Portable Game Definition Format · Multi-Renderer</p>
        </div>
      </header>

      <main className="arcade-main">
        <div className="arcade-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="arcade-section-title" style={{ margin: 0 }}>SELECT A GAME</h2>
          <button
            className="arcade-status-link"
            onClick={() => navigateToPage('status')}
            data-testid="studio-status-link"
            style={{ background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', cursor: 'pointer', font: 'inherit', fontSize: '0.8125rem' }}
          >
            Studio Status →
          </button>
        </div>
        <div className="arcade-grid">
          {GAME_REGISTRY.map(config => {
            const lastUpdated = GAME_METADATA[config.gameId]?.last_updated;
            const cardDesc = config.shortDescription || config.description || '';
            return (
              <div
                key={config.gameId}
                className="arcade-card"
                role="button"
                tabIndex={0}
                style={{ '--card-color': config.color ?? 'var(--accent)' } as React.CSSProperties}
                onClick={() => {
                  if (config.embedUrl) {
                    navigateTo(config.gameId);
                  } else if (config.externalUrl) {
                    window.open(config.externalUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    navigateTo(config.gameId);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.currentTarget.click();
                  }
                }}
              >
                <div className="arcade-card-frame">
                  <div className="arcade-card-header">
                    <span className="arcade-card-title">{config.label}</span>
                    <span className={`arcade-status arcade-status--${config.status ?? 'stable'}`}>
                      {(config.status ?? 'stable').toUpperCase()}
                    </span>
                  </div>
                  {(config.genre || lastUpdated) && (
                    <div className="arcade-card-meta" data-testid={`arcade-card-meta-${config.gameId}`}>
                      {config.genre && (
                        <span className="arcade-card-genre">{GENRE_LABELS[config.genre] ?? config.genre}</span>
                      )}
                      {lastUpdated && (
                        <span className="arcade-card-updated" data-testid={`arcade-card-updated-${config.gameId}`}>
                          Updated {lastUpdated.slice(0, 10)}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="arcade-card-desc">{cardDesc}</p>
                  <div className="arcade-card-detail">{details[config.gameId]}</div>
                  <div className="arcade-card-id">{config.gameId}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="arcade-card-details-btn"
                      data-testid={`arcade-card-details-btn-${config.gameId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailGameId(config.gameId);
                      }}
                    >
                      Details
                    </button>
                    {!hoverCapable && (
                      <button
                        type="button"
                        className="arcade-card-preview-toggle-btn"
                        data-testid={`arcade-card-preview-toggle-${config.gameId}`}
                        aria-expanded={openPreviewId === config.gameId}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenPreviewId(prev => prev === config.gameId ? null : config.gameId);
                        }}
                      >
                        Preview
                      </button>
                    )}
                  </div>
                </div>

                {/* Real hover-preview surface (Steam-style pattern, Aug 23
                    2026): shortDescription/description fallback, genre +
                    tags, real last_updated. Shown via pure CSS :hover /
                    :focus-within on hover-capable devices; on touch
                    devices (no real hover capability) the "Preview"
                    button above toggles `arcade-card-preview--open`
                    instead, so the same content is reachable without a
                    hover-only interaction. Never fabricates content for
                    missing genre/tags — the section simply omits what
                    isn't real. */}
                <div
                  className={`arcade-card-preview${openPreviewId === config.gameId ? ' arcade-card-preview--open' : ''}`}
                  data-testid={`arcade-card-preview-${config.gameId}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="arcade-card-preview-desc" data-testid={`arcade-card-preview-desc-${config.gameId}`}>
                    {cardDesc}
                  </p>
                  {(config.genre || (config.tags && config.tags.length > 0)) && (
                    <div className="arcade-card-preview-tags" data-testid={`arcade-card-preview-tags-${config.gameId}`}>
                      {config.genre && (
                        <span className="arcade-card-preview-genre">{GENRE_LABELS[config.genre] ?? config.genre}</span>
                      )}
                      {config.tags?.map(tag => (
                        <span key={tag} className="arcade-card-preview-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  {lastUpdated && (
                    <p className="arcade-card-preview-updated" data-testid={`arcade-card-preview-updated-${config.gameId}`}>
                      Updated {lastUpdated.slice(0, 10)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="arcade-footer">
        <span>© 2026 RFD IT Services Ltd.</span>
        <span className="arcade-footer-sep">·</span>
        <span>Lua + Python + TypeScript</span>
      </footer>

      {detailGameId && (() => {
        const config = GAME_REGISTRY.find(g => g.gameId === detailGameId);
        return config ? (
          <GameDetailView config={config} onClose={() => setDetailGameId(null)} />
        ) : null;
      })()}
    </div>
  );
}
