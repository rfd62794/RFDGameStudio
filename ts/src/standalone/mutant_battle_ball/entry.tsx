import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/mutant_battle_ball/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/mutant_battle_ball/data.yaml?raw';
import uiRaw from '../../../../games/mutant_battle_ball/ui.yaml?raw';
import systemsRaw from '../../../../games/mutant_battle_ball/systems.yaml?raw';

const gameLuaModules = import.meta.glob('../../../../games/mutant_battle_ball/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function toGameLuaFiles(modules: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [modulePath, content] of Object.entries(modules)) {
    out[modulePath.split('/').pop()!] = content;
  }
  return out;
}

const engineLuaModules = import.meta.glob('../../../../engine/primitives/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const engineSystemModules = import.meta.glob('../../../../engine/systems/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function toEngineLuaFiles(
  modules: Record<string, string>,
  subdir: string
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [modulePath, content] of Object.entries(modules)) {
    const fileName = modulePath.split('/').pop()!;
    out[`${subdir}/${fileName}`] = content;
  }
  return out;
}

const gameId = 'mutant_battle_ball';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: toGameLuaFiles(gameLuaModules),
  engineLuaFiles: {
    ...toEngineLuaFiles(engineLuaModules, 'primitives'),
    ...toEngineLuaFiles(engineSystemModules, 'systems'),
  },
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
