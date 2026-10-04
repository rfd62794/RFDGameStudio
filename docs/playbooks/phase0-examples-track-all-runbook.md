# Phase 0 / D0.2 runbook: track everything under examples/ (controller-run)

Not a Devin directive on purpose. The 9 folders to add exist only in the live checkout (`C:\Github\RFDGameStudio\examples`): they are untracked and gitignored, so a dispatch
worktree (tracked files only) does not contain them and an agent could neither `git add` them nor verify them. A Devin run would die hunting for them. The controller (or Robert)
does this by hand, on a branch, in the live checkout. Spec: `docs/superpowers/specs/2026-10-04-studio-redesign.md`, Phase 0, D0.2. D0.1 (the vet) is done:
`docs/state/examples-vet-2026-10-04.md` (0 secret hits, 0 files over 5 MB, only `.env.example`, no folder flagged).

Preconditions: the live checkout is on main and clean (`git status --short` empty apart from the untracked examples folders); a fresh `git fetch origin`; this runbook's PR is merged or the file is readable on the branch.
Never commit to main: work on branch `chore/examples-track-all`. Merging is the merge queue's or Robert's.

## Steps (one command per call)

1. `git fetch origin`, then `git switch -c chore/examples-track-all origin/main`. If the live checkout has local-only commits on main, STOP and report; do not rebase them away.
2. Drop the scratch folder: `Remove-Item -Recurse -Force examples/throwaway-test` (PowerShell, from the repo root). It is untracked, so this loses nothing in git; it contains only a 172-byte `package.json` and `src/App.tsx` (see the vet file).
3. Back up first (cheap): `Copy-Item .gitignore ..\RFDGameStudio.gitignore.bak-2026-10-04` and say where it went.
4. Edit `.gitignore` (CRLF file; use the Edit tool, which preserves line endings). Delete lines 191-206 exactly: the two comment lines
   (`# Examples — pre-port originals and scratch work stay untracked;` and `# active standalone demos (embedUrl tier) need real version control.`), `examples/*`, and the 13 `!examples/<name>/` exceptions
   (`ledger, shoal, trinity-siege, planetforge, 7-days-to-fry, antsim-redux, dissonance-prototype, facility-escape, factory-idle-precision-armory-phase1, factory-idle-precision-armory-phase2, SlimeBreeder, slimegarden, systemic-extract`).
   Replace them with one comment line: `# Examples: everything under examples/ is tracked; dependencies and build output are ignored by the node_modules/ and dist/ rules above.`
   Nothing else is needed: `node_modules/` (lines 14, 66) and `dist/` (lines 14, 73, 228) already ignore dependencies everywhere.
5. Verify the inversion, one command per call (these were dry-run in a scratch worktree on 2026-10-04 and gave the results shown):
   - `git check-ignore -v examples/scrapcrawl/x` prints nothing, exit 1 (not ignored).
   - `git check-ignore -v examples/brewfield/node_modules/x` prints `.gitignore:66:node_modules/	examples/brewfield/node_modules/x`.
   - `git check-ignore -v examples/brewfield/dist/x` prints a `dist` rule (was `.gitignore:212:dist*/` in the dry run; the line number moves after the edit, the rule is what matters).
6. Add the nine vetted folders explicitly, one `git add` per call, never `git add -A` or `git add examples`:
   `armory-storefront-spindle`, `brewfield`, `corpworld`, `filipino-bpo-simulator`, `mutant-battle-ball`, `planetofgreed`, `scrapcrawl`, `slimeworld`, `voidrift-redux-station-sim`
   (`git add examples/<name>`). Then add the 17 newly visible `assets/.aistudio/.gitignore` files with `git add examples` ONLY IF step 7 shows nothing but those 17 plus the nine folders; otherwise stop and report.
7. Check what is staged and what remains: `git status --short examples`. Expected: the nine folders' files (274 files, matching the vet table: 21+23+24+43+15+34+28+29+57), and 17 `.aistudio/.gitignore` files; nothing under `node_modules/` or `dist/`.
   `git ls-files --others --exclude-standard examples` must be empty after staging.
   Secret recheck on the STAGED set: `git diff --cached --name-only` then grep the vet patterns (`AIza`, `sk-`, `gh[pousr]_`, `PRIVATE KEY`, `xox[bp]-`) over those paths; expect 0 hits.
8. Run `cd ts && npx vitest run test_registry_export.ts test_arcade_manifest.ts` (baseline 2 files, 7 tests passed on origin/main `f915dbca`); the change touches no code, so expect the same. Sandbox note: this is a Python/TS repo; use `uv run` for any Python (`Python 3.12.12`).
9. Commit (message ends with the attribution lines the session reminder gives), push with an explicit refspec (`git push origin chore/examples-track-all:chore/examples-track-all`, no force), open a PR. Body: link `docs/state/examples-vet-2026-10-04.md`, list the nine folders and the dropped `throwaway-test`, and state "merge is not deploy".
10. Do not merge from this runbook. After the PR merges, tick the Phase 0 item in the plan/roadmap and re-run `git ls-files examples | wc -l` (535 tracked before; expect 535 + 274 + 17 = 826).

## Stop conditions

- Any secret-pattern hit on the staged set: unstage that folder, report, do not push.
- Any single staged file over 5 MB, or anything under a `node_modules/` or `dist/` path staged: stop and report.
- The live checkout is not on main, is dirty beyond the untracked examples folders, or has local-only commits: stop and report.

## Out of scope

Protected repos; a Devin dispatch; deleting any tracked file; changing the 20 already-tracked folders' contents; the arcade registry, deploys or the site repo.
