# ADR-023: Legacy/Origin Projects Type

**Date:** August 23, 2026
**Status:** Accepted
**Related:** ADR-012 (conversion pipeline), `docs/RFDGameStudio_DemoPortingRoadmap.md` v0.2

## Context

`RFDGameStudio_DemoPortingRoadmap.md` v0.2 made a real, direct correction:
SlimeGarden and SlimeBreeder were not two ordinary Tier 1 porting
candidates — they were merged to become the current, live SlimeWorld.
Porting them as generic `status: 'external'` entries indistinguishable
from a brand-new game would misrepresent what they actually are. The
same real relationship already exists, already correctly identified in
`registry.ts`'s own comments, for two more projects: CorpWorld and
Kingmaker Squads (Planet of Greed's real ancestors, previously retired
from the registry entirely), and for the Dissonance Loop Prototype
(`tmp/dissonance-src/`), the real original AI Studio source behind the
live Dissonance Depths.

This directive's job: register these five real projects honestly, as
what they actually are — real origin history that predates and became
a currently-live game — not as new entries competing with the games
they led to.

## Decision

### The real architectural question: new `GameStatus` value, or reuse `external`?

Investigated directly before deciding, per this directive's explicit
instruction not to defer this question:

**`GameSelector.tsx` and `GameConfig` real current state, confirmed by
direct read:**
- `GameStatus` is a flat union: `'stable' | 'beta' | 'dev' | 'external' | 'tool'`.
- The arcade UI has **no real concept of grouping or visual
  distinction beyond the single status badge** (`ts/src/ui/base.css`'s
  `.arcade-status--{status}` color rules, one per status value).
  `GameSelector.tsx` renders a flat `.arcade-grid` of cards — no
  sections, no type/genre/date grouping infrastructure exists in the
  real UI today, despite the roadmap doc's framing referencing
  "Type/Genre/Date arcade-structure work." That work does not
  currently exist as a real UI feature — this is a real finding worth
  recording, not assuming from the roadmap doc's own language.
- Every existing `status: 'external'` entry already carries its real
  distinguishing information in `label`/`description`, not in the
  status value itself (e.g., `slimebreeder`'s pre-existing description
  already said "a standalone TypeScript reimagining of the SlimeGarden
  core loop" — description-level honesty is already the studio's
  working pattern for this kind of nuance).

**Real cost of adding a new `'legacy'` status:** trivial in isolation
(one union member, one CSS color rule), but it would add a status value
that means something categorically different from the other five
(`stable`/`beta`/`dev`/`external`/`tool` all describe a project's
*current development state*; "legacy/origin" describes a *genealogical
relationship to another project*, an orthogonal axis). Introducing it
without any real grouping UI to back it up would just be a
differently-colored badge — no real behavior change, since nothing in
`GameSelector.tsx` or `GameLoader.tsx` currently branches on status
beyond the `'tool'` case's detail-string special-case.

**Decision: reuse `status: 'external'`, with honest, explicit labeling
in both `label` (a trailing "(Origin)" marker) and `description` (a
plain-language "became/merged into/superseded by" sentence naming the
real, current live game by name).** This is the simpler of the two real
options, and the investigation did not surface a concrete reason the
UI needs new infrastructure right now — matching this directive's
explicit instruction to implement the simpler option unless a real,
concrete reason for the complex one is found. If a genuine grouping UI
is built later (the roadmap's aspirational Type/Genre/Date work), a
dedicated `'legacy'` status or a separate `origin?: string` field can
be introduced then, backed by real UI, rather than speculatively now.

### The five real entries

| gameId | Label | Real relationship | Became |
|---|---|---|---|
| `slimegarden` | Slimegarden (Origin) | Merged with SlimeBreeder | SlimeWorld |
| `slimebreeder` | SlimeBreeder (Origin) | Merged with SlimeGarden | SlimeWorld |
| `corpworld` | CorpWorld (Origin) | Fork ancestor, superseded | Planet of Greed |
| `kingmaker_squads` | Kingmaker Squads (Origin) | Wheel/culture-identity design source, superseded | Planet of Greed |
| `dissonance_prototype` | Dissonance Loop Prototype (Origin) | Original AI Studio (Gemini API) source | Dissonance Depths |

`corpworld` and `kingmaker_squads` had existing `config.ts` files
already preserved in `ts/src/games/` (per the prior retirement
directive) but were absent from `GAME_REGISTRY` — they are now
re-registered with corrected, honest descriptions. `slimegarden` and
`slimebreeder` likewise had existing `config.ts` files, absent from the
registry, now re-registered. `dissonance_prototype` is a new
`ts/src/games/dissonance_prototype/config.ts`, following the same
`status: 'external'` + `embedUrl: '/arcade/{gameId}/'` convention every
other external entry uses — no new UI pattern invented for it.

### Source preservation — confirmed intact, not moved

This directive adds registry visibility only. Real source locations
confirmed unchanged:
- `examples/slimegarden/`, `examples/SlimeBreeder/`,
  `examples/corpworld/`, `examples/kingmaker-squads/` — untouched.
- `intake/slimegarden/`, `intake/corpworld/`, `intake/kingmaker-squads/`
  — untouched.
- `tmp/dissonance-src/` — untouched (original AI Studio Gemini API
  prototype, `metadata.json` + `src/App.tsx` confirmed present).
- `ts/src/games/{slimegarden,slimebreeder,corpworld,kingmaker_squads}/`
  — pre-existing `config.ts` files, descriptions updated in place, no
  restructuring.

## Consequences

- Five real projects gain honest visibility in the arcade as what they
  actually are — origin history, not new competing entries.
- `GameStatus` remains unchanged — no speculative infrastructure added
  ahead of real need.
- `test_arcade_registry_directive.ts`'s prior "absent" tests
  (`test_registry_slimebreeder_slimegarden_absent`,
  `test_registry_corpworld_kingmaker_absent`) are superseded by
  presence + honest-description tests — the old assertions were correct
  for their time (before this Type existed) but are now stale by
  design, not by regression.
- `GAME_REGISTRY.length` grows from 25 to 30. The known,
  easy-to-miss regression point from this session — hardcoded registry
  counts in unrelated test files — was checked directly:
  `test_character_viewer_arcade_entry.ts`'s count assertion was pinned
  to a stale total and is now relaxed to a `toBeGreaterThanOrEqual`
  check (its real job is confirming no pre-existing entry got
  displaced, not pinning an exact total that will keep drifting).
  `test_runtime.ts`'s "two games" count uses a local mock registry,
  unaffected.
- If a genuine Type/Genre/Date grouping UI is built later, these five
  entries are the natural first real test case for a dedicated
  `'legacy'` status or `origin` field — deferred honestly, not
  forgotten.
