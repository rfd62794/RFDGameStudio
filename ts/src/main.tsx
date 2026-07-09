import ReactDOM from 'react-dom/client';
import './ui/tokens.css';
import './ui/base.css';
import { GameSelector, GameLoader, getGameId } from './arcade';

function Root() {
  const gameId = getGameId();
  return gameId ? <GameLoader gameId={gameId} /> : <GameSelector />;
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Root />);
}
