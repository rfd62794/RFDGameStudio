# SlimeBreeder absorption, step 1: what SlimeWorld still lacks

## 1. Why this exists

Robert, 2026-09-22: "SlimeBreeder got merged into SlimeWorld loosely, but this could be revisited,
to ensure it's absorbed fully into RFD Game Studio and retired." Today the Studio only carries an
origin-project card for it (`ts/src/games/slimebreeder/config.ts`, `supersededBy: 'slimeworld'`).
The standalone repo's tracked source has been copied into `archive/slimebreeder/` (48 files) so
nothing is lost when the repo is archived. Before porting anything, measure what SlimeWorld is
actually missing. This step writes the audit only; step 2 (the port) is written from it.

## 2. The work

Read, inside this worktree: `archive/slimebreeder/` (especially `src/components/`, `src/utils/`,
`src/store/`, `src/db/`, `docs/`), `ts/src/games/slimeworld/` (`App.tsx`, `gameLogic.ts`,
`types.ts`, `components/`), `docs/adr/ADR-023-legacy-origin-projects-type.md`, and the SlimeWorld
design doc `docs/gdd/SlimeWorld_Design_Rev3.md`.

Write `docs/analysis/slimebreeder-absorption.md` with:

1. **A feature table**, one row per SlimeBreeder mechanic or screen (breeding, incubation and
   hatching, mutation, market, discovery log, display rooms, facility expansion, tanks, inventory,
   stats, and anything else found): what it does (one line, citing the file), whether SlimeWorld
   has it (`yes` / `partial` / `no`, citing the SlimeWorld file), and a recommendation:
   `already absorbed`, `port`, `port as data only`, or `drop` with a one-line reason.
2. **Logic worth keeping** that is not a screen: formulas, rarity/genetics rules, balance tables,
   persistence shape - with file references.
3. **Tests**: which of `archive/slimebreeder/src/__tests__/` cover behaviour SlimeWorld lacks, so
   step 2 can port them with the code.
4. **A proposed step 2 scope**, ordered, each item small enough for one directive, and marking
   which items change what a player sees (those need a visual review before publishing).

## 3. What NOT to do

- No code changes in this step - the audit document only.
- Do not modify `archive/slimebreeder/` (it is the historical copy).
- Do not touch the live SlimeWorld game.

## 4. Completion criteria

- [ ] `docs/analysis/slimebreeder-absorption.md` exists with all four sections, every claim citing
      a file path.
- [ ] `cd ts && npx vitest run` shows no new failures against `main` (nothing should change).

## 5. Report

The feature table's counts (absorbed / port / data only / drop) and the proposed step 2 list.

## 6. Rules for this run

- This run is **NON-INTERACTIVE**. Any tool call that needs a confirmation is rejected outright and
  the run ends mid-task. Do not install, download or fetch anything. Do not read outside this
  working directory, and do not use a search, memory or web tool.
- Never use `git -C` or `git -c`; run git from the worktree.
- These are the only commands available to you: `npx vitest run`, `git status`, `git diff`,
  `git log`, `git show`, `git add`, `git commit`, `ls`, `cat`, `head`, `tail`, `wc`, `grep`, `mkdir`.
- Work only on your `directive/<slug>` branch. **Never commit to main, never push, never deploy.**
- Update this directive's Status row when you finish or stop partway.
- If a tool call is genuinely blocked, stop and write why in the Status row instead of trying
  another way around it.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-slimebreeder-absorption-audit-directive |
| Base branch | - |
| Base commit | ee207f4b18660742eddf67b1517184f29b56e488 |

**Status log**
- 2026-09-22 23:05 · robert-claude · none → Queued — Robert 2026-09-22: absorb SlimeBreeder fully into the Studio, then retire it. Step 1: audit.
- 2026-09-22 23:38 · robert-claude · Queued → Approved
- 2026-09-22 23:39 · dispatcher · Approved → In progress — dispatched devin in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slimebreeder-absorption-audit-directive; base origin/main (local main differs)
- 2026-09-22 23:56 · agentflow-tick · In progress → Blocked — a tool call was rejected: git clean -f nul; resume cap reached (2/2)
- 2026-09-23 00:11 · robert-claude · Blocked → Done
<!-- queue:end -->
