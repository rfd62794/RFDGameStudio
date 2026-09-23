import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/planetofgreed/App';
import type { GameSession } from '../../engine/types';

// Planet of Greed is a TS-native game with no Lua files, no data.yaml,
// and no session.files dependency. The App component destructures
// `session` but never references it — all game state is self-contained
// via localStorage. This entry constructs a minimal session that
// satisfies the GameSession interface without requiring buildStandaloneSession
// (which assumes Lua files exist in games/{gameId}/).
const session: GameSession = {
  gameId: 'planetofgreed',
  files: {
    gameId: 'planetofgreed',
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
