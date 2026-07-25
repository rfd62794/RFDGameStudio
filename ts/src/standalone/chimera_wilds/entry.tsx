import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/chimera_wilds/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/chimera_wilds/data.yaml?raw';
import uiRaw from '../../../../games/chimera_wilds/ui.yaml?raw';
import systemsRaw from '../../../../games/chimera_wilds/systems.yaml?raw';
import logicRaw from '../../../../games/chimera_wilds/logic.lua?raw';
const gameId = 'chimera_wilds';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: {
    'logic.lua': logicRaw,
  },
  engineLuaFiles: { },
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
