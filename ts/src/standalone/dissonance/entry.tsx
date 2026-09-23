import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/dissonance/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/dissonance/data.yaml?raw';
import uiRaw from '../../../../games/dissonance/ui.yaml?raw';
import systemsRaw from '../../../../games/dissonance/systems.yaml?raw';

const gameLuaModules = import.meta.glob('../../../../games/dissonance/logic/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function toGameLuaFiles(modules: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [modulePath, content] of Object.entries(modules)) {
    // Keep the "logic/*.lua" subpath expected by systems.yaml's lua_files list.
    const parts = modulePath.split('/');
    out[parts.slice(-2).join('/')] = content;
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

const gameId = 'dissonance';

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
