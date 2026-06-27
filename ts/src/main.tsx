import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './ui/tokens.css';
import './ui/base.css';
import { loadGame } from './engine/runtime';
import type { GameSession } from './engine/types';
import { findGameOrDefault } from './games/registry';

const GAME_ID = new URLSearchParams(window.location.search).get('game')
  ?? 'horse_racing';

/**
 * GameLoader — loads the Lua session for the selected game,
 * then renders the game component with the session as a prop.
 * Handles loading and error states centrally so individual games don't have to.
 */
function GameLoader({ gameId }: { gameId: string }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = loadGame(gameId, 42);
      setSession(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to load game: ${gameId}`);
    }
  }, [gameId]);

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#f87171', fontFamily: 'monospace' }}>
        <strong>Studio Error</strong>
        <p>{error}</p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Game ID: {gameId} — Check that {gameId}/data.yaml and {gameId}/logic.lua exist.
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: '2rem', color: '#6b7280' }}>
        Loading {gameId}…
      </div>
    );
  }

  const config = findGameOrDefault(gameId);
  const GameComponent = config.component;

  return (
    <React.Suspense
      fallback={<div style={{ padding: '2rem', color: '#6b7280' }}>Loading renderer…</div>}
    >
      <GameComponent session={session} />
    </React.Suspense>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GameLoader gameId={GAME_ID} />
);
