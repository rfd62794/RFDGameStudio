# Studio foundation, step 1: the glossary

## 1. Why this exists

Robert, 2026-09-22: build the Studio's foundation so every demo gets clear data, juice and a
vector/pixel style choice for free. Step 1 of 5 is the per-game YAML glossary that says what a
game's state means. Spec: `docs/superpowers/specs/2026-09-22-studio-foundation-design.md`.

## 2. The work

Follow `docs/superpowers/plans/2026-09-22-studio-foundation-step1-glossary.md` exactly, task by
task (Tasks 1-5). It contains every test and every line of code; do not redesign. Write each
test first, see it fail, implement, see it pass, commit - one commit per task, using the commit
messages in the plan.

Read first, inside this worktree: the plan, then the spec sections 3, 4 and 10,
`ts/src/components/GameShell.tsx`, `ts/src/ui/components/ErrorBox.tsx`,
`ts/src/games/dissonance/types.ts` (`RunState`).

## 3. What NOT to do

- No new dependencies. No changes to any game's logic, `data.yaml`, `ui.yaml` or `App.tsx`.
- Only Dissonance gets a `glossary.yaml`.
- Do not touch `ts/src/engine/loader.ts` or `ts/src/engine/ui_interpreter.tsx`.
- Do not skip, delete or weaken any existing test.

## 4. Completion criteria

- [ ] `cd ts && npx vitest run tests/test_foundation_glossary_validate.ts tests/test_foundation_glossary_bind.ts tests/test_foundation_glossary_load.ts tests/test_foundation_glossary_dissonance.ts tests/test_foundation_glossary_panel.tsx` all pass.
- [ ] `cd ts && npx vitest run` has no new failures against `main`. Baseline on `main`: 6 files fail
      with `Failed to resolve import "../src/games/game-metadata.json"` (a gitignored generated
      file) and one sports-sim test is flaky. Report the before/after counts.
- [ ] Five commits, one per plan task.

## 5. Report

Before/after vitest counts, the five commit hashes, and anything in the plan you had to change
(with why). If nothing needed changing, say so.

## 6. Rules for this run

- This run is **NON-INTERACTIVE**. Any tool call that needs a confirmation is rejected outright and
  the run ends mid-task. Do not install, download or fetch anything - the dependencies are already
  present in this worktree. Do not read outside this working directory, and do not use a search,
  memory or web tool.
- The test command for this repo is exactly `npx vitest run <file>` from the `ts` directory.
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
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-09-22 21:41 · robert-claude · none → Queued — Robert: go (Studio foundation step 1, plan c3c9baab)
<!-- queue:end -->
