import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/voidrift_particle_sandbox/TitleGate';
import type { GameSession } from '../../engine/types';

const session: GameSession = {
  gameId: 'voidrift_particle_sandbox',
  files: {
    gameId: 'voidrift_particle_sandbox',
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
