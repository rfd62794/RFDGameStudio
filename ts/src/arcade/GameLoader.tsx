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
    // External games have no engine files — redirect immediately
    const cfg = findGame(gameId);
    if (cfg?.externalUrl) {
      window.open(cfg.externalUrl, '_blank', 'noopener,noreferrer');
      navigateHome();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const s = await loadGame(gameId, 42);
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
        <span>Loading {gameId}…</span>
      </div>
    );
  }

  const GameApp = config.component;

  if (!GameApp) {
    return (
      <div className="arcade-error">
        <div className="arcade-error-box">
          <strong>No Renderer</strong>
          <p>Game "{gameId}" has no in-app component. It may be an external game.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="arcade-game-wrap">
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
