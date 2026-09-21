# Demo importer, Task 7: build and deterministic verify

## 1. Why this exists

The demo importer plan was written on 2026-09-19 and is being executed task by task. Tasks
1, 2 and 3 are done and committed on `feature/demo-importer`; this directive is Task 7.

Create `studio_mcp/demos/build.py` (base normalization shared with promote, install,
`vite build`, typecheck) and `studio_mcp/demos/verify.py` (headless smoke, `zip_verify`
analyze, unused-dependency scan). Point `studio_promote_to_examples` at the shared
`normalize_vite_base`.

The plan is unusually complete: exact code per step, TDD ordering, and every assumption
about the repo verified before work began. It is the specification. This directive is the
wrapper that says which part is yours and what must not move.

## 2. Scope

Create `studio_mcp/demos/build.py`, `studio_mcp/demos/verify.py`, `tests/test_demos_build_verify.py`; modify `studio_mcp/tools.py`.

**Read first:** `docs/superpowers/plans/2026-09-19-demo-importer.md`, **Task 7**. Follow its steps exactly and
in order - it carries the exact code, the TDD ordering (write the failing test, confirm the
failure, then implement), and the Global Constraints at the top of the file. This directive
does not restate them; where the two differ, the plan wins.

**Verification must stay deterministic and free.** Use `ZipVerifier(...).analyze()`
only. `verify()` and `write_report()` call OpenRouter, which costs real money against
a balance that has been exhausted before.

The build step runs inside the demo's own directory with its own dependencies. It is
the one place an install is expected, and it must be driven by the module under test
rather than by you running a package manager yourself.

## 3. The work

Work through the plan's Task 7 steps in order, top to bottom. Each step states what to
write and what to run. Do not reorder them, and do not skip the "run and confirm failure"
steps - a test that was never seen to fail has not been shown to test anything.

## 4. What NOT to do

- **Never call `ZipVerifier.verify()` or `write_report()`** - they hit OpenRouter.
- **Do not add any paid model or API call** to this or any other path.
- **Do not change what `studio_promote_to_examples` does** beyond routing it through
  the shared `normalize_vite_base`.
- **Do not start another task** in the plan, even if it looks small.
- **Do not edit the plan file itself.**

## 5. Verification

```bash
uv run pytest -q -p pytest_rerunfailures tests/test_demos_build_verify.py tests/test_studio_mcp.py
```

Expected: PASS, with no network call to OpenRouter anywhere in the run.

## 6. Rules for this run

- This run is **NON-INTERACTIVE**. Any tool call that needs a confirmation is rejected
  outright and the run ends mid-task. Do not install, download or fetch anything - the
  dependencies are already present in this worktree. Do not read outside this working
  directory, and do not use a memory or search tool to look something up; if you find
  yourself needing a fact that is not here or in the repo, stop and say so in the Status row.
- Test commands for this repo, exactly: `uv run pytest -q -p pytest_rerunfailures <file>`
  for Python, `cd ts && npx vitest run <file>` for TypeScript. Do not guess another runner.
- Follow the plan's Global Constraints section as written. In particular, verification is
  deterministic only: `zip_verify` via `ZipVerifier(...).analyze()`, never `verify()` or
  `write_report()`, which call OpenRouter and cost real money.
- Work only on your `directive/<slug>` branch. **Never commit to main, never push, never
  deploy.** Only Robert merges.
- Update this directive's Status row when you finish or stop partway - DirectiveQueueMCP
  reads it across every repo.
- If a tool call is genuinely blocked, stop and write why in the Status row instead of
  trying another way around it.

## 7. Completion criteria

- [ ] Every step of the plan's Task 7 is done, in order.
- [ ] Each new test was seen to fail before its implementation existed.
- [ ] The verification commands above pass.
- [ ] Nothing outside this task's stated files changed.
- [ ] The Status row is updated.

## 8. Report

State which steps you completed, the verification output, and anything the plan assumed
that turned out not to be true in the repo. If you had to deviate, say where and why - a
silent deviation is worse than a reported one.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-09-20 21:23 · robert-claude · none → Queued — Task 7 of 8; approve with base_branch set to Task 6's directive branch once Task 6 reaches Review
<!-- queue:end -->
