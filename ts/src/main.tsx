import ReactDOM from 'react-dom/client';
import './index.css';
import { GameSelector, GameLoader, getGameId, getPageId } from './arcade';
import StatusBoardPage from './pages/StatusBoardPage';

function Root() {
  const pageId = getPageId();
  if (pageId === 'status') return <StatusBoardPage />;

  const gameId = getGameId();
  return gameId ? <GameLoader gameId={gameId} /> : <GameSelector />;
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Root />);
}
