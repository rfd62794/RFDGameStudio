# RFDGameStudio — Phase 2t Directive: Shared TypeScript Infrastructure

*June 2026 | Read fully before executing anything.*
*Four hooks. Two components. Surgical wiring into existing games. New games get 12-line App.tsx.*

---

> ⛔ **STOP:** Run `studio_run_tests()` → must report 70 passed, 0 failed.
> TypeScript: `cd ts && npx vitest run` → must report 29 passed, 0 failed.

---

## §0 Context

**The duplication problem — what the code actually shows:**

horse_racing App.tsx (~350 lines) contains:
- A manual `setInterval` for cooldown ticking (6 lines)
- Direct `call(session, fn, ...)` imports with scattered error handling
- Duplicated tab bar (desktop nav + mobile TabBar — two rendering locations)
- `AnimatePresence` + individual `activeTab === 'x' && <XTab>` switches

slither_rogue GameCanvas.tsx contains a manual `requestAnimationFrame` loop
with its own `useRef` + `useEffect` lifecycle management.

Adding coin_pusher today means rebuilding all of this from scratch. The hooks
layer eliminates that. New games get the infrastructure for free.

**What this phase delivers:**

Four hooks in `ts/src/hooks/`:
- `useCooldownTicker` — replaces manual setInterval in horse_racing
- `useLuaCall` — wraps `call(session, fn)` with component-scoped error state
- `useGameLoop` — replaces manual rAF in GameCanvas.tsx
- `useGameState` — loading state + localStorage persistence pattern

Two components in `ts/src/components/`:
- `TabManager` — tab bar + keyboard shortcuts + content switching for new games
- `GameShell` — structural wrapper (header/main/footer slots)

**Surgical approach:** existing game App.tsx files get minimal targeted changes
(replace the ticker, import useLuaCall). Do NOT restructure horse_racing App.tsx —
it works and a full rewrite creates risk. The shared infrastructure is for
coin_pusher and future games.

---

## §1 Scope

| File | Action |
|---|---|
| `ts/src/hooks/useCooldownTicker.ts` | New |
| `ts/src/hooks/useLuaCall.ts` | New |
| `ts/src/hooks/useGameLoop.ts` | New |
| `ts/src/hooks/useGameState.ts` | New |
| `ts/src/hooks/index.ts` | New — re-exports all hooks |
| `ts/src/components/TabManager.tsx` | New |
| `ts/src/components/GameShell.tsx` | New |
| `ts/src/components/index.ts` | New — re-exports all components |
| `ts/src/games/horse_racing/App.tsx` | Surgical: replace ticker, import useLuaCall |
| `ts/src/games/slither_rogue/components/GameCanvas.tsx` | Surgical: replace rAF with useGameLoop |
| `ts/tests/test_shared.ts` | New — 6 tests → 29→35 |

**Read-only — do not touch:**
All Python files, Lua files, PyGame renderer, NSSM services.

**Python floor: 70/0/0 (unchanged)**
**TypeScript floor: 29 → 35**

---

## §2 ts/src/hooks/useCooldownTicker.ts

```typescript
import { useState, useEffect } from 'react';

/**
 * Returns the current timestamp in ms, updated every `intervalMs`.
 * Use for cooldown badge rendering: `horse.cooldown_until > now`
 *
 * Usage:
 *   const now = useCooldownTicker();
 *   const isResting = horse.cooldown_until > now;
 */
export function useCooldownTicker(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
```

---

## §3 ts/src/hooks/useLuaCall.ts

```typescript
import { useState, useCallback } from 'react';
import { call as runtimeCall } from '../engine/runtime';
import type { GameSession } from '../engine/types';

export interface UseLuaCallReturn {
  /** Call a Lua function on the session. Returns the result or null on error. */
  call: (fnName: string, ...args: unknown[]) => unknown;
  /** Last error from a Lua call, or null. */
  error: string | null;
  /** Clear the error state. */
  clearError: () => void;
}

/**
 * Returns a stable `call` function bound to `session` with component-scoped
 * error state. Eliminates repeated try/catch in game handlers.
 *
 * Usage:
 *   const { call, error, clearError } = useLuaCall(session);
 *   const result = call('simulate_race', participants, config);
 */
export function useLuaCall(session: GameSession): UseLuaCallReturn {
  const [error, setError] = useState<string | null>(null);

  const call = useCallback((fnName: string, ...args: unknown[]): unknown => {
    try {
      return runtimeCall(session, fnName, ...args);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    }
  }, [session]);

  const clearError = useCallback(() => setError(null), []);

  return { call, error, clearError };
}
```

---

## §4 ts/src/hooks/useGameLoop.ts

```typescript
import { useEffect, useRef } from 'react';

export interface UseGameLoopOptions {
  /** Pause the loop without unmounting. Default: false. */
  paused?: boolean;
  /**
   * Cap dt to this value in seconds. Prevents spiral-of-death on tab focus.
   * Default: 0.05 (50ms = ~20fps minimum)
   */
  maxDt?: number;
}

/**
 * Drives a requestAnimationFrame loop at native refresh rate.
 * Calls `tickFn(dt)` each frame where dt is seconds since last frame.
 *
 * The tickFn ref is kept fresh — changing the callback does NOT restart the
 * loop, so stable useCallback refs are NOT required.
 *
 * Usage:
 *   useGameLoop((dt) => {
 *     const state = call(session, 'tick_game', dt, input);
 *     setRenderState(state);
 *   }, { paused: isPaused });
 */
export function useGameLoop(
  tickFn: (dt: number) => void,
  options: UseGameLoopOptions = {}
): void {
  const { paused = false, maxDt = 0.05 } = options;
  const tickRef = useRef(tickFn);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  // Keep tickFn ref current without restarting the loop
  useEffect(() => {
    tickRef.current = tickFn;
  });

  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const loop = (time: number) => {
      if (lastTimeRef.current !== null) {
        const dt = Math.min((time - lastTimeRef.current) / 1000, maxDt);
        tickRef.current(dt);
      }
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [paused, maxDt]);
}
```

---

## §5 ts/src/hooks/useGameState.ts

```typescript
import { useState, useEffect } from 'react';
import type { GameSession } from '../engine/types';

export interface UseGameStateReturn<T> {
  state: T | null;
  setState: React.Dispatch<React.SetStateAction<T | null>>;
  isInitialized: boolean;
  initError: string | null;
}

/**
 * Initializes game state from a session.
 * Handles the loading state and initialization error pattern
 * that every game App.tsx currently implements manually.
 *
 * Usage:
 *   const { state, setState, isInitialized } = useGameState(
 *     session,
 *     (s) => buildInitialState(s)
 *   );
 *
 * Note: `init` is called once on mount. Changing `init` reference does NOT
 * re-run initialization — keep it stable or wrap in useCallback.
 */
export function useGameState<T>(
  session: GameSession,
  init: (session: GameSession) => T
): UseGameStateReturn<T> {
  const [state, setState] = useState<T | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setState(init(session));
    } catch (e) {
      setInitError(e instanceof Error ? e.message : String(e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]); // intentionally exclude `init` — should be stable at call site

  return {
    state,
    setState,
    isInitialized: state !== null,
    initError,
  };
}
```

---

## §6 ts/src/hooks/index.ts

```typescript
export { useCooldownTicker } from './useCooldownTicker';
export { useLuaCall } from './useLuaCall';
export type { UseLuaCallReturn } from './useLuaCall';
export { useGameLoop } from './useGameLoop';
export type { UseGameLoopOptions } from './useGameLoop';
export { useGameState } from './useGameState';
export type { UseGameStateReturn } from './useGameState';
```

---

## §7 ts/src/components/TabManager.tsx

```tsx
import React, { useEffect } from 'react';

export interface TabConfig {
  id: string;
  label: string;
  /** Single key for keyboard shortcut. e.g. '1', '2', 'b' */
  shortcut?: string;
}

interface TabManagerProps {
  tabs: TabConfig[];
  active: string;
  onChange: (tabId: string) => void;
  /** Slot for the active tab's content */
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared tab bar + content switching component.
 * Handles keyboard shortcut registration automatically.
 * Used by new games — existing games keep their own tab handling.
 *
 * Usage:
 *   <TabManager tabs={TABS} active={activeTab} onChange={setActiveTab}>
 *     {activeTab === 'stable' && <StableTab />}
 *     {activeTab === 'betting' && <BettingTab />}
 *   </TabManager>
 */
export function TabManager({ tabs, active, onChange, children, className = '' }: TabManagerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture shortcuts when an input is focused
      if (document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement) return;
      const tab = tabs.find(t => t.shortcut === e.key);
      if (tab) onChange(tab.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs, onChange]);

  return (
    <div className={`tab-manager ${className}`}>
      <div className="tab-manager-bar" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            className={`tab-manager-btn ${active === tab.id ? 'tab-manager-btn--active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.shortcut && (
              <span className="tab-manager-shortcut">{tab.shortcut}</span>
            )}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-manager-content" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
```

Add to `ts/src/ui/base.css`:

```css
/* ── TabManager ───────────────────────────────────────── */

.tab-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-manager-bar {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.tab-manager-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-muted);
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tab-manager-btn:hover { color: var(--color-text); }

.tab-manager-btn--active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tab-manager-shortcut {
  font-size: var(--font-size-xs);
  opacity: 0.5;
  font-family: monospace;
}

.tab-manager-content {
  flex: 1;
  overflow-y: auto;
}
```

---

## §8 ts/src/components/GameShell.tsx

```tsx
import React from 'react';

interface GameShellProps {
  /** Optional header region (nav, score, title) */
  header?: React.ReactNode;
  /** Main content — tabs, canvas, or free layout */
  children: React.ReactNode;
  /** Optional footer region */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Structural wrapper for a game's App component.
 * Provides header/main/footer layout with correct CSS flex structure.
 * New games return this from their App.tsx.
 *
 * Usage:
 *   return (
 *     <GameShell header={<AppHeader funds={state.funds} />}>
 *       <TabManager tabs={TABS} active={activeTab} onChange={setActiveTab}>
 *         {activeTab === 'stable' && <StablePanel />}
 *       </TabManager>
 *     </GameShell>
 *   );
 */
export function GameShell({ header, children, footer, className = '' }: GameShellProps) {
  return (
    <div className={`game-shell ${className}`}>
      {header && <div className="game-shell-header">{header}</div>}
      <div className="game-shell-main">{children}</div>
      {footer && <div className="game-shell-footer">{footer}</div>}
    </div>
  );
}
```

Add to `ts/src/ui/base.css`:

```css
/* ── GameShell ────────────────────────────────────────── */

.game-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
  overflow: hidden;
}

.game-shell-header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
}

.game-shell-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.game-shell-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
}
```

---

## §9 ts/src/components/index.ts

```typescript
export { TabManager } from './TabManager';
export type { TabConfig } from './TabManager';
export { GameShell } from './GameShell';
```

---

## §10 Surgical Changes — horse_racing/App.tsx

**Change 1: Replace the ticker interval with `useCooldownTicker`.**

Remove:
```typescript
const [ticker, setTicker] = useState(0);

useEffect(() => {
  const t = setInterval(() => setTicker(prev => prev + 1), 1000);
  return () => clearInterval(t);
}, []);
```

Add import at top:
```typescript
import { useCooldownTicker } from '../../hooks';
```

Add at component top (replaces both lines above):
```typescript
const ticker = useCooldownTicker();
```

> ⚠️ RULE: `ticker` is now `Date.now()` (an ms timestamp), not an incrementing
> counter. Any comparison like `ticker > horse.cooldown_until` still works
> correctly — these were always ms timestamps. Do not change comparison logic.

**Change 2: Import `useLuaCall` alongside existing `call` import.**

The existing `call` from runtime is used throughout the file. Rather than
replacing every call site in this phase (risky), add `useLuaCall` for new
handlers going forward and note the migration path.

Add to imports:
```typescript
import { useLuaCall } from '../../hooks';
```

Add at component top (after session loading):
```typescript
const { call: luaCall, error: luaError, clearError } = useLuaCall(session);
```

Wire `luaError` into the error display — add alongside the existing `error` state:
```tsx
{(error || luaError) && (
  <div style={{ padding: '2rem' }}>
    <ErrorBox message={`Error: ${error ?? luaError}`} />
  </div>
)}
```

> ⚠️ NOTE: This phase does NOT replace all `call(session, fn)` usages — that
> is a separate refactor. The goal is to make `luaCall` available and wired to
> the error display so new handlers use it. Existing handlers remain unchanged.

---

## §11 Surgical Changes — GameCanvas.tsx (slither_rogue)

Read `ts/src/games/slither_rogue/components/GameCanvas.tsx` before editing.

Find the `requestAnimationFrame` loop — it will be a `useEffect` with
`useRef<number>` for the frame id and `useRef<number>` for the last timestamp.

Replace the manual loop with `useGameLoop`:

```typescript
import { useGameLoop } from '../../../hooks';

// Remove:
//   const frameRef = useRef<number>(0);
//   const lastTimeRef = useRef<number | null>(null);
//   useEffect(() => {
//     const loop = (time: number) => { ... }
//     frameRef.current = requestAnimationFrame(loop);
//     return () => cancelAnimationFrame(frameRef.current);
//   }, [isPaused, ...deps]);

// Add:
useGameLoop((dt) => {
  // Same tick body that was inside the loop callback
  // dt is already in seconds (useGameLoop handles ms→s conversion)
}, { paused: isPaused });
```

> ⚠️ RULE: The tick body must NOT reference stale closures. If the existing
> loop uses refs to avoid stale closures, keep those refs. `useGameLoop`
> internally uses a ref for `tickFn` so the callback sees fresh state.

---

## §12 New TypeScript Tests — ts/tests/test_shared.ts

```typescript
import { describe, it, expect, vi } from 'vitest';

// Test hooks module exports
describe('Hooks module', () => {
  it('test_hooks_module_exports_cooldown_ticker', async () => {
    const mod = await import('../src/hooks/index');
    expect(typeof mod.useCooldownTicker).toBe('function');
  });

  it('test_hooks_module_exports_lua_call', async () => {
    const mod = await import('../src/hooks/index');
    expect(typeof mod.useLuaCall).toBe('function');
  });

  it('test_hooks_module_exports_game_loop', async () => {
    const mod = await import('../src/hooks/index');
    expect(typeof mod.useGameLoop).toBe('function');
  });

  it('test_hooks_module_exports_game_state', async () => {
    const mod = await import('../src/hooks/index');
    expect(typeof mod.useGameState).toBe('function');
  });
});

// Test components module exports
describe('Components module', () => {
  it('test_components_module_exports_tab_manager', async () => {
    const mod = await import('../src/components/index');
    expect(typeof mod.TabManager).toBe('function');
  });

  it('test_components_module_exports_game_shell', async () => {
    const mod = await import('../src/components/index');
    expect(typeof mod.GameShell).toBe('function');
  });
});
```

---

## §13 Proof of Value — coin_pusher App.tsx Template

This shows what adding a new game looks like after Phase 2t.
**This is documentation only — do not create these files.**

```tsx
// ts/src/games/coin_pusher/App.tsx  — ~30 lines vs 350 for horse_racing today
import React from 'react';
import { GameShell, TabManager } from '../../components';
import { useCooldownTicker, useLuaCall, useGameState } from '../../hooks';
import type { GameRendererProps } from '../../engine/types';
import { buildInitialState } from './state';
import CoinField from './components/CoinField';
import ShopPanel from './components/ShopPanel';

const TABS = [
  { id: 'field', label: 'Push', shortcut: '1' },
  { id: 'shop',  label: 'Shop',  shortcut: '2' },
];

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call, error } = useLuaCall(session);
  const [activeTab, setActiveTab] = React.useState('field');

  if (!isInitialized || !state) return null;

  return (
    <GameShell
      header={<div className="cp-header">Coins: {state.coins}</div>}
      footer={error ? <div className="cp-error">{error}</div> : undefined}
    >
      <TabManager tabs={TABS} active={activeTab} onChange={setActiveTab}>
        {activeTab === 'field' && (
          <CoinField state={state} setState={setState} call={call} />
        )}
        {activeTab === 'shop' && (
          <ShopPanel state={state} setState={setState} call={call} />
        )}
      </TabManager>
    </GameShell>
  );
}
```

---

## §14 Completion Criteria

- [ ] `cd ts && npx vitest run` → **35 passed, 0 failed**
- [ ] `studio_build()` → exits 0
- [ ] `studio_run_tests()` → 70 passed (unchanged)
- [ ] `ts/src/hooks/index.ts` exports 4 hooks
- [ ] `ts/src/components/index.ts` exports TabManager and GameShell
- [ ] horse_racing: `useCooldownTicker` imported and used (no manual setInterval in App.tsx)
- [ ] horse_racing: `useLuaCall` imported, `luaCall` and `luaError` available
- [ ] slither_rogue GameCanvas: `useGameLoop` used (no manual rAF useEffect)
- [ ] Both games play correctly in browser after changes
- [ ] `docs/state/current.md` updated to Phase 2t certified

---

## §15 Quick Reference

| Item | Value |
|---|---|
| Python floor | 70 / 0 / 0 (unchanged) |
| TypeScript floor | 29 → 35 / 0 / 0 |
| New hook files | 4 (+ index.ts) |
| New component files | 2 (+ index.ts) |
| Surgical changes | horse_racing App.tsx ticker + useLuaCall; GameCanvas rAF |
| Coin pusher App.tsx (future) | ~30 lines vs ~350 today |
| `useCooldownTicker` returns | `Date.now()` (ms timestamp, not counter) |
| `useGameLoop` dt | Seconds, capped at 50ms |
| `useLuaCall` call return | Result or null on error |
| TabManager keyboard | Registers window keydown; ignores input focus |

---

*RFDGameStudio Phase 2t | June 2026 | RFD IT Services Ltd.*
*New games get GameShell + TabManager + useLuaCall + useCooldownTicker for free.*
*Adding coin_pusher is one session, not two.*
