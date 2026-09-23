# Studio foundation: glossary, overlay, juice, events and style

**Date:** 2026-09-22. **Status:** design approved section by section by Robert; spec awaiting review.
**Roadmap:** delivers M6 (graphics boundary, vector-to-sprite export, pixel style) and adds a new
milestone for glossary, overlay and juice.

## 1. Why

Robert, 2026-09-22: "making the data more clear, the cards holding more details, and better Visual
Juice Mechanics for the Engine/Studio as a whole. We were supposed to work on Pixel Raster & SVG
Graphical Options." Goal chosen: **build the Studio's foundation** - every new demo gets clear data,
juice and a style choice for free; existing games adopt it gradually.

The trigger was the Brewfield chemistry merge into Dissonance Depths: residues, retaliate, dodge,
detonate and more now run in `combat.lua`, and none of it is visible, because the Studio has no
shared place to show game data. The UI audit (`docs/analysis/ui-component-audit.md`,
`2026-09-20-shared-ui-and-logic-plan.md` A4) already recorded: no shared tooltip, no shared settings,
six single-consumer card renderers, six to seven hand-rolled event logs, and no shared effects layer.

## 2. Decisions

| # | Decision | Rejected |
|---|---|---|
| D1 | Foundation first; games adopt gradually | Polish published games first; M6 alone |
| D2 | Meaning lives in a per-game YAML glossary | TS props only; both |
| D3 | Juice fires from comparing states first, then from events the logic returns | Events only; comparing only |
| D4 | Everything draws in one shared overlay above any game | Built into each renderer; split |
| D5 | Style is a game default (`vector`/`pixel`) with an opt-in player toggle | Game-only; player-only |
| D6 | Build in layers, glossary first | One game end to end; style first |

Constraints carried in: the Studio is TS-native (no Lua or runtime swaps, per the Shoal measurement);
YAML is the portability hedge; reusable UI components are the direction. Devin builds each layer
through a directive; Claude reviews.

## 3. Architecture

New `ts/src/foundation/` with three folders: `glossary/`, `overlay/`, `style/`. Games do not import
them directly: `GameShell` (`ts/src/components/GameShell.tsx`) mounts the overlay when the game has
a glossary. Adding `games/<id>/glossary.yaml` is the whole opt-in.

## 4. The glossary

`games/<id>/glossary.yaml`, loaded the way `ts/src/engine/loader.ts` loads `data.yaml`/`ui.yaml`.
Entries say what state **means**, never how it is computed.

```yaml
version: 1
entries:
  burning:
    kind: status              # stat | status | effect | resource | card_field | event
    label: Burning
    icon: flame               # shared icon set name, or a path
    tone: ember               # a colour ROLE, resolved by the style layer
    text: "Takes {level} ember damage each turn for {turnsLeft} turns."
    bind: enemy.residues[tag=burning]
    fields: { level: number, turnsLeft: turns }
    juice: { enter: pop, exit: fade }
  hp:
    kind: stat
    label: HP
    bind: player.hp
    max: player.maxHp
    juice: { down: hurt, up: heal, at: { below_pct_25: pulse } }
```

- **Validated on load.** An invalid entry renders the existing `ErrorBox` in dev and is skipped in
  production; it never crashes a game. `version` is required; an unknown version fails closed (the
  glossary is ignored, with a dev error).
- **`bind`** uses the dot-path resolver in `ui_interpreter.tsx` plus one extension: `[key=value]`
  selects the first list item whose `key` equals `value`.
- **Tones are roles** (`ember`, `spark`, `ash`, `cinder`, `danger`, `heal`, `neutral`, `gold`, ...),
  so styles and future themes recolour everything in one place.
- **Text templates** only substitute `{field}` values. No expressions, no logic.
- **Custom juice presets** may be declared under a top-level `juice:` key, composed only from the
  primitives in section 6.
- A **JSON-schema mirror** (`docs/glossary.schema.json`) is kept honest by a test, so non-TS tools
  (Devin, AgentFlow) validate the same file.

## 5. The overlay, cards and tooltips

One React layer placed by `GameShell` over the game area, `pointer-events: none` except on its own
interactive pieces.

**Anchors** (where things go):
- React games: `data-anchor="enemy"` on an element.
- Every `ui.yaml` region id is an anchor automatically.
- Canvas games: `overlay.anchor("enemy", () => rect)`; the getter is read each animation frame, so
  chips follow moving sprites.
- An unknown anchor places its chips in a default HUD slot and logs a dev warning. Nothing vanishes.

**Chips:** badges attached to anchors for every visible `status`/`effect`/`resource` entry. Stack and
wrap, never cover the anchor's centre; past 5 on one anchor the rest collapse into a `+N` chip whose
tooltip lists them.

**Tooltips:** hover on desktop, long-press on touch, over any chip, stat or card field. Content is
the entry's `icon`, `label` and filled `text`. One tooltip component Studio-wide.

**DetailCard:** a shared card built from `card_field` entries - name, cost, element, effect lines
with icons, flavour. Compact face shows name, cost, element; hover/tap expands. A game's own card
renderer may keep its layout and use `DetailCard` only for the expanded view.

**Event log:** an optional overlay panel (switched on in `ui.yaml`) fed by event `log` lines
(section 7).

Everything scales with the game container; the overlay never changes the game's own layout.

## 6. Juice from comparing states

**Input:** the game calls `useFoundation(state)` or passes `state` to `GameShell` on every change.
Lua-backed games already receive a new state from each `call(...)`.

**Comparison:** a pure function `diff(prev, next, glossary) -> JuiceRequest[]`, per entry:
- number down / up -> `juice.down` / `juice.up`
- list item appeared / disappeared -> chip enter / exit, plus `juice.enter` / `juice.exit`
- threshold crossed -> `juice.at` (e.g. `turnsLeft` reaches 0; HP below 25%)

**Primitives:** `pop` (floating number or word), `flash` (tint in the entry's tone), `shake` (anchor
or whole container), `pulse` (scale bump), `burst` (a few SVG particles), `count` (number rolls to
its new value), `fade`. **Presets:** `hurt` = pop + flash(danger) + small shake; `heal` = pop +
pulse(heal); `crit` = larger hurt; games may add presets in the glossary from the same primitives.

**Scheduler rules:**
- Coalesce: repeated requests on one anchor within 150 ms merge into one, with summed amounts.
- One queue per anchor; requests queue briefly rather than stack.
- A global cap on simultaneous effects; when exceeded, drop `burst` before `pop` before chip
  changes.
- `prefers-reduced-motion`: `shake`, `burst`, `pulse` become short fades; numbers still show.
- Pixel style (section 8) switches easing to stepped.

## 7. Events from the logic

A game may return events with its state. Lua: `return { state = ..., events = { ... } }`. The runtime
`call(...)` bridge splits the two; a function returning a bare state keeps working unchanged.

```yaml
events:
  - { type: dodge, target: player }
  - { type: detonate, target: enemy, amount: 12 }
```

- `type` names a glossary entry of `kind: event`; `target` names an anchor; other fields fill the
  entry's `text`, `log` and juice (e.g. `pop` shows `amount`).
- Unknown event types are ignored with a dev warning.
- **Precedence:** when an event and a state comparison target the same anchor in the same update,
  the event's juice plays and the comparison's juice for that anchor is skipped. That is the whole
  rule.
- Events are one-shot: never stored, never part of state; replaying a save replays no juice.
- An event entry's optional `log` line appends to the overlay event log.

**First adopter:** Dissonance's `combat.lua` emits `dodge`, `retaliate`, `detonate`, `cauterize` -
the Brewfield mechanics a state comparison cannot see.

## 8. Style: vector and pixel

```yaml
# ui.yaml
style: pixel          # vector when absent
style_toggle: true    # optional; GameShell adds a Vector / Pixel switch to its menu
```
The player's choice is remembered per game in `localStorage` (wrapped; absent storage means the
game default).

The style layer owns:
- **Tone palettes.** Pixel: a fixed small palette (16 colours). Vector: full palette, gradients
  allowed. Every tone resolves in both.
- **Overlay look.** Pixel: a bundled OFL-licensed pixel font, hard 1px outlines, no blur or glow,
  `image-rendering: pixelated` with integer scaling, stepped easing. Vector: smooth easing, soft
  shadows.
- **Creatures (M6.2 + M6.3).** Vector: the existing SVG renderer, unchanged. Pixel: rasterise the
  same SVG to a small canvas (target 32 or 48 px), quantise to the pixel palette, outline pass,
  integer upscale. Seeded, so one seed gives one sprite forever. The same path exports sprite sheets
  (M6.2's single export path).
- **`docs/GRAPHICS.md` (M6.1):** vector for anything composed, recoloured or scaled per player;
  raster for painted backdrops and texture; canvas only where a per-frame redraw is the point; a
  file-size and load budget for each.

Out of scope: redrawing a canvas game's own scene art. A canvas game in pixel style gets a pixel
overlay and pixel creatures; its scene stays as authored.

## 9. Build order (one Devin directive each)

| Step | Delivers | Visible proof on `?game=dissonance` |
|---|---|---|
| 1 | Glossary schema, loader, validation, JSON mirror; Dissonance `glossary.yaml` | Dev panel lists the loaded entries; invalid entry shows ErrorBox |
| 2 | Overlay, anchors, chips, tooltips, DetailCard, event-log panel | Residues and effects visible as chips with tooltips; cards show their effects |
| 3 | `diff` + scheduler + primitives + presets | HP and residue changes animate |
| 4 | Events through the bridge; `combat.lua` emits four events | Dodge / retaliate / detonate / cauterize are shown |
| 5 | Style layer, pixel overlay, creature pixel path, GRAPHICS.md, toggle | Dissonance in both styles; one creature game (Chimera Wilds or Mutant Battle Ball) as second adopter |

Each step merges on its own and leaves every non-adopting game unchanged.

## 10. Testing

- Glossary: schema test over every `games/*/glossary.yaml`; JSON mirror kept in sync by a test.
- Overlay: component tests for chips from glossary + state, anchor fallback, `+N` overflow; one
  Playwright screenshot per adopting game.
- Juice: unit tests on `diff` with fixed prev/next states; scheduler on a fake clock for coalescing,
  cap and reduced motion. No screenshot tests for animation.
- Events: precedence tests; bridge splits `{state, events}` and passes a bare state through; a Lua
  test that `combat.lua` emits the four events.
- Style: golden snapshots (M5.2) of fixed creature seeds in both styles, pixel output as small PNGs;
  every tone resolves in both palettes.
- Floor for every step: `cd ts && npx vitest run` with no new failures against `main`, and no
  skipped or deleted tests.

## 11. Open questions

None blocking. The creature game for step 5 (Chimera Wilds or Mutant Battle Ball) is chosen when that
directive is written, by whichever has the healthier suite at the time.
