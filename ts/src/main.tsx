import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './ui/tokens.css';
import './ui/base.css';
import { loadGame } from './engine/runtime';
import type { GameSession } from './engine/types';
import { GAME_REGISTRY, findGameOrDefault } from './games/registry';

// ── URL routing ──────────────────────────────────────────────────────────────

function getGameId(): string | null {
  return new URLSearchParams(window.location.search).get('game');
}

function navigateTo(gameId: string): void {
  window.location.href = `?game=${gameId}`;
}

export function navigateHome(): void {
  window.location.href = window.location.pathname;
}

// ── Game Selector (index page) ───────────────────────────────────────────────

function GameSelector() {
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

// ── Game Loader (single game view) ───────────────────────────────────────────

function GameLoader({ gameId }: { gameId: string }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await loadGame(gameId, 42);
        if (!cancelled) setSession(s);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : `Failed to load game: ${gameId}`);
      }
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  if (error) {
    return (
      <div className="arcade-error">
        <div className="arcade-game-nav">
          <button className="arcade-back-btn" onClick={navigateHome}>← Arcade</button>
          <span className="arcade-game-nav-title">{gameId}</span>
        </div>
        <div className="arcade-error-box">
          <strong>Studio Error</strong>
          <p>{error}</p>
          <small>Game ID: {gameId}</small>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="arcade-loading">
        <div className="arcade-game-nav">
          <button className="arcade-back-btn" onClick={navigateHome}>← Arcade</button>
          <span className="arcade-game-nav-title">{gameId}</span>
        </div>
        <span>Loading {gameId}…</span>
      </div>
    );
  }

  const config     = findGameOrDefault(gameId);
  const GameApp    = config.component;

  return (
    <div className="arcade-game-wrap">
      <div className="arcade-game-nav">
        <button className="arcade-back-btn" onClick={navigateHome}>← Arcade</button>
        <span className="arcade-game-nav-title">{config.label}</span>
      </div>
      <div className="arcade-game-content">
        <React.Suspense
          fallback={
            <div className="arcade-loading">Loading renderer…</div>
          }
        >
          <GameApp session={session} />
        </React.Suspense>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

function Root() {
  const gameId = getGameId();
  return gameId ? <GameLoader gameId={gameId} /> : <GameSelector />;
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Root />);
}
