# examples/ vet of untracked folders (Phase 0, D0.1), 2026-10-04

Read-only scan of the LIVE checkout (`C:\Github\RFDGameStudio\examples`, main at `b5186eec`), run by the controller session because these folders are untracked and
therefore do not exist in any worktree (so no Devin directive could scan them). Nothing was added, moved or deleted. Method: `find` (node_modules and dist excluded)
for size, `grep -rIlE` for secret patterns, `find` for env/key files.

Patterns searched: `AIza[0-9A-Za-z_-]{20,}`, `sk-[A-Za-z0-9]{20,}`, `gh[pousr]_[A-Za-z0-9]{30,}`, `BEGIN [A-Z ]*PRIVATE KEY`, `xox[bp]-[0-9A-Za-z-]{10,}`;
files named `.env*`, `*.pem`, `*.key`, `serviceAccount*`.

| Folder | Files | Bytes (no deps) | Files over 5 MB | Secret-pattern hits | Env / key files |
|---|---|---|---|---|---|
| armory-storefront-spindle | 21 | 123,754 | 0 | 0 | `.env.example` |
| brewfield | 23 | 265,410 | 0 | 0 | `.env.example` |
| corpworld | 24 | 336,554 | 0 | 0 | `.env.example` |
| filipino-bpo-simulator | 43 | 419,482 | 0 | 0 | `.env.example` |
| mutant-battle-ball | 15 | 199,508 | 0 | 0 | `.env.example` |
| planetofgreed | 34 | 416,860 | 0 | 0 | `.env.example` |
| scrapcrawl | 28 | 268,559 | 0 | 0 | `.env.example` |
| slimeworld | 29 | 468,911 | 0 | 0 | `.env.example` |
| voidrift-redux-station-sim | 57 | 426,769 | 0 | 0 | `.env.example` |
| throwaway-test | 2 | 172 | 0 | 0 | none |

Findings:
1. 0 secret-pattern hits in all 10 folders; 0 files over 5 MB; the only env files are `.env.example`, and all 27 `.env.example` lines carry placeholder values only
   (`GEMINI_API_KEY="MY_GEMINI_API_KEY"`, `APP_URL="MY_APP_URL"`).
2. 9 folders are safe to track. `throwaway-test` holds a stray `package.json` (its content is a JSON string with escaped quotes, 172 bytes) and `src/App.tsx` (2 files): DROP it (delete the folder), do not track it.
3. The 186 MB on disk for brewfield and corpworld is `node_modules`, already ignored by `.gitignore` lines 14 and 66 (`node_modules/`) and `dist/` by lines 14, 73 and 228. Inverting `examples/*` does not expose them.
4. Correction (2026-10-04, found running D0.2): the 17 `assets/.aistudio/.gitignore` files (plus 9 more inside the nine untracked folders, 26 in all) each contain a single `*`, so they ignore themselves and stay ignored whatever the root rule. Inverting `examples/*` does NOT expose them; do not track them. Real count to track: 265 files in the nine folders (274 minus 9 self-ignored), giving 800 tracked under examples/ (535 + 265). The earlier "293 ignored files / 17 will show as new" finding was wrong.
5. `git ls-files examples` shows 535 tracked files in 20 top-level folders, but only 13 are named in the `.gitignore` exceptions: 7 folders (coin-pusher-arcade, horse-racing-&-breeding, kingmaker-squads, lua,
   slither-rogue_-evolution, voiddrift-redux-core-loop, voidrift-redux-particle-sandbox) were force-added. That is the trap D0.2 closes.

Recommended action: run D0.2 (`docs/playbooks/phase0-examples-track-all-runbook.md`). No folder is flagged for Robert.
