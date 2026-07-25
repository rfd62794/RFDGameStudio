import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/scrapcrawl/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/scrapcrawl/data.yaml?raw';
import uiRaw from '../../../../games/scrapcrawl/ui.yaml?raw';
import systemsRaw from '../../../../games/scrapcrawl/systems.yaml?raw';
import logicRaw from '../../../../games/scrapcrawl/logic.lua?raw';
import actionRaw from '../../../../engine/primitives/action.lua?raw';

const gameId = 'scrapcrawl';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: {
    'logic.lua': logicRaw,
  },
  engineLuaFiles: {
    'primitives/action.lua': actionRaw,
  },
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
