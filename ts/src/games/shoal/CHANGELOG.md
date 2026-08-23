# Shoal — CHANGELOG

## Aug 22 2026 — Y8 Portal Integration (Phase 3)

Shoal becomes the first live consumer of the shared `portalAdapter` Y8
adapter (Phase 2). This is presentation/telemetry wiring at real,
existing state transitions — no new game logic.

### Changes

- **`y8Config.ts`** (new) — Shoal's real Y8 credentials
  (`appId: 6a8a38fd3daf0b765651b797`, `gameId: 281135`), exported as a
  typed `Y8AdapterConfig`. Lives in Shoal's own config, not the shared
  adapter.
- **`src/standalone/shoal/index.html`** — Y8 SDK script tag added to
  `<head>` (`https://cdn.y8.com/minimal-sdk/2-0/y8.min.js`, async).
- **`vite.shoal.config.ts`** — `preserveY8ScriptTag()` Vite plugin
  re-injects the external script tag into the built dist HTML (Vite
  strips non-module external scripts during build).
- **`App.tsx`** — `notifyGameplayStart()` wired into `handleStart`
  (title → game transition); `notifyGameplayStop()` wired into the
  "← Title" button (game → title transition). `initY8(SHOAL_Y8_CONFIG)`
  called only when `detectPortalEnvironment() === 'y8'`.

### Honest finding: no pause state

Shoal has no separate pause state. The Mechanics overlay is an
informational popup, not a pause — the simulation runs unconditionally
while on the game screen. `notifyGameplayStop` has exactly one real
call site (the title button). This is by design (continuous sandbox),
not a gap.
