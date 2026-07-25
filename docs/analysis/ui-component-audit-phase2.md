# Shared UI Component Audit — Phase 2 (SlimeWorld, Shoal, Mutant Battle Ball, ScrapCrawl)

**Scope:** `ts/src/games/slimeworld/`, `ts/src/games/shoal/`, `ts/src/games/mutant_battle_ball/`, `ts/src/games/scrapcrawl/`.
**Existing shared primitives audited against:** `Button`, `Panel`, `StatBar`, `Badge`, `TabBar`, `Card`, `Modal`, `EmptyState`, `ErrorBox`, `TitleScreen`, `EndStateScreen`, `ProgressIndicator`.
**Method:** Per-file import inspection and JSX chrome classification for each game; canvas/simulation surfaces excluded where the game architecture requires it.

---

## Summary matrix

| Game | Shared primitives used | Hand-rolled equivalents (itemized) | Compliance status |
|---|---|---|---|
| `slimeworld` | `TabBar` (`App.tsx`, `RosterTab.tsx`, `MissionsTab.tsx`); `Button` and `StatBar` (`RosterTab.tsx`, `LabTab.tsx`, `EconomyTab.tsx`) | `LabTab.tsx` and `EconomyTab.tsx` sub-tab selectors (`contracts`/`market`/`petitions`, `upgrades`/`seeds`/`breeding`) currently use custom `<button>` groups; some slime list cards, petition cards, and planet node cards are bespoke visual components. | mostly compliant |
| `shoal` | none | Toolbar buttons (`App.tsx` lines 77–88) are four raw `<button>` elements. Status spans (`App.tsx` lines 67–72) are custom `<div>`/`<span>` chrome. The `<canvas>` world view is intentionally exempt. | non-compliant (chrome only) |
| `mutant_battle_ball` | `Modal` | `RosterTab.tsx` uses a raw `<button className="start-match-btn">` and a hand-rolled `<div className="mutant-card">` per roster entry. `App.tsx` header status (`mbb-header`, `mbb-iron`) is hand-rolled. `ShopTab`, `WorkshopTab`, `InfirmaryTab` are stubs with no shared usage yet. `TabManager` is used for primary navigation but is not part of `ts/src/ui/components`. | partially compliant |
| `scrapcrawl` | none | `App.tsx` hand-rolls: `sc-fight-button` and `sc-connection` `<button>` elements; `sc-stat`/`sc-stat-badge` status blocks; `sc-durability-bar` custom progress bars; `sc-room-tag` custom badges; `sc-panel` custom panels; `sc-loading` text loading state. | non-compliant |

---

## Per-game itemized findings

### `slimeworld`
- `App.tsx` already imports `TabBar` from `../../ui/components/TabBar` for primary Roster/Missions/Economy/Lab navigation.
- `RosterTab.tsx` imports `TabBar` from `../../../ui/components/TabBar` for its internal sub-tabs and also uses `Button` and `StatBar`.
- `MissionsTab.tsx` imports `TabBar` for regions/mediation/exploration/active/zones sub-tabs.
- `LabTab.tsx` and `EconomyTab.tsx` import `Button` and `StatBar` but not `TabBar`; their internal sub-tab navigations appear to be hand-rolled `<button>` groups driven by `economySubTab` / `labSubTab` state.
- `SpecimenListItem.tsx`, `SpecimenPicker.tsx`, `SlimeVisual.tsx` are visual/specific components; converting them to `Card` would degrade the bespoke slime art and is not a natural API fit.
- No repeated new chrome pattern surfaced that isn't already covered by the existing twelve shared primitives.

### `shoal`
- `App.tsx` renders a full canvas simulation inside `ShoalCanvas`; the canvas is confirmed as the game's renderer and is excluded from ADR-008 by architecture.
- The chrome around the canvas is hand-rolled:
  - Tool selector buttons (`fish`, `shark`, `algae`, `cull`) are raw `<button>` elements with `shoal-tool` / `active` classes.
  - `GameShell` `statusArea` uses a `shoal-status` `<div>` with four inline `<span>` stat blocks; these map cleanly to `Badge` or `Panel`.
- No title screen or modal exists outside the simulation; the canvas is the entire game surface.

### `mutant_battle_ball`
- `App.tsx` uses `TabManager` from `../../components` for primary tabs; `TabManager` is a `GameShell`-adjacent component, not part of `ts/src/ui/components`.
- `RosterTab.tsx` contains:
  - `<button className="start-match-btn">` on line 25 → directly replaceable with `Button`.
  - `<div className="mutant-card">` per roster entry → replaceable with `Card`.
  - `<div className="mutant-status">` → could use `Badge` if statuses expand, but currently plain text.
- `ShopTab.tsx`, `WorkshopTab.tsx`, `InfirmaryTab.tsx` are empty-shell placeholders; no chrome to retrofit.
- `MatchCanvas.tsx` is canvas-based match rendering and is excluded.
- `App.tsx` `mbb-header` and `mbb-iron` status spans are hand-rolled; `Badge` is a natural fit for the iron count and any error state.

### `scrapcrawl`
- `App.tsx` is the only React chrome file. It hand-rolls a complete dashboard:
  - `sc-fight-button` and `sc-connection` `<button>` elements → `Button`.
  - `sc-stat` / `sc-stat-value` / `sc-stat-badge` blocks → `StatBar`, `Badge`.
  - `sc-durability-bar` / `sc-durability-fill` → `StatBar`.
  - `sc-room-tag` chips (`fight`, `craft`, `safe`, difficulty) → `Badge`.
  - `sc-panel` `<section>` elements → `Panel`.
  - `sc-loading` loading text → `EmptyState`.
- The game logic is real but the UI is entirely bespoke; this is a partial React port where shared primitives can be fitted without touching `resolve_fight`, `move_player`, or `craft`.

---

## Retrofit recommendations

1. **SlimeWorld** — minimal: import `TabBar` from `../../../ui/components` (index) instead of the direct file path; optionally convert `LabTab`/`EconomyTab` sub-tab groups to `TabBar`. No new shared components.
2. **Shoal** — toolbar buttons to `Button`; status spans to `Badge` (or `Panel` wrapper). Canvas untouched.
3. **Mutant Battle Ball** — `RosterTab` start button to `Button`; `mutant-card` to `Card`; `App.tsx` iron/error to `Badge`/`ErrorBox`. Remaining tabs are stubs.
4. **ScrapCrawl** — `App.tsx` actions to `Button`, stats/badges to `Badge`, durability to `StatBar`, panels to `Panel`, loading to `EmptyState`.

## New component extraction trigger

No shared primitive gap repeated across two or more of these four games surfaced during this audit. No new shared templates are proposed.
