import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/mutant_battle_ball/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/mutant_battle_ball/data.yaml?raw';
import uiRaw from '../../../../games/mutant_battle_ball/ui.yaml?raw';
import systemsRaw from '../../../../games/mutant_battle_ball/systems.yaml?raw';
import logicRaw from '../../../../games/mutant_battle_ball/logic.lua?raw';
const gameId = 'mutant_battle_ball';

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
