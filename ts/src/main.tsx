import ReactDOM from 'react-dom/client';
import './index.css';
import { GameSelector, GameLoader, getGameId, getPageId } from './arcade';
import { findGame } from './games/registry';
import StatusBoardPage from './pages/StatusBoardPage';

// The shared bundle serves every game from one index.html, whose <title> is baked
// at build time — so every game in it showed whichever game was built last
// ("RFDGameStudio - Derby Sim" on all seven). The title is a runtime property of
// which game the ?game= param selected, so set it at runtime.
function useDocumentTitle(gameId: string | null) {
  const label = gameId ? findGame(gameId)?.label : undefined;
  document.title = label ? `${label} - RFDGameStudio` : 'RFDGameStudio Arcade';
}

function Root() {
  const pageId = getPageId();
  if (pageId === 'status') {
    document.title = 'Status - RFDGameStudio';
    return <StatusBoardPage />;
  }

  const gameId = getGameId();
  useDocumentTitle(gameId);
  return gameId ? <GameLoader gameId={gameId} /> : <GameSelector />;
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Root />);
}
