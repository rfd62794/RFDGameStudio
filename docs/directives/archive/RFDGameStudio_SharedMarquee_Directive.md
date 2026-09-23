# RFDGameStudio — Phase: Shared Marquee Identity (Arcade + GameShell)

*July 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Verify baseline before touching anything. Confirmed this
> session: `194 passed` (Python), `64 passed` (TypeScript), both exit 0.
> Re-run yourself first.
>
> **This phase touches every game's header construction and the shared
> component/token layer.** It is sequenced deliberately — foundation first,
> one game as proof, then the remaining five, then the lobby. Do not
> reorder these parts. A half-migrated state (some games on the new
> system, some not) is worse than not starting, because it defeats the
> actual point: one consistent identity, not five old ones and one new one.

---

## §0 Context

**What this delivers:** A real, considered visual identity — the "cabinet
frame, honest content inside" hybrid already agreed — carried consistently
from the Arcade lobby into every individual game, built on the component
layer ADR-008 already decided but never finished styling.

**Confirmed directly this session, not assumed:**
- `ui/components/` has nine real, complete, well-typed components
  (`Button`, `Panel`, `Badge`, `StatBar`, `TabBar`, `Card`, `Modal`,
  `EmptyState`, `ErrorBox`) — but the CSS classes they reference
  (`btn-primary`, `stat-bar-fill`, `badge-green`, etc.) do not exist
  anywhere in `tokens.css` or `base.css`. Used as-is today, they render
  unstyled. This phase writes that missing CSS layer for the first time.
- `GameShell.tsx` is a pure structural skeleton — three layout divs, zero
  owned content. Every game currently builds fully custom header JSX and
  hands it in as a freeform `ReactNode`. This phase gives `GameShell` real,
  consistently-rendered content for the first time.
- The existing token base (`--bg: #0f1117`, `--accent: #6c8ef7`) is not
  being replaced — it's a legitimate technical/terminal palette for a
  studio literally called "Arcade" running Lua/Python/TypeScript. What's
  missing is real display typography (currently bare `system-ui`, zero
  personality) and the signature marquee treatment.

**Confirmed design direction (locked from prior discussion, do not
re-litigate in this directive):** hybrid of cabinet-marquee framing (bold,
theatrical, spent in exactly one place — the title/brand treatment) with
honest, dense, technical content inside each card and each game's header
(monospace game ID, real build-status language, no decorative filler).

**Explicitly NOT in scope:**
- Any change to any game's actual gameplay logic, state, or internal
  content areas — this touches header construction only
- The per-card "engine-derived technical detail" must be pulled from real
  data at execution time (which runtimes a game actually has, confirmed
  against `renderers/pygame/games/` for real PyGame presence, or a real
  count from that game's own `data.yaml`) — do not invent or copy a
  plausible-looking number. If uncertain which real detail to surface,
  stop and report rather than guess.
- Site deployment — still blocked on this phase finishing

---

## §1 Scope Statement — in required order

| Part | File(s) | Action |
|---|---|---|
| 1 | `ts/src/ui/tokens.css` | Add display/mono font tokens, marquee-specific custom properties |
| 1 | `ts/src/ui/base.css` | Write the missing CSS for all nine base components |
| 1 | `ts/src/components/GameShell.tsx` | New structured props: `gameLabel`, `gameId`, `phase?`, `statusArea?` |
| 2 | `ts/src/games/scrapcrawl/App.tsx` | First migration — proof of the new contract |
| 3 | `ts/src/games/{horse_racing,slither_rogue,mutant_battle_ball,slime_coin,chimera_wilds}/App.tsx` | Remaining five, using the now-proven pattern |
| 4 | `ts/src/arcade/GameSelector.tsx` | Marquee lobby redesign |
| 4 | `ts/src/arcade/*.css` or extension of existing arcade styles | Card redesign — cabinet frame, honest content |
| — | `ts/tests/test_shared.ts`, `ts/tests/test_arcade_routing.ts`, `ts/tests/test_arcade.ts` | New/updated anchors per part |
| — | `docs/state/current.md` | New phase entry |
| Read-only | Every game's non-header source (logic.lua, data.yaml, gameplay components) | Do not touch |

---

## §2 Implementation

### Part 1 — Foundation

**`tokens.css` additions:**
```css
--font-display: /* a real display face with genuine character — verify
  actual availability (system font, or a real webfont load) before
  committing to a specific family name here; do not hand-wave a font
  that isn't actually loaded */;
--font-mono: /* existing monospace-flavored elements already gesture at
  this in ScrapCrawl's own styling — formalize what's already working
  rather than invent a new one */;
--marquee-glow: /* the one considered accent treatment for the signature
  title moment — used once, not scattered across every element */;
```

> ⚠️ RULE: Verify any display font is actually loaded and rendering before
> treating it as done. A `font-family` declaration pointing at a font
> that isn't actually available just silently falls back to the next
> option in the stack — confirm visually, not just in the CSS.

**`base.css` additions:** real styles for `.btn-primary`/`.btn-secondary`/
`.btn-danger`/`.btn-neutral`/`.btn-sm`/`.btn-lg`, `.stat-row`/`.stat-bar-bg`/
`.stat-bar-fill`, `.badge-player`/`.badge-green`/`.badge-red`/`.badge-yellow`/
`.badge-amber`/`.badge-muted`, and equivalent real styles for `Panel`,
`TabBar`, `Card`, `Modal`, `EmptyState`, `ErrorBox` — matching each
component's actual rendered class names, not approximations.

### `GameShell.tsx` — new contract

```tsx
interface GameShellProps {
  gameLabel: string;
  gameId: string;
  phase?: string;
  statusArea?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}
```

`GameShell` itself now renders the title treatment (real display
typography, the marquee signature), the phase badge, and a consistent
"← Arcade" back-link using `navigateHome` from `../arcade`. `statusArea`
stays a free slot — each game's own stat readouts, exactly as varied as
they need to be, rendered inside the new consistent frame rather than as
part of a fully custom header.

> ⚠️ RULE: This is a breaking change to `GameShellProps`. Every current
> caller passes a `header` prop that no longer exists on the interface.
> `tsc --noEmit` will catch every site that needs updating — treat that as
> the authoritative list, not a memory of which six files to touch.

### Part 2 — ScrapCrawl migration (proof)

Update `ScrapCrawl/App.tsx` to use the new `GameShell` contract:
`gameLabel="SCRAPCRAWL"`, `gameId="scrapcrawl"`, `phase="PHASE A.1"`,
`statusArea` receiving exactly the Scrap/Tier 2/Room readout that's already
there today, unchanged in content, just relocated into the new slot.

**Stop here and verify visually (real screenshot or browser check) before
proceeding to Part 3.** This is the actual proof the new contract works
end to end, not just compiles.

### Part 3 — Remaining five games

Same mechanical pattern, per game, using each game's own real
`statusArea` content (Funds for horse_racing, Iron/roster for
mutant_battle_ball, whatever each game's own header already displays).
Do not standardize what each game's status area *contains* — only how
it's framed.

### Part 4 — Arcade lobby

`GameSelector` gets the actual marquee treatment for "RFD GAME STUDIO" and
the cabinet-frame card redesign — real display type for the title, honest
technical detail per card (see §0's explicit rule on this), monospace game
IDs preserved (already correct), status badges kept as real build-state
language, not softened into marketing copy.

---

## §3 Test Anchors

Target: **64 + 12 = 76 TypeScript passing**, 0 failed. No Python changes.

| Test name | Behaviour |
|---|---|
| `test_game_shell_renders_game_label` | `gameLabel` appears in rendered output |
| `test_game_shell_renders_back_link` | Back-link present, calls `navigateHome` on click |
| `test_game_shell_status_area_renders_children_unmodified` | Whatever's passed in `statusArea` renders as-is — GameShell doesn't reinterpret game-specific content |
| `test_game_shell_phase_badge_optional` | Renders correctly with and without `phase` |
| `test_scrapcrawl_uses_new_shell_contract` | Regression proof for Part 2 |
| `test_horse_racing_uses_new_shell_contract` | Part 3, one per remaining game |
| `test_slither_rogue_uses_new_shell_contract` | " |
| `test_mutant_battle_ball_uses_new_shell_contract` | " |
| `test_slime_coin_uses_new_shell_contract` | " |
| `test_chimera_wilds_uses_new_shell_contract` | " |
| `test_game_selector_marquee_renders` | The new lobby title treatment renders |
| `test_game_selector_card_shows_real_runtime_detail` | The per-card technical detail matches real registry/renderer data, not a hardcoded string |

---

## §4 Completion Criteria

- [ ] `76 passed, 0 failed` (TypeScript) — raw output
- [ ] `194 passed, 0 failed` (Python) — unchanged, confirm nothing broke
- [ ] `npx tsc --noEmit` — zero new errors, and explicitly confirm every
      `GameShell` call site was caught and updated by the compiler, not
      missed
- [ ] `npx vite build` exits 0
- [ ] Manual proof: real screenshot or browser check of the ScrapCrawl
      migration (Part 2) before Part 3 began — this is the actual gate,
      not a formality
- [ ] Manual proof: real screenshot of the redesigned Arcade lobby
- [ ] Explicit statement of what real font is actually loading for
      `--font-display`, confirmed visually
- [ ] Explicit statement of what real data source backs each game's
      per-card technical detail — named per game, not asserted in general
- [ ] `git diff --stat` — confirm zero changes outside header construction
      and the shared foundation files; no gameplay logic touched
- [ ] `docs/state/current.md` updated, headed CERTIFIED when done

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Sequencing | Foundation → ScrapCrawl proof → remaining 5 → lobby, in that order, not parallel |
| GameShell new props | `gameLabel`, `gameId`, `phase?`, `statusArea?` |
| What's shared | Title treatment, back-link, phase badge, card frame |
| What stays per-game | Actual stat content, gameplay logic, everything inside `children` |
| Real per-card detail | Derived from actual runtime/data.yaml, verified per game, not invented |
| Explicitly deferred | Site deployment |

---

*RFDGameStudio — Shared Marquee Identity Directive*
*RFD IT Services Ltd. | July 2026*
*One frame, six honest games inside it — proven on one before it touches the rest.*
