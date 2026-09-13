# RFDGameStudio — Phase 2l Directive: GameRenderer Interface

*June 2026 | Read fully before executing anything.*
*Establishes the formal contract for adding games. Floors must hold throughout.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 42 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 17 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## §0 Context

**The problem:**

The game router in `main.tsx` is informal — it's a plain `Record<string, lazy>`.
Adding a game means editing main.tsx and knowing that game's internal structure.
Each game App.tsx loads its own session, handles its own loading states, and has
no formal entry point contract.

The result: slither_rogue and horse_racing share no structural pattern despite
being the same kind of thing. Adding coin_pusher means copy-pasting the same
session loading code a third time.

**What this phase delivers:**

- `GameConfig` and `GameRendererProps` interfaces in `types.ts`
- Formal `GAME_REGISTRY` in `ts/src/games/registry.ts`
- Per-game `config.ts` files declaring each game's metadata
- `main.tsx` uses the registry and loads sessions centrally via `GameLoader`
- Both `App.tsx` files accept `session: GameSession` as a prop
- Centralized error boundary for session load failures
- TypeScript floor: 17 → 19

---

## §1 Scope

| File | Action |
|---|---|
| `ts/src/engine/types.ts` | Add `GameConfig`, `GameRendererProps` |
| `ts/src/games/registry.ts` | New — formal game registry |
| `ts/src/games/horse_racing/config.ts` | New — horse_racing config |
| `ts/src/games/slither_rogue/config.ts` | New — slither_rogue config |
| `ts/src/main.tsx` | Use registry, centralized session loading |
| `ts/src/games/horse_racing/App.tsx` | Accept `session` prop, remove internal `loadGame` |
| `ts/src/games/slither_rogue/App.tsx` | Accept `session` prop, remove internal `loadGame` |
| `ts/tests/test_runtime.ts` | Add 2 new tests → floor 17→19 |

**Read-only — do not touch:**
All Python files, `ts/src/engine/loader.ts`, all game components except App.tsx.

---

## §2 types.ts — Add Interface

Add after the existing `GameSession` interface:

```typescript
/**
 * Props received by every game renderer component.
 * The router loads the session and passes it here.
 * Games must not call loadGame() internally.
 */
export interface GameRendererProps {
  session: GameSession;
}

/**
 * Registration entry for a game in the studio router.
 * Each game exports one of these from its config.ts.
 */
export interface GameConfig {
  gameId: string;           // matches games/ directory name
  label: string;            // display name in router/UI
  description?: string;     // optional tagline
  component: React.LazyExoticComponent<React.ComponentType<GameRendererProps>>;
}
```

Add `import React from 'react'` or `import type { ComponentType, LazyExoticComponent } from 'react'`
at the top of types.ts if React types are not already imported.

> ⚠️ RULE: `GameRendererProps` is the single prop contract every game must
> satisfy. No game component may accept additional required props beyond `session`.
> Optional props for dev/debug purposes are allowed.

---

## §3 Per-Game Config Files

### §3.1 ts/src/games/horse_racing/config.ts

```typescript
import React from 'react';
import type { GameConfig } from '../../engine/types';

export const horseRacingConfig: GameConfig = {
  gameId: 'horse_racing',
  label: 'Derby Sim',
  description: 'Horse racing, breeding, and betting',
  component: React.lazy(() => import('./App')),
};
```

### §3.2 ts/src/games/slither_rogue/config.ts

```typescript
import React from 'react';
import type { GameConfig } from '../../engine/types';

export const slitherRogueConfig: GameConfig = {
  gameId: 'slither_rogue',
  label: 'Snake Roguelike',
  description: 'Slither, mutate, steal segments',
  component: React.lazy(() => import('./App')),
};
```

---

## §4 ts/src/games/registry.ts

```typescript
import type { GameConfig } from '../engine/types';
import { horseRacingConfig } from './horse_racing/config';
import { slitherRogueConfig } from './slither_rogue/config';

/**
 * Formal game registry. Add new games here.
 * Order determines display order in any future game selector UI.
 */
export const GAME_REGISTRY: GameConfig[] = [
  horseRacingConfig,
  slitherRogueConfig,
];

/**
 * Look up a game config by ID. Returns undefined if not found.
 */
export function findGame(gameId: string): GameConfig | undefined {
  return GAME_REGISTRY.find(g => g.gameId === gameId);
}

/**
 * Look up a game config by ID. Returns the first registered game as fallback.
 */
export function findGameOrDefault(gameId: string): GameConfig {
  return findGame(gameId) ?? GAME_REGISTRY[0];
}
```

---

## §5 ts/src/main.tsx — Centralized Session Loading

Replace the entire file:

```tsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './ui/tokens.css';
import './ui/base.css';
import { loadGame } from './engine/loader';
import type { GameSession } from './engine/types';
import { findGameOrDefault } from './games/registry';

const GAME_ID = new URLSearchParams(window.location.search).get('game')
  ?? 'horse_racing';

/**
 * GameLoader — loads the Lua session for the selected game,
 * then renders the game component with the session as a prop.
 * Handles loading and error states centrally so individual games don't have to.
 */
function GameLoader({ gameId }: { gameId: string }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = loadGame(gameId, 42);
      setSession(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to load game: ${gameId}`);
    }
  }, [gameId]);

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#f87171', fontFamily: 'monospace' }}>
        <strong>Studio Error</strong>
        <p>{error}</p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Game ID: {gameId} — Check that {gameId}/data.yaml and {gameId}/logic.lua exist.
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: '2rem', color: '#6b7280' }}>
        Loading {gameId}…
      </div>
    );
  }

  const config = findGameOrDefault(gameId);
  const GameComponent = config.component;

  return (
    <React.Suspense
      fallback={<div style={{ padding: '2rem', color: '#6b7280' }}>Loading renderer…</div>}
    >
      <GameComponent session={session} />
    </React.Suspense>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GameLoader gameId={GAME_ID} />
);
```

---

## §6 horse_racing/App.tsx — Accept session prop

**Read the full file before touching it.**

Changes:
1. Change the function signature to accept `GameRendererProps`:
   ```typescript
   import type { GameRendererProps } from '../../engine/types';
   
   export default function App({ session }: GameRendererProps) {
   ```

2. Remove the internal `loadGame` call and the `useState<GameSession | null>`
   state. The `session` is now received as a prop — it is always defined when
   this component renders.

3. Remove the loading/null guard that was needed when session was async:
   ```typescript
   // REMOVE: if (!session) return <div>Loading...</div>;
   ```

4. Where `session` was previously set via `setSession(loadGame(...))`,
   it is now simply the `session` prop. Update all references accordingly.

> ⚠️ RULE: The component must NOT call `loadGame()` internally after this
> phase. Session loading is the router's responsibility.

> ⚠️ RULE: If the existing App.tsx uses a `session` state variable throughout,
> rename the prop to `session` and delete the state. All downstream references
> to `session` remain the same — only the source changes.

---

## §7 slither_rogue/App.tsx — Accept session prop

Same pattern as §6:

1. Change function signature:
   ```typescript
   import type { GameRendererProps } from '../../engine/types';
   
   export default function App({ session }: GameRendererProps) {
   ```

2. Remove internal `loadGame` call and `useState<GameSession | null>`.

3. Remove loading guard.

4. `session` is passed through to `GameCanvas` as it already was —
   no change to GameCanvas.tsx.

> ⚠️ NOTE: slither_rogue's App.tsx passes `session` to `GameCanvas` which
> calls `call(session, 'init_game', ...)` and `call(session, 'tick_game', ...)`.
> Those call sites are unchanged — only the source of `session` changes.

---

## §8 New TypeScript Tests

Add to `ts/tests/test_runtime.ts`. Target: **17 → 19 passed**

| # | Test | Behavior |
|---|---|---|
| 18 | `test_game_registry_has_two_games` | `GAME_REGISTRY.length === 2` |
| 19 | `test_find_game_returns_correct_config` | `findGame('horse_racing')?.gameId === 'horse_racing'` |

Import in the test file:
```typescript
import { GAME_REGISTRY, findGame, findGameOrDefault } from '../src/games/registry';
```

---

## §9 Completion Criteria

- [ ] `uv run pytest -v` → **42 passed, 0 failed, 0 skipped** (unchanged)
- [ ] `cd ts && npx vitest run` → **19 passed, 0 failed, 0 skipped**
- [ ] `cd ts && npx vite build` → exits 0
- [ ] `grep -n "loadGame" ts/src/games/horse_racing/App.tsx` → zero matches
- [ ] `grep -n "loadGame" ts/src/games/slither_rogue/App.tsx` → zero matches
- [ ] `grep -n "loadGame" ts/src/main.tsx` → exactly 1 match (in GameLoader)
- [ ] `ts/src/games/registry.ts` exists with `GAME_REGISTRY`, `findGame`, `findGameOrDefault`
- [ ] `ts/src/games/horse_racing/config.ts` exists
- [ ] `ts/src/games/slither_rogue/config.ts` exists
- [ ] Browser: `?game=horse_racing` — loads and plays correctly
- [ ] Browser: `?game=slither_rogue` — loads and plays correctly
- [ ] Browser: `?game=invalid_id` — shows error message with game ID, not a crash
- [ ] `docs/state/current.md` updated to Phase 2l certified

**Proof required:**
- Raw `uv run pytest -v` output (42/0/0)
- Raw `npx vitest run` output (19/0/0)
- `grep -n "loadGame" ts/src/games/horse_racing/App.tsx` output (zero)
- `grep -n "loadGame" ts/src/games/slither_rogue/App.tsx` output (zero)

---

## §10 What This Unlocks

**Adding coin_pusher after Phase 2l:**

1. Create `games/coin_pusher/` with four files
2. Create `ts/src/games/coin_pusher/App.tsx` — accepts `{ session: GameSession }`
3. Create `ts/src/games/coin_pusher/config.ts` — exports `coinPusherConfig`
4. Add `coinPusherConfig` to `ts/src/games/registry.ts`
5. Add `?game=coin_pusher` to the router — it works immediately

**No edits to `loader.ts` (Phase 2k handled that).**
**No edits to `main.tsx`.**
**No knowledge of coin_pusher's internals required at the router level.**

That's the contract.

---

## §11 Quick Reference

| Item | Value |
|---|---|
| Python floor | 42 / 0 / 0 (unchanged) |
| TypeScript floor | 17 → 19 / 0 / 0 |
| New interfaces | `GameConfig`, `GameRendererProps` in types.ts |
| New files | registry.ts, horse_racing/config.ts, slither_rogue/config.ts |
| Session loading | Moves from each App.tsx to GameLoader in main.tsx |
| Error handling | Centralized in GameLoader — bad gameId shows error, not crash |
| Next phase | Phase 2m — ui.yaml interpreter (component tree from declarations) |

---

*RFDGameStudio Phase 2l | June 2026 | RFD IT Services Ltd.*
*The renderer interface is the contract. Adding a game is: config.ts + registry entry.*
*The router handles the rest.*
