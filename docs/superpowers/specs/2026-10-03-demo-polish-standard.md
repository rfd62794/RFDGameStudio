# Demo polish standard

Date: 2026-10-03. Status: draft for Robert. Scope: every demo in `ts/src/games/<id>` (sources in `examples/`) shipped to games.rfditservices.com/games/<id>/ and itch.

Sized for one person with a day job: polish is bought per demo, in proportion to what the demo is worth. No item assumes support staff, analytics, or a QA team. Existing per-game "Polish_*_Chrome" directives in `docs/directives/` cover shared chrome and SFX; this standard sits above them and does not replace them.

## 1. What "polished" means

Registry status (`ts/src/engine/types.ts` GameStatus): `external` = iframe of the original, not a port; `dev` = TS-native, unfinished; `beta` = playable, known gaps; `stable` = ready to show (today only `shoal`); `tool` and `retired` are out of scope. A demo's status moves up only when its tier is met.

Each item is a command, a Playwright smoke step, or a yes/no from a screenshot. Tiers are cumulative.

### Tier A: baseline (every demo; required for `beta`)
- A1. `/games/<id>/` loads; Playwright records zero `console.error` and zero failed network requests in 10 s. For `external` embeds, a console error that the embedded third-party page raises itself and that is listed in `ts/src/arcade/embedConsoleFilter.ts` is recorded but does not fail A1.
- A2. Launches from the arcade shell (card click, game visible) and returns via the shell's back control. Smoke step.
- A3. A visible Start and a visible Restart (or New Game); Restart returns to the first screen without a page reload. Smoke step.
- A4. Controls work at 1280x720 (mouse/keyboard) and at 390x844 touch emulation: the primary action is reachable, no horizontal scroll, no clipped control. Two screenshots, yes/no.
- A5. Registry entry has a blurb of 60 words or fewer with no placeholder text, and one screenshot referenced by the arcade manifest. Yes/no.
- A6. `cd ts && npm test` green, with at least one test file for the demo's logic (`external` demos exempt, but A1-A5 and A8 apply).
- A7. `cd ts && npm run build:demo -- <id>` exits 0 (standalone demos build into `ts/dist-<id>`; example embeds are verified in a sandbox with `--check` and built on the laptop). The per-game `build:<id>` scripts still work as aliases.
- A8. `external` demos only: the iframe loads, fits the shell, and the card labels it honestly ("embed" or "(Origin)"). Screenshot yes/no.

### Tier B: playable and sticky (demos worth a second visit)
- B1. First minute: from cold load a new player reaches a first meaningful action in 60 s or less with no outside explanation (one hint, tutorial step, or prompt). Reviewer plays once, yes/no.
- B2. Persist: reload mid-run restores state (smoke: act, reload, assert same state), or the game says it is session-only. A reset-save control exists.
- B3. Feedback: every primary action has a visible response (animation, number pop, sound, flash). Screenshot pair or short clip, yes/no per action.
- B4. Balance pass: a headless vitest run plays N turns/ticks with a baseline strategy and asserts no softlock, no negative resource, and a win or loss reachable. The test names the numbers it checks.
- B5. Audio hooks (only if the game has audio): mute control present and persisted; nothing plays before first input. Smoke step.
- B6. Win, loss, and death screens each show a clear next action. Screenshot yes/no.

### Tier C: showcase (a few demos only)
- C1. Art/UI pass: uses `ts/src/ui/components/` chrome or a documented bespoke style; no placeholder boxes. Reviewer yes/no on 3 screenshots against a one-line style note in the PR.
- C2. Performance: first-load JS 1.5 MB gzip or less (from build output); 50+ fps for 30 s on the audit machine (Playwright rAF counter); no layout shift after load.
- C3. Accessibility basics: every control keyboard reachable with visible focus; axe-core reports zero serious violations; the primary HUD never relies on colour alone.
- C4. itch page: title, 630x500 cover, 3 screenshots, short description, tags, build uploaded via `RFD_IT_Publishing`. Link recorded in the scorecard.
- C5. Devlog: one post tagged with the game's `devlogTag`. Robert publishes.

## 2. Scorecard and choosing a target

One table in `docs/state/demo-polish-scorecard.md`, one row per demo (about 28), updated by the audit and by each demo's PR.

| demo | status class | tier target | baseline gaps (failing A-items) | effort S/M/L | blocking dependency |
|---|---|---|---|---|---|
| example | dev | B | A3, A7 | S | none |

Effort: S = under one Devin run, fixes only; M = one directive with new modules; L = a rewrite or a decision from Robert.

Rule for the tier target:
1. `retired`, `tool`, and Origin (`supersededBy`) entries: Tier A only, done once, cheaply.
2. Portfolio value: demos that show Robert's skills to a client or reader, or already have an audience, may target C. Everything else caps at B.
3. How finished: a demo that already passes most of A and has a real game loop may target B or C; an `external` embed targets A until its TS-native rewrite is chosen.
4. At most 3 demos at C at any time. Default is A for unlisted demos, B for the rest.
5. Robert can override any row; the scorecard records the override.

## 2b. Scope analysis (written before any rebuild directive)

Most demos already point somewhere; the job is usually to improve or refine, not reinvent. Direction belongs to Robert, not the building agent.

Rules:
1. Every demo gets a scope analysis before its rebuild directive exists. The directive's Scope and Out-of-scope sections are copied from the analysis, not re-derived.
2. Where direction is genuinely unclear, the analysis says so under "Open question for Robert" and proposes nothing past Tier A for that demo until he answers. It never picks a direction for him.
3. Location: `docs/demos/<id>/SCOPE.md`, one file per demo, committed on a docs branch and reviewed by PR.
4. Authors: Sonnet subagents (model named explicitly), batches of 4 to 6 demos per agent grouped by similarity (for example idle/incremental games, roguelike/deckbuilders, sims, origin embeds), never one agent per demo. Read-only on code; they write only the SCOPE.md files.
5. Review: Claude spot-checks the evidence citations in each batch. Robert reads only the analyses flagged unclear (and may override any).

Template, under 25 lines, every claim cited as `path:line` or README/config text, no guesses:

```
# <id> scope analysis (date, author agent, registry status)
Direction: what it is and where it already points (evidence: ...)
Working: (3 bullets max, each with evidence)
Rough: (3 bullets max, each with evidence)
Class: improve | refine | rework, with one-sentence reason
  (refine = polish what exists; improve = add to the existing direction; rework = replace a part or the whole)
Top 3 changes, in order: 1. ... 2. ... 3. ...
Out of scope: (explicit list, so the directive cannot sprawl)
Dependencies / risks: (shared modules, assets, other demos, hosting)
Effort: S | M | L
Open question for Robert: (only if direction is unclear; else "none")
```

## 3. Rebuild workflow (one demo, one directive)

0. Precondition: the demo's `docs/demos/<id>/SCOPE.md` exists and any open question on it is answered.
1. Claude (Sonnet subagent or controller) writes a Devin directive from the scorecard row and the SCOPE.md (Scope and Out of scope copied verbatim): repo, absolute paths, tier target, the exact failing items, and what not to touch (protected repos, other demos, the live checkout on main).
2. Devin works only in its worktree, one demo per directive, new behaviour in small new modules (SRP/KISS), shared code per ADR-014 checked first.
3. Verification in every directive uses the real commands: `cd ts && npm test`, `cd ts && npm run build:demo -- <id>`, plus the Playwright smoke steps for the target tier, with output tails pasted into the report.
4. Review by Claude (Sonnet subagent) with a screenshot checklist: desktop and phone screenshots of start, mid-play, and end; every item of the target tier answered yes/no; console error list attached.
5. Merge by Claude with `gh pr merge --merge` (not squash) under Robert's standing approval for arcade and website publishing (2026-09-27), for green, non-protected work. Merge is not deploy; deployment follows the existing site pipeline.
6. Claude marks the directive Done and updates the scorecard row. Robert is pulled in only for the open questions below.

## 4. Wave plan

Capacity: the laptop admits 2 Devin agents, the cleanroom its own; one demo per directive. A wave is 4 to 8 demos at Tier A, or 2 to 4 at Tier B/C. These are estimates, not promises; Claude review time, not Devin time, is usually the limit.

- Every wave runs in this order: scope analyses for that wave's demos (Sonnet batches of 4 to 6, section 2b), Robert answers any flagged questions, then rebuild directives. Analyses for wave N+1 can be written while wave N builds.
- Wave 0 (audit): section 5. One Haiku run, no code. Fills the scorecard and fixes the order; first Sonnet analysis batches start from its output.
- Wave 1: live demos closest to Tier A (fewest failing items, S effort). Quick visible wins: blurbs, screenshots, Restart control, missing `build:<id>`. Roughly 6 to 10 demos over 1 to 2 waves.
- Wave 2: `external` embeds chosen for a TS-native rewrite (candidates: AntSim Redux, Facility Escape, 7 Days to Fry, PlanetForge), one per directive. 2 to 4 per wave, spanning several waves because rewrites are L.
- Wave 3: not-started ports from the Demo Porting Roadmap (Sandustry family, Coin Pusher Arcade). TurboShells and the VoidDrift web renderer stay gated on their own investigation.
- Between waves: Tier B/C passes on the 1 to 3 showcase demos, one at a time.
- Each wave ends with a visible arcade change (new badges, screenshots live) and a scorecard refresh.

## 5. Audit step

One Haiku subagent (model named explicitly) with Playwright, read-only, fixes nothing. For every registered, non-retired demo it visits `https://games.rfditservices.com/games/<id>/` and records:
- gameId, registry status, URL, HTTP status, load time (ms), timestamp from `Get-Date`.
- Full-page screenshots at 1280x720 and 390x844, saved to `docs/state/audit-shots/<id>-desktop.png` and `<id>-phone.png`.
- Console errors and warnings (text, count) and failed network requests (URL, status).
- A1 to A5 pass/fail; A8 for externals; whether Start and Restart controls were found (selector or "not found").
- For externals: whether the iframe is present and its source URL.
- Whether `build:<id>` exists in `ts/package.json` and whether a file under `ts/tests` mentions the id (existence only; it does not run them).
- Blurb word count and whether the manifest has a screenshot.
It fills one scorecard row per demo (gaps, proposed effort) and returns the table. Claude (Sonnet) assigns tier targets by the rule in section 2 and spot-checks two rows against the live site.

## 6. Open questions for Robert
1. Which 1 to 3 demos are your showcase (Tier C) picks? Portfolio value is your call.
2. Which `external` embeds should be rewritten TS-native, and which stay honestly labelled embeds?
3. Is Tier A (including the phone-width check) a hard gate for the arcade's main section, or only for `beta`?
4. Are itch pages and devlogs (C4, C5) worth doing for every showcase demo, or only the best one?
