import React from 'react';
import ReactDOM from 'react-dom/client';
import './ui/tokens.css';
import './ui/base.css';

const GAMES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  horse_racing: React.lazy(() => import('./games/horse_racing/App')),
  slither_rogue: React.lazy(() => import('./games/slither_rogue/App')),
};

const GAME_ID = (new URLSearchParams(window.location.search).get('game'))
  ?? 'horse_racing';

const GameApp = GAMES[GAME_ID] ?? GAMES['horse_racing'];

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.Suspense fallback={<div style={{ padding: '2rem', color: '#888' }}>Loading…</div>}>
    <GameApp />
  </React.Suspense>
);
