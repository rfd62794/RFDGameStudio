import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/brewfield/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/brewfield/data.yaml?raw';
import uiRaw from '../../../../games/brewfield/ui.yaml?raw';
import systemsRaw from '../../../../games/brewfield/systems.yaml?raw';
import logicRaw from '../../../../games/brewfield/logic.lua?raw';

const gameId = 'brewfield';

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
