// new: ts/src/standalone/gladiator_arena/entry.tsx
import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/gladiator_arena/App';
import type { GameSession } from '../../engine/types';

// Gladiator Arena is a TS-native game with no Lua files, no data.yaml,
// and no session.files dependency. The App component destructures
// `session` but never references it — all game state is self-contained
// via localStorage. This entry constructs a minimal session that
// satisfies the GameSession interface without requiring buildStandaloneSession
// (which assumes Lua files exist in games/{gameId}/).
const session: GameSession = {
  gameId: 'gladiator_arena',
  files: {
    gameId: 'gladiator_arena',
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
