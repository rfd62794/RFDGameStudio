import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..', '..');

const PRIMITIVE_ORDER = [
  'action',
  'entity',
  'resolution',
  'consequence',
  'movement',
  'physics',
  'lifecycle',
];

const SYSTEM_ORDER = ['combat', 'genetics', 'market', 'odds'];

function toIdentifier(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const sanitized = base.replace(/[^a-zA-Z0-9]/g, '_');
  return sanitized + 'Raw';
}

function readYaml(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  return (yaml.load(readFileSync(path, 'utf8')) ?? {}) as Record<string, unknown>;
}

function parseAuditRow(gameId: string): { primitives: string[]; systems: string[] } {
  const auditPath = resolve(REPO_ROOT, 'docs', 'analysis', 'logic-layer-compliance-audit.md');
  const audit = readFileSync(auditPath, 'utf8');

  const rowRegex = new RegExp(`\\|\\s*\`${gameId}\`\\s*\\|([^\\n]+)\\|`, 'i');
  const match = audit.match(rowRegex);
  if (!match) {
    return { primitives: [], systems: [] };
  }

  const cells = match[1].split('|').map((c) => c.trim());
  // matrix columns: action, consequence, entity, lifecycle, movement, physics, resolution, combat, genetics, market, odds
  const primitiveCells = cells.slice(0, 7);
  const systemCells = cells.slice(7, 11);

  const primitives: string[] = [];
  PRIMITIVE_ORDER.forEach((name, idx) => {
    if (primitiveCells[idx] && primitiveCells[idx].includes('**U**')) {
      primitives.push(name);
    }
  });

  const systems: string[] = [];
  SYSTEM_ORDER.forEach((name, idx) => {
    if (systemCells[idx] && systemCells[idx].includes('**U**')) {
      systems.push(name);
    }
  });

  return { primitives, systems };
}

function getGameLuaFiles(gameId: string): string[] {
  const systems = readYaml(resolve(REPO_ROOT, 'games', gameId, 'systems.yaml'));
  const luaFiles = systems?.['lua_files'] as string[] | undefined;
  if (luaFiles && luaFiles.length > 0) {
    return luaFiles;
  }
  const fallback = resolve(REPO_ROOT, 'games', gameId, 'logic.lua');
  if (existsSync(fallback)) {
    return ['logic.lua'];
  }
  throw new Error(`No Lua files found for ${gameId}`);
}

function getEngineLuaFiles(gameId: string): { key: string; file: string }[] {
  const { primitives, systems } = parseAuditRow(gameId);
  const systemsYaml = readYaml(resolve(REPO_ROOT, 'games', gameId, 'systems.yaml'));
  const extraSystems = (systemsYaml?.['engine_systems'] as string[] | undefined) ?? [];
  const allSystems = [...new Set([...systems, ...extraSystems])];

  const result: { key: string; file: string }[] = [];
  for (const name of PRIMITIVE_ORDER) {
    if (primitives.includes(name)) {
      result.push({ key: `primitives/${name}.lua`, file: `../../../../engine/primitives/${name}.lua?raw` });
    }
  }
  for (const name of SYSTEM_ORDER) {
    if (allSystems.includes(name)) {
      result.push({ key: `systems/${name}.lua`, file: `../../../../engine/systems/${name}.lua?raw` });
    }
  }
  return result;
}

function getGameTitle(gameId: string): string {
  const data = readYaml(resolve(REPO_ROOT, 'games', gameId, 'data.yaml'));
  const game = data?.['game'] as Record<string, unknown> | undefined;
  if (game && typeof game['name'] === 'string') {
    return game['name'];
  }
  return gameId.charAt(0).toUpperCase() + gameId.slice(1);
}

export function generateStandaloneEntry(gameId: string): { entry: string; html: string } {
  const gameLuaFiles = getGameLuaFiles(gameId);
  const engineLuaFiles = getEngineLuaFiles(gameId);

  const gameImports = gameLuaFiles
    .map((file) => `import ${toIdentifier(file)} from '../../../../games/${gameId}/${file}?raw';`)
    .join('\n');

  const engineImports = engineLuaFiles
    .map((file) => `import ${toIdentifier(file.key)} from '${file.file}';`)
    .join('\n');

  const gameLuaMap = gameLuaFiles
    .map((file) => `    '${file}': ${toIdentifier(file)},`)
    .join('\n');

  const engineLuaMap = engineLuaFiles
    .map(({ key }) => `    '${key}': ${toIdentifier(key)},`)
    .join('\n');

  const entry = `import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/${gameId}/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/${gameId}/data.yaml?raw';
import uiRaw from '../../../../games/${gameId}/ui.yaml?raw';
import systemsRaw from '../../../../games/${gameId}/systems.yaml?raw';
${gameImports}${engineImports ? '\n' + engineImports : ''}
const gameId = '${gameId}';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: {
${gameLuaMap}
  },
  engineLuaFiles: {${engineLuaMap ? '\n' + engineLuaMap + '\n  ' : ' '}},
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
`;

  const title = getGameTitle(gameId);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./entry.tsx"></script>
  </body>
</html>
`;

  return { entry, html };
}

export function writeStandaloneEntry(gameId: string): void {
  const outDir = resolve(REPO_ROOT, 'ts', 'src', 'standalone', gameId);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  const { entry, html } = generateStandaloneEntry(gameId);
  writeFileSync(resolve(outDir, 'entry.tsx'), entry, 'utf8');
  writeFileSync(resolve(outDir, 'index.html'), html, 'utf8');
  console.log(`Generated standalone entry for ${gameId} in ${outDir}`);
}

if (import.meta.url === `file://${__filename}`) {
  const gameId = process.argv[2];
  if (!gameId) {
    console.error('Usage: tsx tools/generate-standalone-entry.ts <gameId>');
    process.exit(1);
  }
  writeStandaloneEntry(gameId);
}
