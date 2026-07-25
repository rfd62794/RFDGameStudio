import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/slimeworld/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/slimeworld/data.yaml?raw';
import uiRaw from '../../../../games/slimeworld/ui.yaml?raw';
import systemsRaw from '../../../../games/slimeworld/systems.yaml?raw';
import logicRaw from '../../../../games/slimeworld/logic.lua?raw';
import breedingRaw from '../../../../games/slimeworld/breeding.lua?raw';
import territoryRaw from '../../../../games/slimeworld/territory.lua?raw';
import missionsRaw from '../../../../games/slimeworld/missions.lua?raw';
import economyRaw from '../../../../games/slimeworld/economy.lua?raw';
import codexRaw from '../../../../games/slimeworld/codex.lua?raw';
import actionRaw from '../../../../engine/primitives/action.lua?raw';

const gameId = 'slimeworld';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: {
    'breeding.lua': breedingRaw,
    'territory.lua': territoryRaw,
    'missions.lua': missionsRaw,
    'economy.lua': economyRaw,
    'codex.lua': codexRaw,
    'logic.lua': logicRaw,
  },
  engineLuaFiles: { 'primitives/action.lua': actionRaw },
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
