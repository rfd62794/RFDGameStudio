import React, { useState, useEffect } from 'react';
import { loadGame } from '../engine/runtime';
import type { GameSession, GameConfig } from '../engine/types';
import { findGame } from '../games/registry';
import { navigateHome } from './routing';

export default function GameLoader({ gameId }: { gameId: string }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await loadGame(gameId, 42);
        const cfg = findGame(gameId);
        if (!cfg) {
          setError(
            `Game "${gameId}" loaded successfully but has no registered config in registry.ts — this is a studio configuration error, not a player-facing one. Check that the game is added to GAME_REGISTRY.`
          );
          return;
        }
        if (!cancelled) {
          setSession(s);
          setConfig(cfg);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : `Failed to load game: ${gameId}`);
        }
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

  if (!session || !config) {
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

  const GameApp = config.component;

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
