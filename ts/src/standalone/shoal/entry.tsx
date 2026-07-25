import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/shoal/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/shoal/data.yaml?raw';
import uiRaw from '../../../../games/shoal/ui.yaml?raw';
import systemsRaw from '../../../../games/shoal/systems.yaml?raw';
import utilsRaw from '../../../../games/shoal/utils.lua?raw';
import stateRaw from '../../../../games/shoal/state.lua?raw';
import entitiesRaw from '../../../../games/shoal/entities.lua?raw';
import steeringRaw from '../../../../games/shoal/steering.lua?raw';
import logicRaw from '../../../../games/shoal/logic.lua?raw';
import primitives_actionRaw from '../../../../engine/primitives/action.lua?raw';
const gameId = 'shoal';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: {
    'utils.lua': utilsRaw,
    'state.lua': stateRaw,
    'entities.lua': entitiesRaw,
    'steering.lua': steeringRaw,
    'logic.lua': logicRaw,
  },
  engineLuaFiles: {
    'primitives/action.lua': primitives_actionRaw,
  },
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
