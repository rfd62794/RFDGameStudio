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

function navigateHome(): void {
  window.location.href = '/';
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

          {/* Coming soon placeholder */}
          <div className="arcade-card arcade-card--coming-soon">
            <div className="arcade-card-header">
              <span className="arcade-card-title">More Coming</span>
              <span className="arcade-status arcade-status--dev">SOON</span>
            </div>
            <p className="arcade-card-desc">
              Coin Pusher · Mutant Battle Ball · and more.
            </p>
          </div>
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
        <button className="arcade-back-btn" onClick={navigateHome}>← Arcade</button>
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
        <button className="arcade-back-btn" onClick={navigateHome}>← Arcade</button>
        <span>Loading {gameId}…</span>
      </div>
    );
  }

  const config     = findGameOrDefault(gameId);
  const GameApp    = config.component;

  return (
    <div className="arcade-game-wrap">
      <button className="arcade-back-btn" onClick={navigateHome}>← Arcade</button>
      <React.Suspense
        fallback={
          <div className="arcade-loading">Loading renderer…</div>
        }
      >
        <GameApp session={session} />
      </React.Suspense>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

function Root() {
  const gameId = getGameId();
  return gameId ? <GameLoader gameId={gameId} /> : <GameSelector />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
