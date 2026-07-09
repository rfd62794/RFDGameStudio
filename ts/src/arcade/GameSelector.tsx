import React from 'react';
import { GAME_REGISTRY } from '../games/registry';
import { navigateTo } from './routing';

export default function GameSelector() {
  return (
    <div className="arcade-index">
      <header className="arcade-header">
        <div className="arcade-brand">
          <div className="arcade-logo">RFD GAME STUDIO</div>
          <div className="arcade-subtitle">Portable Game Definition Format · Multi-Renderer</div>
        </div>
      </header>

      <main className="arcade-main">
        <h2 className="arcade-section-title">SELECT A GAME</h2>
        <div className="arcade-grid">
          {GAME_REGISTRY.map(config => (
            <button
              key={config.gameId}
              className="arcade-card"
              style={{ '--card-color': config.color ?? 'var(--color-accent)' } as React.CSSProperties}
              onClick={() => navigateTo(config.gameId)}
            >
              <div className="arcade-card-header">
                <span className="arcade-card-title">{config.label}</span>
                <span className={`arcade-status arcade-status--${config.status ?? 'stable'}`}>
                  {(config.status ?? 'stable').toUpperCase()}
                </span>
              </div>
              <p className="arcade-card-desc">{config.description ?? ''}</p>
              <div className="arcade-card-id">{config.gameId}</div>
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
