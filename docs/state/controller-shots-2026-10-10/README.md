# Controller screenshots, 2026-10-10

Captured with a scratch Playwright script (Chromium 149, headless) against local Vite dev servers
from a worktree of origin/main `c1b67992`. Viewports: 1280x720 desktop, 390x844 phone (touch, mobile).

| Check | Result |
|---|---|
| #267 Tuning panel visible at `?dev=1` (chimera_wilds, 1280x720 and 390x844; 2 knobs) | PASS |
| #267 Tuning panel visible at `?dev=1` (scrapcrawl, 1280x720 and 390x844; 2 knobs) | PASS |
| #267 No `[data-tuning-panel]` without `?dev=1` (chimera_wilds, scrapcrawl) | PASS |
| #275 Factory Idle starter-goal banner ("Serve 5 customers ...") at both viewports | PASS |
| #269 Factory Idle reload: capital 349.2 before reload, 380.8 after (desktop); 349.2 / 381 (phone); save key `factory_idle_save_v1` | PASS |
| #261 PlanetForge header name + first-step hint ("Press Play to start the ring ...") at both viewports | PASS |
| #261 PlanetForge reload: Tick #5 before pause and after reload (both viewports); save key `planetforge_save_v1` | PASS |

Files: `tuning-panel-<game>-<w>x<h>.png`, `factory-idle-<w>x<h>.png`, `factory-idle-after-reload-<w>x<h>.png`,
`planetforge-<w>x<h>.png`, `planetforge-after-reload-<w>x<h>.png`.

Notes: Factory Idle capital rising across the reload means the game kept running after restore (state survived, not reset).
PlanetForge was paused before reload so the tick comparison is exact.
