# RFDGameStudio — Phase 2q Directive: Always-Live Web Arcade

*June 2026 | Read fully before executing anything.*
*Goal: permanent dev URL + game selection index + stable snapshot for demos.*

---

> ⛔ **STOP:** Verify floors before touching anything.
> `studio_run_tests()` via Claude → must report 64/0/0.
> TypeScript: `cd ts && npx vitest run` → must report 27 passed.

---

## §0 Context

**The goal:** A permanently-running arcade on Nitro with a game selection
index page. Open a browser tab, pick a game, play it. Agent works on
slither_rogue — horse_racing tab is unaffected. Two URLs:

| URL | Mode | Use |
|---|---|---|
| `http://localhost:5173` | Dev (HMR) | Active development |
| `http://localhost:5174` | Stable (built snapshot) | Demos while agent works |

The TypeScript router already handles `?game=` params. What's missing:
no index page when `?game=` is absent, and no always-on NSSM service.

---

## §1 Scope

| File | Action |
|---|---|
| `ts/src/engine/types.ts` | Extend `GameConfig` with `color`, `status` |
| `ts/src/games/horse_racing/config.ts` | Add color, status, description |
| `ts/src/games/slither_rogue/config.ts` | Add color, status, description |
| `ts/src/main.tsx` | `GameSelector` index + "← Arcade" back button |
| `ts/src/ui/base.css` | Arcade index styles |
| `ts/start_arcade_dev.ps1` | PowerShell wrapper for vite dev |
| `ts/start_arcade_stable.ps1` | PowerShell wrapper for vite preview |
| `studio_mcp/tools.py` | Add `studio_build()` tool |
| `studio_mcp/server.py` | Register `studio_build` |
| `ts/tests/test_arcade.ts` | 2 new tests → 27→29 |

**Python floor: 64/0/0 (unchanged)**
**TypeScript floor: 27 → 29**

---

## §2 types.ts — Extend GameConfig

Add `color` and `status` to `GameConfig`:

```typescript
export type GameStatus = 'stable' | 'beta' | 'dev';

export interface GameConfig {
  gameId: string;
  label: string;
  description?: string;
  color?: string;           // hex accent color for arcade card
  status?: GameStatus;      // displayed as badge on card
  component: React.LazyExoticComponent<React.ComponentType<GameRendererProps>>;
}
```

---

## §3 Per-Game Config Updates

### ts/src/games/horse_racing/config.ts

```typescript
import React from 'react';
import type { GameConfig } from '../../engine/types';

export const horseRacingConfig: GameConfig = {
  gameId:      'horse_racing',
  label:       'Derby Sim',
  description: 'Race, breed, and bet on horses. Win/Place/Show betting, genetics system, career tracking.',
  color:       '#f59e0b',   // amber
  status:      'stable',
  component:   React.lazy(() => import('./App')),
};
```

### ts/src/games/slither_rogue/config.ts

```typescript
import React from 'react';
import type { GameConfig } from '../../engine/types';

export const slitherRogueConfig: GameConfig = {
  gameId:      'slither_rogue',
  label:       'Snake Roguelike',
  description: 'Slither.io meets roguelike. Steal segments, collect evolution cards, dominate the arena.',
  color:       '#34d399',   // green
  status:      'beta',
  component:   React.lazy(() => import('./App')),
};
```

---

## §4 main.tsx — Full Replace

```tsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './ui/tokens.css';
import './ui/base.css';
import { loadGame } from './engine/runtime';
import type { GameSession } from './engine/types';
import { GAME_REGISTRY, findGameOrDefault } from './games/registry';

// ── URL routing ──────────────────────────────────────────────────────────────

function getGameId(): string | null {
  return new URLSearchParams(window.location.search).get('game');
}

function navigateTo(gameId: string): void {
  window.location.href = `?game=${gameId}`;
}

function navigateHome(): void {
  window.location.href = '/';
}

// ── Game Selector (index page) ───────────────────────────────────────────────

function GameSelector() {
  return (
    <div className="arcade-index">
      <header className="arcade-header">
        <div className="arcade-brand">
          <div className="arcade-logo">RFD GAME STUDIO</div>
          <div className="arcade-subtitle">Portable Game Definition Format · Multi-Renderer</div>
        </div>
      </header>

      <main className="arcade-main">
        <h2 className="arcade-section-title">SELECT A GAME</h2>
        <div className="arcade-grid">
          {GAME_REGISTRY.map(config => (
            <button
              key={config.gameId}
              className="arcade-card"
              style={{ '--card-color': config.color ?? 'var(--color-accent)' } as React.CSSProperties}
              onClick={() => navigateTo(config.gameId)}
            >
              <div className="arcade-card-header">
                <span className="arcade-card-title">{config.label}</span>
                <span className={`arcade-status arcade-status--${config.status ?? 'stable'}`}>
                  {(config.status ?? 'stable').toUpperCase()}
                </span>
              </div>
              <p className="arcade-card-desc">{config.description ?? ''}</p>
              <div className="arcade-card-id">{config.gameId}</div>
            </button>
          ))}

          {/* Coming soon placeholder */}
          <div className="arcade-card arcade-card--coming-soon">
            <div className="arcade-card-header">
              <span className="arcade-card-title">More Coming</span>
              <span className="arcade-status arcade-status--dev">SOON</span>
            </div>
            <p className="arcade-card-desc">
              Coin Pusher · Mutant Battle Ball · and more.
            </p>
          </div>
        </div>
      </main>

      <footer className="arcade-footer">
        <span>© 2026 RFD IT Services Ltd.</span>
        <span className="arcade-footer-sep">·</span>
        <span>Lua + Python + TypeScript</span>
      </footer>
    </div>
  );
}

// ── Game Loader (single game view) ───────────────────────────────────────────

function GameLoader({ gameId }: { gameId: string }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError]     = useState<string | null>(null);

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
      <div className="arcade-error">
        <button className="arcade-back-btn" onClick={navigateHome}>← Arcade</button>
        <div className="arcade-error-box">
          <strong>Studio Error</strong>
          <p>{error}</p>
          <small>Game ID: {gameId}</small>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="arcade-loading">
        <button className="arcade-back-btn" onClick={navigateHome}>← Arcade</button>
        <span>Loading {gameId}…</span>
      </div>
    );
  }

  const config     = findGameOrDefault(gameId);
  const GameApp    = config.component;

  return (
    <div className="arcade-game-wrap">
      <button className="arcade-back-btn" onClick={navigateHome}>← Arcade</button>
      <React.Suspense
        fallback={
          <div className="arcade-loading">Loading renderer…</div>
        }
      >
        <GameApp session={session} />
      </React.Suspense>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

function Root() {
  const gameId = getGameId();
  return gameId ? <GameLoader gameId={gameId} /> : <GameSelector />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
```

---

## §5 base.css — Arcade Index Styles

Add after existing styles. Do not remove any existing classes.

```css
/* ── Arcade Index ─────────────────────────────────────── */

.arcade-index {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.arcade-header {
  padding: var(--space-8) var(--space-8) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.arcade-logo {
  font-size: var(--font-size-xl);
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--color-text);
}

.arcade-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-top: var(--space-1);
  letter-spacing: 0.06em;
}

.arcade-main {
  flex: 1;
  padding: var(--space-8);
}

.arcade-section-title {
  font-size: var(--font-size-sm);
  letter-spacing: 0.1em;
  color: var(--color-muted);
  margin-bottom: var(--space-6);
}

.arcade-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.arcade-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.1s;
  position: relative;
  overflow: hidden;
}

.arcade-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--card-color, var(--color-accent));
  opacity: 0.7;
  transition: opacity 0.15s;
}

.arcade-card:hover {
  border-color: var(--card-color, var(--color-accent));
  transform: translateY(-2px);
}

.arcade-card:hover::before {
  opacity: 1;
}

.arcade-card--coming-soon {
  opacity: 0.45;
  cursor: default;
}

.arcade-card--coming-soon:hover {
  transform: none;
  border-color: var(--color-border);
}

.arcade-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.arcade-card-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.arcade-status {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid currentColor;
}

.arcade-status--stable  { color: var(--color-green);  }
.arcade-status--beta    { color: var(--color-yellow);  }
.arcade-status--dev     { color: var(--color-muted);   }

.arcade-card-desc {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  line-height: 1.5;
  margin-bottom: var(--space-4);
}

.arcade-card-id {
  font-size: var(--font-size-xs);
  color: var(--color-border);
  font-family: monospace;
}

.arcade-footer {
  padding: var(--space-4) var(--space-8);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.arcade-footer-sep { color: var(--color-border); }

/* ── Back button + loading/error states ───────────────── */

.arcade-back-btn {
  position: fixed;
  top: var(--space-4);
  left: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: var(--font-size-sm);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  z-index: 1000;
  transition: color 0.15s, border-color 0.15s;
}

.arcade-back-btn:hover {
  color: var(--color-text);
  border-color: var(--color-accent);
}

.arcade-game-wrap {
  width: 100%;
  height: 100vh;
}

.arcade-loading,
.arcade-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: var(--space-4);
  color: var(--color-muted);
}

.arcade-error-box {
  background: var(--color-surface);
  border: 1px solid var(--color-red);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  max-width: 480px;
  color: var(--color-red);
}

.arcade-error-box p  { color: var(--color-text); margin: var(--space-2) 0; }
.arcade-error-box small { color: var(--color-muted); font-size: var(--font-size-xs); }
```

---

## §6 TypeScript Tests (27→29)

Create `ts/tests/test_arcade.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GAME_REGISTRY } from '../src/games/registry';

describe('Arcade Registry', () => {
  it('test_all_games_have_color', () => {
    for (const config of GAME_REGISTRY) {
      expect(config.color).toBeDefined();
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('test_all_games_have_description', () => {
    for (const config of GAME_REGISTRY) {
      expect(config.description).toBeDefined();
      expect(config.description!.length).toBeGreaterThan(10);
    }
  });
});
```

---

## §7 studio_build Tool

Add to `studio_mcp/tools.py`:

```python
def studio_build() -> dict:
    """Run vite build and return structured output.

    On success, RFDArcadeServe (port 5174) automatically picks up
    the new dist/ at next request — no service restart needed.

    Returns: {"success": bool, "output": str, "duration_ms": int}
    """
    import subprocess
    import time

    repo_root = Path(__file__).parent.parent
    ts_dir    = repo_root / 'ts'

    start = time.time()
    try:
        proc = subprocess.run(
            'npx vite build',
            cwd=str(ts_dir),
            capture_output=True,
            text=True,
            timeout=120,
            shell=True,        # required — npx is a .cmd file on Windows
        )
        duration_ms = int((time.time() - start) * 1000)
        output = (proc.stdout + proc.stderr).strip()
        return {
            'success':     proc.returncode == 0,
            'output':      output[-3000:],
            'duration_ms': duration_ms,
            'return_code': proc.returncode,
        }
    except subprocess.TimeoutExpired:
        return {'error': 'Build timed out (120s)', 'tool': 'studio_build'}
    except Exception as exc:
        return {'error': str(exc), 'tool': 'studio_build'}
```

Add to `studio_mcp/server.py`:
```python
from studio_mcp.tools import (
    ...
    studio_build,    # new
)
mcp.tool()(studio_build)
```

---

## §8 PowerShell Wrappers

### ts/start_arcade_dev.ps1
```powershell
# RFDGameStudio — Arcade Dev Server (port 5173, HMR)
# Run via NSSM as RFDArcadeDev service.
Set-Location "C:\Github\RFDGameStudio\ts"
npx vite dev --host 0.0.0.0 --port 5173
```

### ts/start_arcade_stable.ps1
```powershell
# RFDGameStudio — Arcade Stable Server (port 5174, built snapshot)
# Requires: vite build run at least once before starting.
# Run via NSSM as RFDArcadeServe service.
Set-Location "C:\Github\RFDGameStudio\ts"
npx vite preview --host 0.0.0.0 --port 5174
```

---

## §9 NSSM Services

Run as administrator from `C:\Github\RFDGameStudio\ts`:

### RFDArcadeDev (always-on dev server)

```powershell
nssm install RFDArcadeDev powershell.exe
nssm set RFDArcadeDev AppParameters "-ExecutionPolicy Bypass -File C:\Github\RFDGameStudio\ts\start_arcade_dev.ps1"
nssm set RFDArcadeDev AppDirectory "C:\Github\RFDGameStudio\ts"
nssm set RFDArcadeDev AppStdout "C:\Github\RFDGameStudio\logs\arcade_dev.log"
nssm set RFDArcadeDev AppStderr "C:\Github\RFDGameStudio\logs\arcade_dev.log"
nssm set RFDArcadeDev AppRotateFiles 1
nssm start RFDArcadeDev
```

### RFDArcadeServe (stable snapshot — install after first build)

```powershell
# First — build the snapshot:
cd C:\Github\RFDGameStudio\ts
npx vite build

# Then install the service:
nssm install RFDArcadeServe powershell.exe
nssm set RFDArcadeServe AppParameters "-ExecutionPolicy Bypass -File C:\Github\RFDGameStudio\ts\start_arcade_stable.ps1"
nssm set RFDArcadeServe AppDirectory "C:\Github\RFDGameStudio\ts"
nssm set RFDArcadeServe AppStdout "C:\Github\RFDGameStudio\logs\arcade_stable.log"
nssm set RFDArcadeServe AppStderr "C:\Github\RFDGameStudio\logs\arcade_stable.log"
nssm set RFDArcadeServe AppRotateFiles 1
nssm start RFDArcadeServe
```

> ⚠️ Create `C:\Github\RFDGameStudio\logs\` directory before starting services:
> `New-Item -ItemType Directory -Path "C:\Github\RFDGameStudio\logs" -Force`

---

## §10 Update Service Registry

Add to the tower-ops skill NSSM registry (for future reference):

| Service | Port | Purpose |
|---|---|---|
| RFDArcadeDev | 5173 | Vite dev — HMR, active development |
| RFDArcadeServe | 5174 | Vite preview — stable built snapshot |
| RFDStudioMCP | 8025 | Studio tools (Claude integration) |

---

## §11 Workflow — Multi-Game Development

**Scenario: Agent works on slither_rogue while horse_racing stays live.**

```
Browser Tab 1: http://localhost:5173/?game=horse_racing  → stable, unaffected
Browser Tab 2: http://localhost:5173/?game=slither_rogue → HMR, agent changes appear live
Browser Tab 3: http://localhost:5173/                    → index page, pick any game
```

Agent edits `games/slither_rogue/logic.lua` or `ts/src/games/slither_rogue/` → HMR
updates Tab 2 only. Tab 1 is unaffected (different module graph).

**Scenario: Demo horse_racing while agent works on coin_pusher extraction.**

```
Browser: http://localhost:5174/?game=horse_racing  → stable snapshot, no HMR
Agent:   works on coin_pusher extraction
When ready: studio_build() → new snapshot → reload Tab refreshes to new build
```

---

## §12 Completion Criteria

- [ ] `cd ts && npx vitest run` → **29 passed, 0 failed**
- [ ] `cd ts && npx vite build` → exits 0
- [ ] `http://localhost:5173/` → index page loads with game cards
- [ ] Derby Sim card has amber top stripe, STABLE badge
- [ ] Snake Roguelike card has green top stripe, BETA badge
- [ ] Click Derby Sim → navigates to `?game=horse_racing`, game loads
- [ ] "← Arcade" button → returns to index
- [ ] `http://localhost:5173/?game=invalid_id` → error box with back button
- [ ] `nssm list` → RFDArcadeDev and RFDArcadeServe present
- [ ] `http://localhost:5174/` → stable build index page loads
- [ ] `studio_build()` via Claude → returns `{success: true}`
- [ ] NSSM restart survives machine reboot (auto-start)
- [ ] `docs/state/current.md` updated to Phase 2q certified

---

## §13 Quick Reference

| Item | Value |
|---|---|
| Python floor | 64 / 0 / 0 (unchanged) |
| TypeScript floor | 27 → 29 / 0 / 0 |
| Dev arcade URL | `http://localhost:5173/` |
| Stable arcade URL | `http://localhost:5174/` |
| NSSM service (dev) | `RFDArcadeDev` |
| NSSM service (stable) | `RFDArcadeServe` |
| Build trigger | `studio_build()` via Claude, or `npx vite build` in ts/ |
| Log location | `C:\Github\RFDGameStudio\logs\` |
| horse_racing color | `#f59e0b` (amber) |
| slither_rogue color | `#34d399` (green) |
| coin_pusher color (future) | `#06b6d4` (cyan) |
| mutant_battle_ball color (future) | `#f87171` (red) |

---

*RFDGameStudio Phase 2q | June 2026 | RFD IT Services Ltd.*
*One URL. All games. Always live.*
*Dev tab: HMR. Stable tab: frozen snapshot. Agent works on one, demos run on the other.*
