import ReactDOM from 'react-dom/client';
import './index.css';
import { GameSelector, GameLoader, getGameId } from './arcade';

function Root() {
  const gameId = getGameId();
  return gameId ? <GameLoader gameId={gameId} /> : <GameSelector />;
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Root />);
}
