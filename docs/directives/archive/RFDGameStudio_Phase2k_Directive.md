# RFDGameStudio — Phase 2k Directive: Dynamic Lua Loading

*June 2026 | Read fully before executing anything.*
*Stability fix. Zero behavior change. Enables adding new games without code changes.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 42 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 17 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## §0 Context

**The scaling problem:**

`ts/src/engine/loader.ts` currently imports every Lua file with a static `?raw`
import and maintains a `LUA_FILE_MAP` dictionary:

```typescript
import srUtilsRaw     from '../../games/slither_rogue/utils.lua?raw';
import srStateRaw     from '../../games/slither_rogue/state.lua?raw';
// ... 4 more for slither_rogue
// ... 10 more for engine primitives + systems

const LUA_FILE_MAP: Record<string, string> = {
  'utils.lua': srUtilsRaw,
  // ...
};
```

Adding coin_pusher and mutant_battle_ball means 10-14 more manual entries.
Forgetting one causes a silent empty string — Lua loads but a function is nil.
This is a fragile pattern that doesn't scale.

**The fix:**

Vite's `import.meta.glob()` discovers all `.lua` files at build time automatically.
The glob result is a static Record of file path → content. Adding a new game
with any number of Lua files requires zero changes to `loader.ts`.

**What changes:**
- `ts/src/engine/loader.ts` — replace static imports + LUA_FILE_MAP with glob
- No Python changes
- No game file changes
- No test changes

---

## §1 Scope

| File | Action |
|---|---|
| `ts/src/engine/loader.ts` | Replace static `?raw` imports + LUA_FILE_MAP with `import.meta.glob` |

**Read-only — do not touch:**
All Python files, all game files, all test files, all other TypeScript files.

---

## §2 Implementation

### §2.1 Read current loader.ts in full before touching it

The exact import lines and the `LUA_FILE_MAP` must be identified before
any edits. Do not assume — read the file.

### §2.2 Replace static imports with glob

At the top of `loader.ts`, remove ALL `?raw` import lines for game Lua files
and engine Lua files. Replace with two glob statements:

```typescript
// Auto-discover all game Lua files at build time
// Key format: '../../games/{game_id}/{file}.lua'
const GAME_LUA_FILES = import.meta.glob(
  '../../games/**/*.lua',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

// Auto-discover all engine Lua files at build time
// Key format: '../../engine/{subdir}/{file}.lua'
const ENGINE_LUA_FILES = import.meta.glob(
  '../../engine/**/*.lua',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;
```

> ⚠️ RULE: `eager: true` is required. Without it, the glob returns async
> import functions, not content. The loader is synchronous.

> ⚠️ RULE: The key format from `import.meta.glob` is the exact relative path
> used in the glob pattern. For a file at `games/slither_rogue/utils.lua`,
> the key is `'../../games/slither_rogue/utils.lua'`. Verify this by logging
> `Object.keys(GAME_LUA_FILES)` in a quick test if uncertain.

### §2.3 Replace LUA_FILE_MAP with lookup helpers

Remove the `LUA_FILE_MAP` constant entirely. Replace with two helper functions:

```typescript
/**
 * Get the content of a game-specific Lua file.
 * gameId: directory name under games/ (e.g. 'horse_racing')
 * fileName: file name with extension (e.g. 'logic.lua', 'utils.lua')
 */
function getGameLua(gameId: string, fileName: string): string {
  const key = `../../games/${gameId}/${fileName}`;
  const content = GAME_LUA_FILES[key];
  if (content === undefined) {
    console.warn(`[loader] Lua file not found: ${key}`);
    return '';
  }
  return content;
}

/**
 * Get the content of an engine Lua file.
 * subdir: 'primitives' or 'systems'
 * fileName: file name with extension (e.g. 'action.lua')
 */
function getEngineLua(subdir: string, fileName: string): string {
  const key = `../../engine/${subdir}/${fileName}`;
  const content = ENGINE_LUA_FILES[key];
  if (content === undefined) {
    console.warn(`[loader] Engine Lua file not found: ${key}`);
    return '';
  }
  return content;
}
```

### §2.4 Update ENGINE_SOURCE build

Replace the hardcoded engine file list with glob-based assembly. The load order
of primitives must be preserved (dependency order per ADR-007):

```typescript
const PRIMITIVE_ORDER = [
  'action.lua',
  'entity.lua',
  'resolution.lua',
  'consequence.lua',
  'movement.lua',
  'physics.lua',
  'lifecycle.lua',
];

function buildEngineSource(engineSystems: string[]): string {
  const parts: string[] = [];

  // Load primitives in dependency order
  for (const fileName of PRIMITIVE_ORDER) {
    const src = getEngineLua('primitives', fileName);
    if (src) parts.push(src);
  }

  // Load declared engine systems
  for (const systemId of (engineSystems ?? [])) {
    const src = getEngineLua('systems', `${systemId}.lua`);
    if (src) parts.push(src);
  }

  return parts.join('\n\n');
}
```

### §2.5 Update loadGameFiles()

Replace the existing logic for loading game Lua files:

```typescript
function loadGameFiles(gameId: string): GameFiles {
  // ... existing data/ui/systems loading unchanged ...

  const systemsData = yaml.load(systemsSrc) as Record<string, unknown> ?? {};
  const luaFileList = systemsData['lua_files'] as string[] | undefined;
  const engineSystems = systemsData['engine_systems'] as string[] | undefined;

  // Build engine source
  const engineSource = buildEngineSource(engineSystems ?? []);

  // Build game logic source
  let logicSource: string;
  if (luaFileList && luaFileList.length > 0) {
    // Multi-file game: load in declared order
    logicSource = luaFileList
      .map(f => getGameLua(gameId, f))
      .join('\n\n');
  } else {
    // Single-file game (horse_racing backward compat)
    logicSource = getGameLua(gameId, 'logic.lua');
  }

  return {
    gameId,
    data: yaml.load(dataSrc) as Record<string, unknown>,
    ui: yaml.load(uiSrc) as Record<string, unknown>,
    logic: logicSource,
    engineSource,
  };
}
```

> ⚠️ RULE: The `systems.yaml` and `data.yaml` loading remains unchanged —
> those are already handled correctly. Only the Lua source assembly changes.

> ⚠️ RULE: `horse_racing` has no `lua_files` key in `systems.yaml`. The
> fallback to `logic.lua` must work. Verify by running all tests after the change.

### §2.6 Remove the systems.yaml ?raw import for slither_rogue

The existing loader likely has a static `?raw` import for `systems.yaml` files
as well. If so, extend the glob to cover yaml files OR load systems.yaml from
the glob. Check the existing loader and handle consistently.

> ⚠️ NOTE: `data.yaml`, `ui.yaml`, and `systems.yaml` may be loaded differently
> from Lua files (they may use the runtime asset pipeline rather than `?raw`).
> Read the existing loader carefully before touching yaml loading.
> Only change the Lua loading. Leave yaml loading as-is if it already works.

---

## §3 Verification

### After the change:

```bash
cd ts && npx vite build    # must exit 0
cd ts && npx vitest run    # must be 17/0/0
uv run pytest -v           # must be 42/0/0 (Python unchanged)
```

### Functional verification in browser:

- `?game=horse_racing` — game loads, plays correctly, `create_race` works
- `?game=slither_rogue` — game loads, plays correctly, `tick_game` works
- Check browser console for any `[loader] Lua file not found` warnings — must be zero

### Glob key verification (optional debug step):

If uncertain about glob key format, add a temporary log before removing:

```typescript
console.log('[loader] Available game Lua keys:', Object.keys(GAME_LUA_FILES));
console.log('[loader] Available engine Lua keys:', Object.keys(ENGINE_LUA_FILES));
```

Remove the log before committing.

---

## §4 What This Unlocks

After Phase 2k, adding `coin_pusher` or `mutant_battle_ball` as a game:

1. Create `games/coin_pusher/` with four files
2. Create `ts/src/games/coin_pusher/` with App.tsx + components
3. Add `coin_pusher` to the game router in `main.tsx`

**Zero changes needed to `loader.ts`.** The glob discovers the new Lua files
automatically at the next `vite build`. This is what the system needs to scale
to four, six, or twenty games.

---

## §5 Completion Criteria

- [ ] `uv run pytest -v` → **42 passed, 0 failed, 0 skipped** (unchanged)
- [ ] `cd ts && npx vitest run` → **17 passed, 0 failed, 0 skipped** (unchanged)
- [ ] `cd ts && npx vite build` → exits 0
- [ ] No static `?raw` import lines for game or engine Lua files remain in `loader.ts`
- [ ] No `LUA_FILE_MAP` constant remains in `loader.ts`
- [ ] `GAME_LUA_FILES` and `ENGINE_LUA_FILES` globs present at top of file
- [ ] `horse_racing` loads and plays correctly in browser
- [ ] `slither_rogue` loads and plays correctly in browser
- [ ] Zero `[loader] Lua file not found` warnings in browser console
- [ ] `docs/state/current.md` updated to Phase 2k certified

**Proof required:**
- Raw `uv run pytest -v` output (42/0/0)
- Raw `npx vitest run` output (17/0/0)
- `grep -n "srUtilsRaw\|srStateRaw\|LUA_FILE_MAP" ts/src/engine/loader.ts` → zero matches

---

## §6 Quick Reference

| Item | Value |
|---|---|
| Python floor | 42 / 0 / 0 (unchanged) |
| TypeScript floor | 17 / 0 / 0 (unchanged) |
| Files changed | `ts/src/engine/loader.ts` only |
| Glob pattern (games) | `'../../games/**/*.lua'` |
| Glob pattern (engine) | `'../../engine/**/*.lua'` |
| Glob options | `{ query: '?raw', import: 'default', eager: true }` |
| Primitive load order | action → entity → resolution → consequence → movement → physics → lifecycle |
| Backward compat | horse_racing: no lua_files key → falls through to single logic.lua |
| Next phase | Phase 2l — Mutant Battle Ball extraction and port |

---

*RFDGameStudio Phase 2k | June 2026 | RFD IT Services Ltd.*
*One glob per directory. Zero manual imports. Every new game is free.*
