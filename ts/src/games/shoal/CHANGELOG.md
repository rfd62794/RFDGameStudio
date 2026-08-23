# Shoal — CHANGELOG

## Aug 22 2026 — Color Variation Expansion

Expanded Shoal's color system by wiring in existing-but-dead code and
extending the decay-lerp pattern. All changes are in Shoal's shared
source — no Y8-specific files touched. Reaches all three build targets
(arcade, itch.io, Y8) on next rebuild.

### Changes

- **Lineage color inheritance (wired in, was dead code):** `inheritHue`
  existed in `shoal.config.ts` but was never called. Added
  `generateInheritedColor` to `shoalSimulation.ts` — bred offspring now
  inherit a hue from their parent (±15° drift), creating visible lineage
  color families. Initial spawns still use `generateProceduralColor`.
  `newFish`/`newShark`/`spawnFish`/`spawnShark` accept an optional
  `parentColor` parameter; breeding calls pass the parent's
  `lineageColor`.
- **Age saturation in rendering (wired in, was dead code):** `AGE_CURVE`
  and `applyAgeSaturation` existed in `shoal.config.ts` but `App.tsx`
  didn't apply them. Added `getAgeAwareBatchColor` — batches by
  (hue band, age stage) so young creatures render at 0.6× saturation
  (paler) vs mature at full saturation. Preserves the existing batching
  pattern (12 hue bands, now split by age = 24 batches max).
- **3-stop decay gradient (extends existing 2-stop lerp):** Flesh chunks
  now go red (`#f43f5e`) → orange (`#f97316`) → gold (`#eab308`) instead
  of red → gold. New `chunk_decay_mid_color` config in `data.yaml`.
  Makes decay progression more visually readable.

### Part B — Movement/Steering Investigation (report only, no changes)

Investigation confirmed real, named flocking behavior already exists:
`forceSeparate`, `forceAlign`, `forceCohere` — all called in
`computeFishForces` with tunable weights from `steering_weights` in
`data.yaml`. Full steering: seek, flee, arrive, wander, separate, align,
cohere, avoid, depth-arrive, limit-turn, drag. All tunable, none
hardcoded. **Yuka adoption is NOT warranted** — Shoal already has a
complete, tuned, performant steering system. See EngineExpansionMap for
the full report.

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
