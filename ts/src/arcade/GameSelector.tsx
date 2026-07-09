import { useMemo } from 'react';
import { GAME_REGISTRY } from '../games/registry';
import { loadGameFiles } from '../engine/loader';
import { navigateTo } from './routing';

const PYGAME_GAMES = new Set(['horse_racing', 'slither_rogue']);

function countArray(data: Record<string, unknown>, key: string): number {
  const value = data[key];
  return Array.isArray(value) ? value.length : 0;
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
  const details = useMemo(() => {
    const map: Record<string, string> = {};
    for (const config of GAME_REGISTRY) {
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
        <div className="arcade-marquee">
          <h1 className="arcade-logo">RFD GAME STUDIO</h1>
          <p className="arcade-subtitle">Portable Game Definition Format · Multi-Renderer</p>
        </div>
      </header>

      <main className="arcade-main">
        <h2 className="arcade-section-title">SELECT A GAME</h2>
        <div className="arcade-grid">
          {GAME_REGISTRY.map(config => (
            <button
              key={config.gameId}
              className="arcade-card"
              style={{ '--card-color': config.color ?? 'var(--accent)' } as React.CSSProperties}
              onClick={() => navigateTo(config.gameId)}
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
