import { useMemo } from 'react';
import { GAME_REGISTRY } from '../games/registry';
import gameMetadataRaw from '../games/game-metadata.json';
import { loadGameFiles } from '../engine/loader';
import { navigateTo } from './routing';

interface GameMetadataEntry {
  created: string;
  last_updated: string;
  version: string;
  tracked: boolean;
}

const gameMetadata = gameMetadataRaw as Record<string, GameMetadataEntry>;

const PYGAME_GAMES = new Set(['horse_racing', 'slither_rogue']);

const STATUS_ORDER: Record<string, number> = {
  stable: 0,
  beta: 1,
  dev: 2,
  external: 3,
};

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
  const sortedGames = useMemo(() => {
    return [...GAME_REGISTRY].sort((a, b) => {
      const statusA = a.status ?? 'dev';
      const statusB = b.status ?? 'dev';
      const statusDiff = (STATUS_ORDER[statusA] ?? 99) - (STATUS_ORDER[statusB] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      const aUpdated = gameMetadata[a.gameId]?.last_updated ?? '';
      const bUpdated = gameMetadata[b.gameId]?.last_updated ?? '';
      if (aUpdated === '' && bUpdated === '') return 0;
      if (aUpdated === '') return 1;   // a has no date → after b
      if (bUpdated === '') return -1;  // b has no date → a before b
      return bUpdated.localeCompare(aUpdated); // most recent first
    });
  }, []);

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
        <h2 className="arcade-section-title">SELECT A GAME</h2>
        <div className="arcade-grid">
          {sortedGames.map(config => (
            <button
              key={config.gameId}
              className="arcade-card"
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
            >
              <div className="arcade-card-frame">
                <div className="arcade-card-header">
                  <span className="arcade-card-title">{config.label}</span>
                  <span className={`arcade-status arcade-status--${config.status ?? 'stable'}`}>
                    {(config.status ?? 'stable').toUpperCase()}
                  </span>
                </div>
                <p className="arcade-card-desc">{config.description ?? ''}</p>
                <div className="arcade-card-detail">{details[config.gameId]}</div>
                <div className="arcade-card-id">{config.gameId}</div>
              </div>
            </button>
          ))}
        </div>
      </main>

      <footer className="arcade-footer">
        <span>© 2026 RFD IT Services Ltd.</span>
        <span className="arcade-footer-sep">·</span>
        <span>Lua + Python + TypeScript</span>
      </footer>
    </div>
  );
}
