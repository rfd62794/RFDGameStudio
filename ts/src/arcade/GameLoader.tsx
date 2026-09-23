import React, { useState, useEffect } from 'react';
import { loadGame } from '../engine/runtime';
import type { GameSession, GameConfig, GameFiles, LuaExecutor } from '../engine/types';
import { findGame } from '../games/registry';
import { navigateHome } from './routing';

/**
 * Create a stub session for TS-native games that have no Lua/yaml assets.
 * These games manage their own state entirely in React/TS and don't use
 * the Lua executor or data/ui yaml files. The session is provided to
 * satisfy GameRendererProps but is not used by the game.
 */
function createStubSession(gameId: string): GameSession {
  const stubFiles: GameFiles = { gameId, data: {}, ui: {}, logic: '', engineSource: '' };
  const stubExecutor: LuaExecutor = { call: () => [] };
  return { gameId, files: stubFiles, executor: stubExecutor };
}

export default function GameLoader({ gameId }: { gameId: string }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cfg = findGame(gameId);

    // Embeddable external games render inline — do NOT redirect.
    if (cfg?.embedUrl) {
      return;
    }

    // Non-embeddable external games (no embedUrl) keep the old redirect behavior.
    if (cfg?.externalUrl) {
      window.open(cfg.externalUrl, '_blank', 'noopener,noreferrer');
      navigateHome();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        if (!cfg) {
          setError(
            `Game "${gameId}" loaded successfully but has no registered config in registry.ts — this is a studio configuration error, not a player-facing one. Check that the game is added to GAME_REGISTRY.`
          );
          return;
        }

        // TS-native games with a component but no Lua/yaml assets get a
        // stub session. They manage their own state entirely in React/TS.
        // Lua-backed hybrid games (component + yaml) still go through
        // loadGame to get a real session with the Lua executor.
        let s: GameSession;
        try {
          s = await loadGame(gameId, 42);
        } catch {
          // loadGame throws "Unknown game" if the game is not in
          // GAME_ASSETS (no yaml files). If the game has a component,
          // it's TS-native — use a stub session.
          if (cfg.component) {
            s = createStubSession(gameId);
          } else {
            throw new Error(`Unknown game: ${gameId}`);
          }
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

  const cfg = findGame(gameId);
  if (cfg?.embedUrl) {
    if (cfg.embedWidth && cfg.embedHeight) {
      // Fixed aspect-ratio container (VoidRift's itch.io iframe)
      const ratio = (cfg.embedHeight / cfg.embedWidth) * 100;
      return (
        <div className="arcade-game-wrap">
          <div className="arcade-game-lobby-bar">
            <button onClick={() => navigateHome()} className="arcade-back-to-lobby">
              ← Back to Arcade
            </button>
          </div>
          <div className="arcade-game-content" style={{ position: 'relative', width: '100%', maxWidth: `${cfg.embedWidth}px`, margin: '0 auto' }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: `${ratio}%` }}>
              <iframe
                src={cfg.embedUrl}
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                title={`${cfg.label} — playable embed`}
              />
            </div>
            {cfg.externalUrl && (
              <a href={cfg.externalUrl} target="_blank" rel="noopener noreferrer"
                 style={{ display: 'block', textAlign: 'center', marginTop: '8px', fontSize: '0.8rem' }}>
                Open on itch.io ↗
              </a>
            )}
          </div>
        </div>
      );
    } else {
      // Responsive full-bleed container (same-origin static demos)
      return (
        <div className="arcade-game-wrap">
          <div className="arcade-game-lobby-bar">
            <button onClick={() => navigateHome()} className="arcade-back-to-lobby">
              ← Back to Arcade
            </button>
          </div>
          <div style={{ width: '100%', maxWidth: '1200px', height: 'min(85vh, 900px)', margin: '0 auto' }}>
            <iframe
              src={cfg.embedUrl}
              style={{ width: '100%', height: '100%', border: 0 }}
              title={`${cfg.label} — playable embed`}
            />
          </div>
        </div>
      );
    }
  }

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
