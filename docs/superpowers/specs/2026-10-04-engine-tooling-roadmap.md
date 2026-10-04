# Engine tooling and framework roadmap: extract what the demos already hand-rolled

Date: 2026-10-04. Status: draft for Robert. Authority: Robert 2026-10-04, "Do industry standard research, how do we start adding tooling and framework to the engine itself, based on what we have now?"
Inputs: engine inventory and industry research (both 2026-10-04 working notes, evidence below carries file:line), `docs/superpowers/specs/2026-10-04-studio-redesign.md`, `2026-10-03-demo-polish-standard.md`, `docs/ROADMAP.md`, ADR-010/013/014/018. The "tuning tools" spec is a planned sibling (branch `docs/tuning-tools-spec`, not on main when this was written); this roadmap references it and does not duplicate its knob, store, panel or sweep design.
Research caveat: URLs marked [V] were fetched on 2026-10-04; [U] is general knowledge or a search snippet, not verified. Docs only: no code, no queue edits.

## a. Goal and principles
Goal: make the next demo cheaper and safer to build, and make every demo more inviting on a phone, by growing a small shared engine out of what shipped demos already duplicate. TS-native stays (ADR-010/013/018); Lua is legacy; YAML data is the portability hedge. No rewrite, no runtime swap.
1. EXTRACT, DON'T DESIGN (research, [V] https://github.com/a327ex/blog/issues/31 and https://loglog.games/blog/leaving-rust-gamedev/): a feature enters the engine only after 2-3 shipped demos hand-rolled the same thing. Evidence today: 8+ games keep their own `utils/sound.ts` beside the shared `engine/shared/sfx/engine.ts` (224 lines); about 21 ad hoc `keydown` handlers and about 5 pointer/touch handlers; about 199 `Math.random` uses (119 of them in sim-core scope, section c) against one shared `seededRandom.ts` (42 lines); zero schema validation of YAML (only `docs/glossary.schema.json`); no error boundary and no `window.onerror`; `?dev=1` in exactly one game (gladiator_arena).
2. Prefer anything that shortens the edit-test loop (tests, headless sims, hot reload, overlays) over architecture.
3. Each piece is a small new module with one job (SOLID/SRP hard rule); existing games are touched only to delete their copy, one game per change.
4. Each piece is independently useful, optional, and verified by one command; a Devin directive per piece, no piece waits on a design meeting.
5. Players come first: phone-first, no dev-speak, nothing dev-only reaches a player (`?dev=1` gate), no telemetry that needs a backend or a consent banner.
6. Robert sets direction and judges feel; agents build; the measure is demos shipped per month, not engine features.
7. Add-only and backward compatible: existing `/games/<id>/` URLs, saves and configs keep working.
8. Guards that can only get stricter: a baseline file lists today's violations, a test fails when the list grows, a cleanup shrinks it.

## b. The 3-layer map (engine as it should look)
Layout rule: a layer may import only from layers above it in this list; Dev tools are never imported by a player path except through a lazy `?dev=1` gate.

### Layer 1 Core (sim, determinism, data)
- Today: `ts/src/engine/shared/seededRandom.ts` (mulberry32, hashStringToSeed); Lua seeded via `math.randomseed` at `engine/executor.ts:67`; Lua-over-YAML for 11 games, TS-native sims for Shoal and MBB; `hooks/useGameLoop.ts` is rAF with dt capped 0.05 s and no fixed-step accumulator; headless sim tests exist (shoal_headless, scrapcrawl_sim_runs, chimera_wilds_balance, horse_racing_headless_balance, slimeworld_headless_balance, succession_balance_sim); about 236 `Date.now/performance.now`; YAML parsed by js-yaml 4.2.0 with no schema.
- Standard: fixed timestep with accumulator and frame-time cap, replay = seed + input log ([V] https://gafferongames.com/post/fix_your_timestep/); typed data validated at load and in tests (Zod, [V] https://zod.dev/); bots x seeds Monte Carlo balance ([V] https://github.com/Dungeons-Moles/game-balance-sim; [V] Ubisoft bots https://gdcvault.com/play/1026382/Automated-Testing-Using-AI-Controlled).
- Gap: determinism is per game and unenforced; no replay; no data schemas; no shared fixed-step helper.

### Layer 2 Platform (shell, input, audio, persistence, UI kit, error boundary)
- Today: `components/GameShell.tsx` (85 lines, hides back button when `isEmbed()`); `engine/shared/persistence.ts` (60 lines, `{v,data}` envelope, callers choose keys, no namespace); no input abstraction; shared `sfx/engine.ts` plus 8+ private `sound.ts`; `ts/src/ui/components` 16 files + `tokens.css`; `ErrorBox` is a message div, not a boundary; a11y thin (about 35 aria/role, 2 reduced-motion files); phone cabinet modes specced (redesign c3), not built.
- Standard: action-map input with keyboard + pointer + Gamepad polling ([V] https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API); AudioContext resumed inside a user gesture ([V] https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices); versioned saves with ordered migrations [U]; WCAG 2.2 target size 2.5.8 and motion 2.3.3 ([V] https://www.w3.org/TR/WCAG22/), Game Accessibility Guidelines ([V] https://gameaccessibilityguidelines.com/); local crash capture, hosted Sentry optional ([V partial] https://docs.sentry.io/platforms/javascript/).
- Gap: one throw blanks a whole cabinet; saves collide by key; every game re-decides keys, touch and sound.

### Layer 3 Dev tools (overlay, tuning, sweeps, replay, validation)
- Today: `ts/tools` (2.1k LOC: export-registry, build-demo + embedCheck, status generators); `scripts/check.ps1` plus `.githooks/pre-push`; `?dev=1` only in `games/gladiator_arena/App.tsx`; `?glossary` panel in GameShell; glossary schema + validate test as the one data-validation model; pipeline_audit + `tests/test_children_fresh.py` freshness pattern; no size budgets, no live probe in this repo (hand HEAD sweep 2026-10-04).
- Standard: one dev flag, tweak pane, pause/step/speed bound to the fixed-step loop [U] (Tweakpane [V] https://tweakpane.github.io/docs/); golden-master final-state hashes; bundle budgets and contract smoke tests; ADRs [V] https://adr.github.io/.
- Gap: each tool is per game or per script; tuning is the sibling spec; replay, validation and budgets are absent.

## c. Verdict table (the 14 research areas, applied to this repo)
| # | Area | Verdict | Reason tied to this repo |
|---|---|---|---|
| 1 | Data schemas | ADOPT NOW | js-yaml loads 12 games' YAML unchecked (`loader.ts:70-90`); Zod + one vitest over every `games/*/data.yaml`; glossary validate test is the template |
| 2 | Dev tools | BUILD SMALL | one `?dev=1` standard from gladiator_arena's flag; overlay waits for E1's step loop; tuning panel is the sibling spec |
| 3 | Determinism/replay | ADOPT NOW | `seededRandom.ts` exists; 119 bare random/time uses in sim scope; guard first, replay after |
| 4 | Balance sweeps | BUILD SMALL | 6 headless balance tests already hand-roll the loop; sweep tool is in the tuning spec, harness shape [V] game-balance-sim |
| 5 | Saves/migrations | ADOPT NOW | `persistence.ts` already has `{v,data}` + migrate; add namespacing and a migration registry before 38 games diverge |
| 6 | Input/touch | BUILD SMALL | 21 keydown handlers prove the need; extract after the first 2 games converge; phone pill is already specced |
| 7 | Audio | BUILD SMALL | 8 `sound.ts` copies vs `sfx/engine.ts`; consolidate one game at a time, add unlock-on-gesture |
| 8 | UI/a11y | ADOPT NOW (tokens, reduced motion); LATER for the rest | `tokens.css` exists; only 2 reduced-motion files; WCAG 2.5.8 24 px minimum on the 44 px pill |
| 9 | Assets/budgets | ADOPT NOW (budgets); LATER (atlases) | dist 0.2-4.9 MB per embed with no budget; no atlas pain evidenced |
| 10 | Analytics/crash | BUILD SMALL | local ring buffer + opt-in copy; hosted analytics ADOPT LATER (needs backend/cost; Plausible [V] https://plausible.io/data-policy) |
| 11 | Quality gates | ADOPT NOW (contract smoke, probe); LATER (semver) | `check.ps1` exists; changesets/API Extractor are ceremony while one trunk and all demos share one engine ([V] https://github.com/changesets/changesets, https://api-extractor.com/) |
| 12 | ECS/scenes | SKIP ECS; BUILD SMALL scene stack only on demand | cautionary tales; no demo has >1k entities (voiddrift particle sandbox is the one to measure) |
| 13 | Editors | SKIP custom editor; LATER LDtk ([V] https://ldtk.io/) | YAML + Zod errors + Vite HMR is the editor; tile games only if asked |
| 14 | Docs/ADR | ADOPT NOW | 23 ADRs exist; add one ADR for this roadmap's layering when E0 lands |

## d. Ranked adoption list (value per effort; built on an existing piece)
| # | Item | Size | Depends on | Builds on |
|---|---|---|---|---|
| 1 | Zod schemas + vitest over every demo's YAML | M | controller installs `zod` | glossary schema + validate test; `loader.ts` |
| 2 | Shared ErrorBoundary + diagnostics ring buffer + copy | M | none | `ui/components/ErrorBox`, `GameShell` |
| 3 | Seeded-sim guard with shrinking baseline | S | none | `seededRandom.ts`; test_children_fresh style |
| 4 | Save envelope namespacing + migration registry | S | none | `engine/shared/persistence.ts` (+ test_shared_persistence) |
| 5 | Fixed-timestep loop helper + replay record/playback | M | #3 | `hooks/useGameLoop.ts`, `seededRandom.ts` |
| 6 | Golden-master tests (2 games first) | S | #5 | shoal_headless, scrapcrawl_sim_runs |
| 7 | `?dev=1` standard + debug overlay (pause/step/speed) | M | #5; tuning tools | gladiator_arena flag, GameShell |
| 8 | Size budgets + contract smoke per demo | S | none | `build-demo` embedCheck, `check.ps1` |
| 9 | Shared audio module + input action map | L | 2 games converge | `sfx/engine.ts`, 8 `sound.ts`, 21 keydown handlers |
| 10 | Reduced-motion + UI tokens + ADR | S | none | `tokens.css`, `base.css` |

## e. Phased roadmap
Each phase ends when its exit check passes on main; entry means the previous phase's exit passed (E0 items may run in parallel).
- E0 Safety net. Items: Zod schemas for YAML (3 games first, then all 12) with one vitest; shared ErrorBoundary + local diagnostics ring buffer + opt-in copy diagnostics in GameShell; seeded-RNG guard test with baseline; save namespacing + migration registry (the first four directives, section f). Entry: now. Exit: `cd ts && npx vitest run test_engine_data_schemas.ts test_error_boundary.tsx test_seeded_sim_guard.ts test_persistence_namespace.ts` green, `npx tsc --noEmit` exit 0, and a deliberate throw in one game shows the friendly fallback (visible check, phone width).
- E1 Determinism and replay. Items: fixed-timestep helper (`engine/loop/fixedStep.ts`), replay record/playback from seed + input log, golden-master final-state hash for 2 games (Shoal TS sim, scrapcrawl first). Entry: E0 guard in place. Exit: `npx vitest run test_replay_golden.ts` green and the same replay reproduces the same hash on 3 consecutive runs; baseline count in the guard is lower than at E0.
- E2 Dev tools. Items: one `?dev=1` helper (`engine/dev/devFlag.ts`) replacing gladiator_arena's private check; debug overlay with pause/step/0.25x-4x speed bound to the fixed step; hook up the tuning tools (sibling spec). Entry: E1 loop helper. Exit: `npx vitest run test_dev_flag.ts` green; visible: `?game=shoal&dev=1` shows the overlay and without `dev=1` the overlay chunk is never requested.
- E3 Platform extraction. Items: input action map (keyboard + pointer + gamepad poll), shared audio module consolidating the 8 `sound.ts` (one game per PR, unlock on first tap), save-envelope adoption in 3 games, `prefers-reduced-motion` + UI tokens. Entry: 2 games already converge on the shape (rule 1). Exit: `grep -rl "utils/sound" ts/src/games | wc -l` at most 4 (from 8+), keydown handler count under 12, tests green.
- E4 Quality gates. Items: size budget per embed in `scripts/check.ps1` / `build-demo --check`; contract smoke test per demo (imports the public entry, boots headless); `scripts/probe_live.ps1` post-deploy HEAD sweep (read-only, reports 404s). Entry: E0. Exit: `pwsh scripts/check.ps1` fails on a deliberately oversize fixture and passes clean; probe lists every `/games/<id>/` with a status code.
- E5 Later, only on evidence. Changesets + API Extractor when a demo must pin an engine version; hosted analytics (Plausible or Sentry, Robert's call, cost and backend); atlas tooling when draw calls bite; LDtk for a level-based demo; Howler only if the WebAudio wrapper proves thin. Entry: the trigger happens. Exit: per item.

## f. First four directives (files in `docs/directives/`, not queued)
| Directive | Size | Depends on | Baseline pasted from a scratch worktree at origin/main `cc793954` |
|---|---|---|---|
| `Engine_Data_Schemas_Zod_Directive.md` | M | CONTROLLER installs zod first (not in `package.json`, lockfile or `node_modules`, verified); Devin starts after | `loadSave` suite green, tsc exit 0, YAML top-level keys of 3 games |
| `Engine_Error_Boundary_And_Diagnostics_Directive.md` | M | none | `ErrorBox` is a 3-line message div; GameShell 85 lines, no boundary |
| `Engine_Seeded_Sim_Guard_Directive.md` | S | none | 119 bare random/time uses in 17 sim-scope files (list in the directive) |
| `Engine_Save_Envelope_Namespacing_Directive.md` | S | none | `test_shared_persistence.ts` 9 passed |
Order: seeded guard, save namespacing, error boundary can start at once (disjoint files); zod waits for the controller's install. Status rows: each directive says "done = branch pushed, tests green, Status row notes the verification output"; Robert merges and marks Done.

## g. Risks, what NOT to build, open questions
Do NOT build:
- An ECS framework: ECS is an engineering and performance pattern, not a design one, and the cautionary tales (LogLog [V], a327ex [V]) report it slowed shipping; plain objects, explicit state machines and a scene stack suffice. Revisit only when one demo measures over 1k entities.
- A custom level or data editor: YAML + Zod error messages + Vite HMR is the editor, LDtk/Tiled exist for tile games [V] https://ldtk.io/; an editor is the classic engine-instead-of-game trap (Happycake, ~18 months, never shipped; [U] snippet https://80.lv/articles/developer-revisits-a-20-year-old-game-engine-created-by-two-people-in-just-18-months).
- Engine versioning (changesets, API Extractor): one trunk, all 38 games on the same engine, so semver is ceremony until a demo must pin a version.
- A hosted analytics or crash backend now: needs cost, privacy copy and upkeep a solo owner lacks; the local ring buffer covers diagnosis.
Risks: (1) a shared module touching a live game regresses it: migrate one game per PR, keep the old copy until the new one is verified; (2) text-assert-heavy tests (about 112 files use `readFileSync`) give false confidence, so new guards assert behaviour; (3) engine work crowding out demo polish: cap E-phases at one directive per beat, demos stay first; (4) the pre-push hook's known fixture hazard (memory: studio pre-push hook wipes branch) means re-list commits before any push.
Open questions for Robert (defaults in brackets):
1. Add `zod` (about 2 kB core, [V] https://zod.dev/) as a runtime dependency? [Yes: controller runs `cd ts && npm install zod` on a branch and commits the lockfile before directive 1 starts.]
2. Local-only diagnostics (copy button, nothing sent anywhere) for now, hosted crash reporting later? [Yes, local only; revisit when a hosted number would change a decision.]
3. Should the sim-core guard cover `engine/shared` and `games/*/simulation` only, or all game code? [Sim scope only; UI random (particles, cosmetics) is allowed.]
4. Replay and golden masters first on Shoal and scrapcrawl, or other games? [Shoal and scrapcrawl: both already have headless sim tests.]
Unverified: Lua-over-YAML games' sim determinism beyond `math.randomseed`; that vite-node resolves `import.meta.glob` (redesign spec notes the same); the tuning-tools spec's final shape; [U] items in the research.
