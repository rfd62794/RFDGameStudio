import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/slime_coin/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/slime_coin/data.yaml?raw';
import uiRaw from '../../../../games/slime_coin/ui.yaml?raw';
import systemsRaw from '../../../../games/slime_coin/systems.yaml?raw';
import logicRaw from '../../../../games/slime_coin/logic.lua?raw';

const gameId = 'slime_coin';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: { 'logic.lua': logicRaw },
  engineLuaFiles: {},
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
