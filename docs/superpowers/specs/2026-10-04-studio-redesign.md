# Studio redesign: one declaration, one build, phone first, honest numbers

Date: 2026-10-04. Status: draft for Robert. Authority: his 2026-10-04 decisions (scope = the four areas below; examples/* tracked; player layer later).
Inputs: `docs/state/arcade-and-site-status-2026-10-04.md` (the audit, studio at `250ea4e7`; this spec read origin/main `b5186eec`), the polish standard (`docs/superpowers/specs/2026-10-03-demo-polish-standard.md`), `docs/ROADMAP.md` M4/M5. Spec only: no code, no directives.

## a. Goals and non-goals
Intent, in Robert's words: "inviting for Game Players, encouraging." Goals:
1. Adding a demo is ONE declaration plus generated derivatives; no hand-kept lists.
2. Every demo builds the same way from one template; no 404 embeds.
3. Phones are a first-class target; each demo's SCOPE.md picks its phone layout.
4. Every number the player sees (game count, covers, health) is generated, and a test fails if copy contradicts it.
5. M4/M5 collectibles and creatures get a written contract now; build waits for his decision.
6. Inviting is testable, mapped to the polish tiers (table below). Non-goals: Lua, runtime swaps, a rewrite (TS-native stands; YAML data is the portability hedge); cloud saves, leaderboards, ratings (after this redesign; seams `leaderboards`, `saves`, `itch` in `ts/src/engine/types.ts:59-61` stay untouched); anything needing support staff; breaking an existing `/games/<id>/` or `/arcade/<id>/` URL; deploys.

| Inviting intent | Check | Tier |
|---|---|---|
| First meaningful action in 60 s | cold-load Playwright step reaches a first action; reviewer plays once | B1 (A-tier demos: smoke step only) |
| Friendly arcade home | home shows "Start here" picks, cover on every card, no empty or "dev" tiles; screenshot yes/no at 1280 and 390 | new item H1, scored with C1 |
| Honest labels | status badge words match `GameStatus`; embeds say "embed" or "(Origin)" | A8, A5 |
| No dev-speak | grep of card/blurb/UI strings for a banned list (phase, directive, prototype, TODO, gameId) is empty | A5 plus new test |
| Visible progress and feedback | every primary action has a response; mid-run state restored or labelled session-only | B2, B3 |
| Clear way back | return control present in the shell and in each game, one smoke step | A2, M1 GameShell |

## b. Current state (audit numbers; re-verified at origin/main where marked)
| Fact | Number | Evidence |
|---|---|---|
| Places a new demo touches | 9 (registry.ts, board.data.ts, 3-4 test files, children.json, snapshot, .gitignore) | audit s5.1; `ts/tests/test_registry_export.ts:5` SOURCES map; `ts/src/games/registry.ts:36`; `.gitignore:194-206` |
| Registry config imports | 36 (verified `grep -c "^import .*config'"`) | `ts/src/games/registry.ts:2-38` |
| `docs/demos/*` / `children.json` children | 38 / 38 (verified) | `docs/children.json`; `ls docs/demos` |
| `build:<id>` scripts | 12 ids plus `build:shoal:y8` (verified, 13 `build:` lines) | `ts/package.json:9-21` |
| Vite configs | 13 per-game files plus `vite.standalone.factory.ts` (partly a factory already: `ts/vite.choke_point.config.ts` is 3 lines) | `ts/vite.*.config.ts` |
| Embeds 404 live | `/arcade/succession/`; factory_idle, filipino_bpo_simulator, planetforge unpublished (audit s5.4); dissonance_prototype, character_viewer 404 in the 10-03 audit (s2) | audit s2, s3, s5.4 |
| Site says / publishes | "34 games" / 27 cards / 38 children | audit s4, s5.10 |
| Covers | 19 of 27 | `data/arcade.json` (site repo) |
| `arcade_health.json` | checked 2026-09-20, 21 builds | site repo |
| `examples/` | 30 dirs on the live checkout, 20 tracked dirs, 535 tracked files; ignore rule `examples/*` plus 13 exceptions | `.gitignore:193-206`; `git ls-files examples` |
| Phone game frame | about 374x210 px at 390 px width | audit s5.8 (2026-10-03 audit, not re-measured) |
| M4.2 / M4.3 / M4.4 / M5 | collectible fields absent; blocked; `docs/CREATURE_PIPELINE.md`, `docs/CREATURE_SYSTEM.md` absent | `docs/ROADMAP.md:190-262`; verified `ls docs/CREATURE*` empty, no "collectible" in `ts/src`, `ts/tools` |
| Deploy of embeds | studio does not build example embeds itself; deploy loop in the site repo copies a built `dist` | audit s5.3 (not re-read here) |

## c. Target design

### c1. The single demo declaration
Decision: the declaration IS `ts/src/games/<id>/config.ts` (it already carries `source`, `embedUrl`, `status`: `ts/src/engine/types.ts:32-63`; `ts/src/games/ledger/config.ts` is 12 lines). We stop listing it anywhere else.
- Add optional fields to `GameConfig`: `order?: number`, `phone?: PhoneLayout` (c3), `build?: { kind: 'vite-template' | 'prebuilt' }`, `cover?: string`, `blurb` kept as `shortDescription`.
- `registry.ts` stops importing 36 files: it collects `./*/config.ts` with `import.meta.glob` (eager), sorts by `order` then `gameId`, and requires a default export (the 14 named-export configs, e.g. `slimeworldConfig` at `registry.ts:3`, get a one-line `export default`). Unverified: that `vite-node` (used by `ts/tools/export-registry.ts`) resolves `import.meta.glob`; Phase 1 directive 1 proves it with a test, and falls back to a committed `registry.generated.ts` (below) if it does not.
- `STANDALONE_BUILD_GAMES` (`registry.ts:103-118`, 14 hand entries) is derived from configs where `build` is set.
- Derived, never hand-edited: SOURCES in `tests/test_registry_export.ts` (computed from the registry), `status/board.data.ts` demo rows (generated from config `status`; hand-written notes stay in a separate overlay file keyed by id), `docs/children.json` (existing generator, `studio/demos.py:278`, `uv run python -m studio.demos index`), the arcade manifest (`ts/tools/export-arcade-manifest.ts`, gitignored), and `registry-export.json`. `tests/fixtures/demo_lists_snapshot.json` is retired: it pins the old hand lists (`tests/test_demos_registry_parity.py:8`) and becomes an invariant test (every `source.kind:'example'` slug has a tracked `examples/<slug>/package.json`; every `docs/demos/<id>/SCOPE.md` matches a registry id).
- Who regenerates: the sandbox refuses `uv run python -m studio.demos index`, so no Devin run commits a generated file. Rule: committed generated files are limited to `docs/children.json`. A pytest (`tests/test_children_fresh.py`) recomputes it in memory and, on mismatch, fails with the exact line `regenerate: uv run python -m studio.demos index` and the diff. The controller (Claude on the laptop) runs that command in the PR branch worktree during review and pushes one "regen" commit. Everything else (manifest, registry-export, metadata) stays gitignored and is built by the test or `scripts/check.ps1` (`check.ps1:48` already runs the metadata step), never committed. No pre-commit hook, no CI.
- "New files marked": new generators carry a header `# GENERATED: do not edit; regenerate with <command>`.
- Add-a-demo then means: `uv run python -m studio_mcp.demos import <zip>` (exists: `studio_mcp/demos/register.py`) writes `config.ts` into `ts/src/games/<id>/` and the example source into `examples/<slug>/`; nothing else is edited. The controller regenerates children.json. Check: `cd ts && npx vitest run` plus `uv run pytest tests/test_children_fresh.py`.

### c2. Uniform template build
- One config factory (`ts/vite.standalone.factory.ts`, already exists) plus one script `build:demo` = `node ts/tools/build-demo.mjs <id>`, which reads the config, picks `examples/<slug>` (embeds) or `ts/src/games/<id>` (TS-native), and writes `ts/dist-<id>`. The 12 `build:<id>` scripts and the 13 vite config files collapse to this one script and the factory; keep thin `build:<id>` aliases for one release so polish directives that cite them (standard A7) still pass. Standard A7 is reworded to `npm run build:demo -- <id>`.
- Embeds (`source.kind:'example'`): their `package.json` is the Gemini AI Studio export, and a Devin sandbox cannot run its `npm install` reliably. Rule: Devin directives verify embeds by the factory's `--check` mode (config valid, source tracked, entry file present, no secrets), which needs no install. Real build and `dist` happen on the laptop (controller) via `npm run build:demo -- <id>`, which also installs the embed's dependencies in a temp copy, never inside `examples/`. The 404 embeds are fixed by that build plus a deploy step Robert approves; this spec deploys nothing. Unverified: how the site repo's deploy loop discovers dists (not re-read); Phase 1 directive 4 reads it before changing anything.
- `examples/*` tracking: invert `.gitignore:193-206` to track everything and ignore only `node_modules` and `dist`: lines `examples/**/node_modules/`, `examples/**/dist/`, then delete the 13 `!` exceptions. Before that, a vetting scan of the untracked folders: size (largest live-checkout folder `brewfield` is 186 MB on disk including dependencies), secrets (`AIza`, `sk-`, `ghp_`, private-key patterns, `.env*`), binaries over 5 MB. Findings are reported to Robert before any `git add`; nothing with a hit is added. Result of the scan I ran is in section e.

### c3. Phone-first cabinet, decided per game
Today the site shell (`cabinet.js`, site repo, not read here) frames the game at about 374x210 at 390 px wide (audit s5.8). `GameLoader` already has two modes: fixed aspect for itch embeds when `embedWidth`/`embedHeight` are set, else full-bleed (`ts/src/arcade/GameLoader.tsx:82-120`). The `GameShell` (`ts/src/components/GameShell.tsx`) hides its back button when embedded (`isEmbed()`), so the return pill is the only way back.
Options per game class, declared in config as `phone: 'fullscreen' | 'framed' | 'rotate-hint'`:
- `fullscreen`: on phones the shell opens the game in a viewport-filling layer (100dvh, safe-area insets) with the return pill floating top-left, 44 px minimum. For menu/management/idle games (most of the 27) whose UI is DOM and portrait-friendly.
- `rotate-hint`: same as fullscreen plus a dismissible "Turn your phone sideways" card in portrait. For canvas/action games that need width (Shoal-style simulations, gladiator_arena, voiddrift_redux, racing).
- `framed`: keep today's frame on phones with a visible "Open full screen" button. For embeds that cannot be fixed (AI Studio exports with hard layouts) and tools (character_viewer overflows, audit s5.8).
Decision rule, recorded in each `docs/demos/<id>/SCOPE.md` as a new "Phone layout:" line with one sentence of evidence: (1) can the primary action be reached at 390x844 without horizontal scroll (standard A4)? yes and DOM-based -> fullscreen; (2) needs more than about 600 px of width or pointer precision -> rotate-hint; (3) cannot be fixed within the demo's tier -> framed. Robert may override any row. Default when absent: `framed` (today's behaviour, no regression). The shell implements all three once; each demo only declares one. Test: Playwright at 390x844 asserts frame height at least 70 percent of viewport for fullscreen/rotate-hint and the return pill visible.

### c4. Truthful site data
- One source of truth: the registry export plus `docs/demos`. A generator `ts/tools/export-arcade-manifest.ts` (exists) gains a `counts` block: `{published, total, byStatus, withCover}`. The site reads that block; no number is typed into copy. Site-side change (site repo, separate directive): `content/projects/rfd-game-studio.md:9,:62` ("34 games") become a shortcode reading the manifest, and the stale line "editing its config and nothing else" is made true by c1.
- Test that fails on contradiction (site repo, hermetic): scans `content/**/*.md` for `\b\d+ games\b` and fails unless the number equals `data/arcade.json` length; message names the file and the right number. Plus a studio test that `counts.published` equals the games with `status` not `retired`/`tool`/`external-origin`. No live HTTP in either test.
- Covers: the existing Playwright screenshot step (`scripts/diagnostics`, `docs/state/audit-shots/` per the standard section 5) becomes `npm run covers`, writes 630x500 covers for the 8 missing (succession, slither-rogue, horse-racing, voiddrift, wire-rust, choke-point, voiddrift-redux, gladiator-arena); controller runs it locally (needs a browser, not Devin-safe) and commits the images. Test: every published card has a cover file (hermetic, file existence).
- Health: `check_arcade` (site repo `scripts/site/check_arcade.py`, invoked at `studio_mcp/tools.py:719`) is run by a local Windows scheduled task weekly and writes `data/arcade_health.json` with `checked_at`; a hermetic test fails when the file is older than 14 days relative to the commit date, with the command in the message. Robert's day job means weekly, not live. No hosted monitoring.

### c5. M4/M5 collectibles and creatures: specify now vs defer
- Specify now (docs only, S each): the `collectibles` field shape in the manifest (M4.2, `docs/ROADMAP.md:190`): pulls stored as part id plus variant id references, never a combined key (`ROADMAP.md:199`); the field is optional in `GameConfig` so no demo changes. `docs/CREATURE_SYSTEM.md` (M5.1): map `artGen`, `paperDoll` and the third module and name the contract between them; `docs/CREATURE_PIPELINE.md` (M4.4): variants over new art, sized for one person.
- Defer: the demo-side hook (M4.3), the golden-snapshot determinism harness (M5.2), the pixel path, any art.
- Blocked on Robert: report-versus-grant (site M5.1). Option A, hub-grant: the hub grants progress from attendance and play events; no demo changes; M4.3 is documentation only; cheapest, matches a solo owner (recommended). Option B, game-report: each demo calls a small SDK; M4.3 splits into per-demo work, about 27 touches, and creates a trust problem (clients can fake reports). Option C, park both until the player layer starts.

## d. Phases (nothing deploys until Robert says)
Each directive: small, worktree-only, verified by real commands via `uv run` (Python) or `cd ts && npx vitest run`.

Phase 0, trust the numbers and track examples/. Entry: this spec accepted. Exit: `counts` block generated; contradiction test green; examples/ gitignore inverted with vetted folders tracked; the 8 covers exist.
1. D0.1 Vet untracked examples/ (secrets, size, binaries): repo RFDGameStudio, report only, S, none. Controller acts on the report.
2. D0.2 Invert `.gitignore` for examples/ and add vetted folders: RFDGameStudio, S, D0.1 + Robert's nod on any flagged folder.
3. D0.3 Manifest `counts` block plus studio test: RFDGameStudio, S, none.
4. D0.4 Site count-contradiction test and fix the "34 games" copy: RFD_IT_Services_Site (not protected), S, D0.3.
5. D0.5 Health freshness test plus local scheduled-task script: RFD_IT_Services_Site, S, none. Controller runs the first check.
6. D0.6 `npm run covers` for the 8 missing covers: RFDGameStudio, M, none (controller runs it).

Phase 1, one declaration and uniform build. Entry: Phase 0 exit. Exit: adding a demo edits one config (proven by a fixture demo added and removed in a test); one build command for every demo; all 404 embeds explained.
7. D1.1 Glob registry plus default exports, with fallback proof: RFDGameStudio, M, none.
8. D1.2 Derive SOURCES, STANDALONE_BUILD_GAMES, board rows; retire snapshot for invariants: RFDGameStudio, M, D1.1.
9. D1.3 `test_children_fresh.py` with the exact regenerate message: RFDGameStudio, S, D1.1.
10. D1.4 `build:demo` plus factory `--check` mode, aliases kept: RFDGameStudio, M, D1.1.
11. D1.5 Read the deploy loop and list which embeds lack a dist (report, no deploy): both repos, S, D1.4. Controller then builds and Robert approves any deploy.

Phase 2, phone per game for live demos. Entry: Phase 1 exit. Exit: every live demo has a `Phone layout:` line; shell supports three modes; 390x844 screenshot per demo.
12. D2.1 `phone` field plus shell modes (fullscreen, rotate-hint, framed) in the site shell: RFD_IT_Services_Site, L, Phase 1.
13. D2.2 GameShell phone safe-areas and 44 px return pill: RFDGameStudio, S, D2.1.
14. D2.3 SCOPE.md "Phone layout:" lines, Sonnet batches of 4 to 6 (standard 2b), then per-demo A4 fixes: RFDGameStudio, M per batch, D2.1.

Phase 3, inviting experience. Entry: Phase 2 exit. Exit: all rows of the section a table pass for the 1 to 3 showcase demos picked by Robert.
15. D3.1 Arcade home: "Start here" row, every card has cover plus honest status badge, no dev-speak list test: both repos, M, Phase 0 covers.
16. D3.2 First-minute onboarding (one hint step) and the encouragement pass (feedback, win/loss next action, "Back to the arcade" prompt) per showcase demo: RFDGameStudio, M each, D2.3.

Phase 4, M4/M5. Entry: Robert answers question 4. Exit: `docs/CREATURE_SYSTEM.md` and `docs/CREATURE_PIPELINE.md` exist; `collectibles` in the manifest.
17. D4.1 M4.2 collectibles field and optional config key: RFDGameStudio, S, none (safe before the decision).
18. D4.2 M5.1 CREATURE_SYSTEM.md, M4.4 CREATURE_PIPELINE.md: RFDGameStudio, M each, D4.1.
19. D4.3 M4.3 hook (documentation if option A): S, Robert's decision.

## e. Risks and not done
- `import.meta.glob` under vite-node is unverified (c1); the fallback is a committed generated registry with the freshness test.
- Reordering the registry changes display order; `order` is seeded from today's array order to avoid it.
- Phone numbers come from the 2026-10-03 audit, not re-measured; Phase 2 starts with a fresh 390x844 pass.
- Gitignore inversion can pull in large or secret files: D0.1 gates it. Scan I ran (read-only, live checkout, node_modules/dist excluded): 10 wholly untracked folders (armory-storefront-spindle, brewfield, corpworld, filipino-bpo-simulator, mutant-battle-ball, planetofgreed, scrapcrawl, slimeworld, throwaway-test, voidrift-redux-station-sim), 293 ignored non-dependency files in total; 0 hits for AIza/sk-/gh*_/private-key patterns, 0 files over 5 MB, only `.env.example` env files. brewfield and corpworld are 186 MB on disk because of dependencies. D0.1 still re-runs this on the branch before any add; the `throwaway-test` folder should be dropped, not tracked.
- Embeds without an install in a sandbox cannot be fully verified by Devin; the controller builds on the laptop.
- Not done: cloud saves, leaderboards, ratings, GCP and itch player layer (after this redesign); deploys; M6, M7; `ROADMAP.md` versus `docs/ROADMAP.md` consolidation (question 5).
- Could not verify: `npm run build`, vitest, pytest, `check_arcade.py` not run; site repo files (`cabinet.js`, deploy loop, `data/arcade.json`, `arcade_health.json`) taken from the audit, not re-read; live HTTP not re-fetched.

## f. Open questions for Robert (default in brackets)
1. Is `docs/ROADMAP.md` the one roadmap of record, with the prose `ROADMAP.md` archived? [yes]
2. The demos with a missing live page or embed (succession embed; factory_idle, filipino_bpo_simulator, planetforge, dissonance_prototype per audit s2/s5.4): publish, hide, or retire? [publish the 3 with a game loop, hide tools and origin embeds]
3. Which 1 to 3 showcase demos get Phase 3 polish (standard question 1)? [Shoal plus the two highest-tier beta demos from the scorecard]
4. M4.3 report-versus-grant: A hub-grant, B game-report, C park? [A]
5. Are the 8 missing covers generated by the Playwright step, or do you make them by hand? [generated, you veto]
6. Is a weekly local health check enough, or do you want something running while you are at work? [weekly local]
