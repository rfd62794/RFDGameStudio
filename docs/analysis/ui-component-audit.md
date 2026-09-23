# Shared UI Component Audit — ADR-008 Compliance

**Scope:** Every finished game in `ts/src/games/` listed in the Shared UI Layer directive.
**Method:** `grep` for imports from `ts/src/ui/components` in `App.tsx` and every phase/component file under each game, then classify hand-rolled equivalents of the nine existing shared primitives.
**Existing shared primitives:** `Button`, `Panel`, `StatBar`, `Badge`, `TabBar`, `Card`, `Modal`, `EmptyState`, `ErrorBox`.

---

## Summary matrix

| Game | Shared primitives used | Hand-rolled equivalents (rough counts) | Compliance status |
|------|------------------------|----------------------------------------|-------------------|
| `brewfield` | none | `IntroScreen`, `GameOverScreen`, `MapProgress`, `EnemySection`, `CauldronSection`, `PlayerSection`, `ForageNode`, `RestNode`, `CombatOutcomeCard`, `Logbook`. Buttons: ~6. Stat displays: ~4. Badges/chips: ~2. Cards/panels: ~12. | **non-compliant** |
| `dissonance` | none | `TitlePhase`, `RewardPhase`, `MapPhase`, `CombatPhase`, `RestCraftPhase`, `DeckBuildPhase`, `OpeningPhase`, `FloorChoicePhase`. Buttons: ~8. Cards/panels: ~10. Stat bars: ~2. | **non-compliant** |
| `slimeworld` | `Button`, `StatBar`, `TabBar` (in `LabTab`, `RosterTab`, `MissionsTab`, `EconomyTab`, and `App.tsx`) | Slime visual cards, specimen list items, petition cards, planet region cards, modal-like inline panels. Cards/panels: ~8. Buttons beyond shared: ~4. | partially compliant |
| `shoal` | none | Entire UI is canvas-rendered with a custom toolbar. Buttons: ~3. No shared primitives apply to the simulation surface. | **non-compliant** (specialized renderer) |
| `horse_racing` | `EmptyState`, `Badge`, `Button`, `Card`, `ErrorBox`, `TabBar` | `SVGRacer`, `RaceTrack` canvas, stable list rows, race countdown overlay. Custom cards/rows: ~6. | mostly compliant |
| `mutant_battle_ball` | `Modal` | `MatchCanvas`, custom match HUD, action buttons. Buttons: ~4. Panels: ~3. | partially compliant |
| `slither_rogue` | `Modal` | Game board grid, evolution cards, score HUD, custom buttons. Buttons: ~6. Cards/panels: ~5. | partially compliant |
| `scrapcrawl` | none | All UI rendered through the generic PyGame-style interpreter/reconciler path; no React shared components used. | **non-compliant** (different renderer stack) |

---

## Per-game notes

### `brewfield`
- `App.tsx` and every component under `components/` hand-roll markup.
- Directly equivalent to shared primitives:
  - `motion.button` start/restart buttons → `Button`
  - `div` feature/info cards → `Card` / `Panel`
  - enemy/player HP display → `StatBar`
  - residue/element chips → `Badge`
  - `GameOverScreen` stat grid → `Panel` + `StatBar`
- `IntroScreen` and `GameOverScreen` share a title/end-state shape with Dissonance that justifies the new `TitleScreen` and `EndStateScreen` templates.
- `MapProgress` shares a node-progression shape with Dissonance's `MapPhase` chrome that justifies the new `ProgressIndicator` template.

### `dissonance`
- No imports from `ts/src/ui/components` in any built phase.
- Directly equivalent to shared primitives:
  - title/menu buttons in `TitlePhase` → `TitleScreen` (new) + `Button`
  - reward slot cards in `RewardPhase` → `Card` + `Button`
  - HP/shield display in `CombatPhase` → `StatBar`
  - map node markers in `MapPhase` → `ProgressIndicator` (new)
  - rest/attachment option cards in `RestCraftPhase` → `Card` + `Button`
  - deck build cards in `DeckBuildPhase` → `Card`
- `RunEndPhase` (not yet built) should use the new `EndStateScreen` template.

### `slimeworld`
- Uses `Button`, `StatBar`, and `TabBar` in the main tab files.
- Still hand-rolls many slime cards, specimen pickers, and planet panels; those are game-specific visual components and out of scope for this directive.

### `shoal`
- Canvas-based simulation; no shared React components are applicable to the world surface.
- The toolbar buttons around the canvas could use `Button`, but the game currently hand-rolls them.

### `horse_racing`
- Uses the broadest set of shared primitives among finished ports.
- Remaining hand-rolled pieces are game-specific (SVG racer, track canvas, race-specific layouts).

### `mutant_battle_ball`
- Uses `Modal` for match overlays.
- Match HUD, timers, and action buttons are hand-rolled.

### `slither_rogue`
- Uses `Modal` for game-over and evolution overlays.
- Game board, score display, and evolution cards are hand-rolled.

### `scrapcrawl`
- Rendered through the generic renderer/interpreter stack, not React DOM. No shared React components used; this is an architectural choice, not a per-component gap.

---

## Action priority from this audit

1. **Dissonance** — highest priority. Zero shared usage, smallest surface, currently being built.
2. **Brewfield** — reference port; retrofits set the pattern for later games.
3. **SlimeWorld** — shared primitives already used; remaining gaps are game-specific visuals.
4. **Shoal / Mutant Battle Ball / Slither Rogue** — canvas/heavy custom renderers; only toolbar/action buttons are straightforward wins.
5. **Scrapcrawl / Horse Racing** — scrapcrawl is on the generic renderer; horse_racing is already mostly compliant.
