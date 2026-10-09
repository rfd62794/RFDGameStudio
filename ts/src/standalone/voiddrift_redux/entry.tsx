import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/voiddrift_redux/App';
import type { GameSession } from '../../engine/types';

const session: GameSession = {
  gameId: 'voiddrift_redux',
  files: {
    gameId: 'voiddrift_redux',
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
