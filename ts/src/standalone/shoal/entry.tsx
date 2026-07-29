import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/shoal/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/shoal/data.yaml?raw';
import uiRaw from '../../../../games/shoal/ui.yaml?raw';
import systemsRaw from '../../../../games/shoal/systems.yaml?raw';

const luaModules = import.meta.glob('../../../../games/shoal/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function toGameLuaFiles(modules: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(modules)) {
    out[path.split('/').pop()!] = content;
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

function toEngineLuaFiles(modules: Record<string, string>, subdir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(modules)) {
    const fileName = path.split('/').pop()!;
    out[`${subdir}/${fileName}`] = content;
  }
  return out;
}

const gameId = 'shoal';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: toGameLuaFiles(luaModules),
  engineLuaFiles: {
    ...toEngineLuaFiles(engineLuaModules, 'primitives'),
    ...toEngineLuaFiles(engineSystemModules, 'systems'),
  },
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
