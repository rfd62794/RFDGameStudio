import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/succession/App';
import type { GameSession } from '../../engine/types';

const session: GameSession = {
  gameId: 'succession',
  files: {
    gameId: 'succession',
    data: {},
    ui: {},
    logic: '',
    engineSource: '',
  },
  executor: {
    call: () => [],
  },
};

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
