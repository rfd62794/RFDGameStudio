# rpgCore Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the retired rpgCore repo into RFDGameStudio as an isolated, read-only archive that can be studied, refactored or recovered from later, then retire the rpgCore repo.

**Architecture:** rpgCore lands under `archive/rpgCore/` in one import commit, followed by a cleanup commit that drops runtime junk. The archive is never imported by studio code, never collected by the studio's pytest/vitest runs, and never part of the uv workspace — a test enforces that. `archive/rpgCore/ARCHIVE.md` records provenance and a recovery index. The rpgCore GitHub repo gets a retirement README and is archived.

**Tech Stack:** git (subtree), uv/pytest (isolation test), gh CLI (archive repo).

**Source of decisions:** owner, 2026-09-13 — "RPG core is retired and a precursor to the RFD game studio, so it should be rolled into it in an archive fashion for refactor and recovery if possible." Follows the same pattern as the itch publisher merge (packages/itch_publisher), but as an archive rather than a live package.

## Facts this plan relies on (checked 2026-09-13)

- `C:\GitHub\rpgCore`: branch `main` = `origin/main`, 3,626 commits (2026-02-05 → 2026-07-02), **pack size 149.65 MiB**, 1,858 tracked files (src 702, archive 482, docs 397, tests 129, saves 36, data 21, assets 19, logs 14, demos 7, .github 3).
- Uncommitted owner files: `saves/player.json`, `saves/player.backup.json` (modified), `PHASE_0_REPO_ANALYSIS_2026-06-18.md` (untracked).
- Tests today: 1,003 passed, 65 failed, 54 errors — stale tests against changed UI/scene APIs. The archive is not expected to pass.
- Python `>=3.12,<3.13`; deps include pydantic, pydantic-ai, pygame-ce, numpy, loguru, rich.
- rpgCore's GitHub Actions (3 workflows) always failed; Actions are disabled as part of the local-CI work.
- RFDGameStudio has no existing references to rpgCore.

## Global Constraints

- Studio code must never import from `archive/` (no `dgt_engine`, `game_engine`, `foundation`, `shared`, `apps` imports from rpgCore).
- `archive/rpgCore` must not be added to `[tool.pytest.ini_options].testpaths`, `[tool.uv.workspace]`, `tsconfig.json` `include`, or vitest `include`.
- `scripts/check.ps1` (the local CI) must stay green after every task.
- Owner work in progress in rpgCore is committed or explicitly discarded by the owner — never silently dropped.
- Anything that pushes or changes GitHub settings waits for the owner's go-ahead at that step.

## Decisions needed before starting

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | How much git history to bring in | **(a)** squashed subtree — one commit, full history stays in the archived rpgCore GitHub repo; **(b)** full history — every one of the 3,626 commits, adds ~150 MiB to every studio clone; **(c)** plain file snapshot, no git link | **(a)** squashed. The history remains one click away on GitHub; the studio repo stays light. |
| D2 | What to leave out of the archive | runtime/generated files: `logs/`, `saves/`, `traceback.txt`, `validation_output.log`, `session_start_test.txt`, `src_file_list.txt`, `docs/agents/inventory/symbol_map_cache.json` (1.5 MB cache), `data/*.sqlite` | Drop all of them (Task 3). They stay in rpgCore's history. |
| D3 | The 3 uncommitted rpgCore files | commit to rpgCore first, or discard | Commit them (Task 1) so the archive and history are complete. |

**Resolved by the owner (2026-09-13):** all recommendations — D1 squashed import, D2 drop the listed runtime/generated files, D3 commit the 3 uncommitted files first.

---

### Task 1: Freeze rpgCore

**Files:** none in the studio.

- [ ] **Step 1: Commit the owner's in-progress files in rpgCore** (after D3)

```bash
cd /c/GitHub/rpgCore
git add saves/player.json saves/player.backup.json PHASE_0_REPO_ANALYSIS_2026-06-18.md
git commit -m "Final pre-archive snapshot of local work"
git status --short   # expected: empty
```

- [ ] **Step 2: Scan tracked files for secrets before copying them anywhere**

```bash
cd /c/GitHub/rpgCore
git grep -nIE "(sk-[A-Za-z0-9_-]{20,}|sk-or-[A-Za-z0-9-]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][A-Za-z0-9_/+-]{12,})" -- . ':!uv.lock' | cut -c1-120
```

Expected: no output. If anything matches, stop and report file names to the owner (never paste values); rotating or scrubbing comes before the import.

- [ ] **Step 3: Record the source commit for provenance**

```bash
git -C /c/GitHub/rpgCore rev-parse HEAD   # note this hash for ARCHIVE.md (Task 5)
```

### Task 2: Import into the studio

**Files:** Create `archive/rpgCore/**` (via subtree).

- [ ] **Step 1: Branch from a clean studio `main`**

```bash
cd /c/GitHub/RFDGameStudio
git status --short          # must be empty: `git subtree add` refuses a dirty tree
git switch -c archive-rpgcore
```

- [ ] **Step 2: Import (D1 = squashed)**

```bash
git subtree add --squash --prefix=archive/rpgCore /c/GitHub/rpgCore main
git log --oneline -2        # expected: a squash commit + "Merge commit ... as 'archive/rpgCore'"
git ls-files archive/rpgCore | wc -l   # expected: 1,858 plus the Task 1 files
```

If D1 = full history, instead use the manual subtree merge used for the itch publisher (works with a dirty tree):
`git fetch /c/GitHub/rpgCore main && git merge -s ours --no-commit --allow-unrelated-histories FETCH_HEAD && git read-tree --prefix=archive/rpgCore/ -u FETCH_HEAD && git commit -m "Archive rpgCore with full history"`.

### Task 3: Drop runtime and generated files from the archive

**Files:** Delete (from the archive only) the D2 list; Modify `.gitignore`.

- [ ] **Step 1: Remove them**

```bash
cd /c/GitHub/RFDGameStudio/archive/rpgCore
git rm -rq logs saves traceback.txt validation_output.log session_start_test.txt src_file_list.txt docs/agents/inventory/symbol_map_cache.json
git rm -q data/*.sqlite
```

- [ ] **Step 2: Keep them out if the archive is ever run locally** — append to the studio `.gitignore`:

```gitignore

# rpgCore archive: runtime output if the archived code is run locally
archive/rpgCore/logs/
archive/rpgCore/saves/
archive/rpgCore/data/*.sqlite
archive/rpgCore/**/*.log
```

- [ ] **Step 3: Commit**

```bash
cd /c/GitHub/RFDGameStudio
git add .gitignore
git commit -m "Drop runtime and generated files from the rpgCore archive"
```

### Task 4: Enforce isolation with a test

**Files:** Create `tests/test_archive_isolation.py`.

- [ ] **Step 1: Write the test**

```python
"""archive/ holds retired projects for reference and recovery. Studio code must
never import from it, and the studio's test/build configuration must never
pick it up."""

import ast
import json
import tomllib
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = REPO_ROOT / "archive"
# Top-level package names that exist only inside archive/rpgCore/src.
ARCHIVED_PACKAGES = {"dgt_engine", "game_engine", "foundation", "apps", "launcher"}
STUDIO_CODE_DIRS = ["studio", "studio_mcp", "engine", "renderers", "scripts", "tests", "packages"]


def test_archive_exists():
    assert (ARCHIVE / "rpgCore" / "ARCHIVE.md").is_file()


def test_pytest_and_workspace_config_exclude_archive():
    pyproject = tomllib.loads((REPO_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    testpaths = pyproject["tool"]["pytest"]["ini_options"]["testpaths"]
    members = pyproject.get("tool", {}).get("uv", {}).get("workspace", {}).get("members", [])
    assert not any(p.startswith("archive") for p in testpaths)
    assert not any(m.startswith("archive") for m in members)


def test_typescript_config_excludes_archive():
    tsconfig = json.loads((REPO_ROOT / "ts" / "tsconfig.json").read_text(encoding="utf-8"))
    assert not any("archive" in entry for entry in tsconfig.get("include", []))


def test_studio_code_never_imports_archived_packages():
    offenders = []
    for folder in STUDIO_CODE_DIRS:
        for path in (REPO_ROOT / folder).rglob("*.py"):
            if "archive" in path.parts or "__pycache__" in path.parts:
                continue
            try:
                tree = ast.parse(path.read_text(encoding="utf-8"))
            except (SyntaxError, UnicodeDecodeError):
                continue
            for node in ast.walk(tree):
                names = []
                if isinstance(node, ast.Import):
                    names = [a.name for a in node.names]
                elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
                    names = [node.module]
                offenders += [f"{path.relative_to(REPO_ROOT)}: {n}" for n in names
                              if n.split(".")[0] in ARCHIVED_PACKAGES or n.startswith("archive")]
    assert not offenders, offenders
```

Note: before relying on `ARCHIVED_PACKAGES`, confirm none of those names are real studio packages (`ls studio engine renderers`); remove any clash from the set.

- [ ] **Step 2: Run it — `test_archive_exists` fails until Task 5**

```bash
uv run python -m pytest tests/test_archive_isolation.py -q -p no:cacheprovider
```

Expected: 1 failed (`ARCHIVE.md` missing), 3 passed.

### Task 5: Provenance and recovery index

**Files:** Create `archive/rpgCore/ARCHIVE.md`; Modify `docs/state/current.md` (one line).

- [ ] **Step 1: Build the app → studio mapping from evidence** (don't guess)

```bash
cd /c/GitHub/RFDGameStudio
ls archive/rpgCore/src/apps
# For each app, look for the same game/concept in the studio:
for app in asteroids dungeon_crawler last_appointment slime_breeder slime_clan space space_trader tycoon; do
  echo "== $app"; git grep -il "${app//_/.?}" -- games ts/src/games docs | head -5
done
```

- [ ] **Step 2: Write `archive/rpgCore/ARCHIVE.md`** with: what rpgCore was (from its README), the source repo URL and the Task 1 commit hash, archive date, "not maintained / tests not expected to pass (1,003 passed, 65 failed, 54 errors at archive time — stale against its own refactor)", what was dropped (D2) and where it still lives (rpgCore history on GitHub), how to run it in isolation (`cd archive/rpgCore && uv sync && uv run python game.py` — Python 3.12), and the app → studio mapping table from Step 1 with a "recovery candidates" column.

- [ ] **Step 3: Pass the isolation tests and the full local CI**

```bash
uv run python -m pytest tests/test_archive_isolation.py -q -p no:cacheprovider   # expected: 4 passed
powershell -File scripts/check.ps1                                                 # expected: All checks passed
```

- [ ] **Step 4: Commit**

```bash
git add archive/rpgCore/ARCHIVE.md tests/test_archive_isolation.py docs/state/current.md
git commit -m "Add rpgCore archive index and isolation test"
```

### Task 6: Merge and push the studio

- [ ] **Step 1:** `git switch main && git merge --no-ff archive-rpgcore -m "Merge branch 'archive-rpgcore': archive rpgCore for reference and recovery"`
- [ ] **Step 2:** `powershell -File scripts/check.ps1` — expected green.
- [ ] **Step 3 (owner go-ahead):** `git push origin main` (the pre-push hook re-runs the checks). Delete the branch: `git branch -d archive-rpgcore`.

### Task 7: Retire the rpgCore repo

**Files (in rpgCore):** Modify `README.md`; Delete `.github/workflows/*`.

- [ ] **Step 1:** Replace the top of `README.md` with a retirement notice: retired 2026-09-13, archived at `RFDGameStudio/archive/rpgCore/` (link), successor is RFDGameStudio, full history remains here.
- [ ] **Step 2:** `git rm -r .github/workflows && git add README.md && git commit -m "Retire repo: archived into RFDGameStudio/archive/rpgCore"`
- [ ] **Step 3 (owner go-ahead):** `git push origin main`, then `gh repo archive rfd62794/rpgCore --yes`; confirm with `gh repo view rfd62794/rpgCore --json isArchived`.
- [ ] **Step 4:** Search for stale references and report them (don't auto-edit other repos):

```bash
cd /c/GitHub && git grep -il "rpgCore" $(ls -d */) 2>/dev/null | grep -v "^RFDGameStudio/archive/"
```

- [ ] **Step 5:** Leave the local `C:\GitHub\rpgCore` folder in place until the owner says to delete it.
