import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/grainworks/TitleGate';
import type { GameSession } from '../../engine/types';

const session: GameSession = {
  gameId: 'grainworks',
  files: {
    gameId: 'grainworks',
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
