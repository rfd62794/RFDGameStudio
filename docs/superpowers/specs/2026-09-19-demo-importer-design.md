# Demo Importer — Design

**Date:** 2026-09-19
**Status:** Approved design, awaiting spec review
**Repos:** RFDGameStudio (importer, registry) and RFD_IT_Services_Site (arcade staging)
**Related:** `docs/RFDGameStudio_DemoPortingRoadmap.md`; site spec `docs/superpowers/specs/2026-09-18-arcade-reorganization-design.md` (the arcade this feeds)

## Goal

One command takes an AI Studio zip to a verified local preview of the game on the site's arcade: versioned, built, registered, checked, staged. Re-imports of a game that has local edits keep those edits. The five hand-kept game lists are replaced by one source of truth in the registry. A status command shows where every demo stands.

## Decisions (owner, 2026-09-19)

| Topic | Decision |
|---|---|
| Where one run stops | **Local preview**: nothing merged into `main`, nothing pushed, nothing deployed |
| Re-imports with local edits | **Vendor branch + merge**: the new export lands on `ai-studio/<slug>`, is merged into an `import/<slug>-<version>` branch, and conflicts stop the run |
| Interface | **CLI + MCP tool** over one code path |
| Verification | **Deterministic checks only**; no AI verdict, no API calls |
| Single source of truth | **Approach A**: `GameConfig.source`; Python derives every list from a registry export |

## Problem (measured on the Systemic Extract port, 2026-09-18)

Porting one AI Studio export took about 15 manual steps. Five were edits to lists that must agree with each other:

| Hand-kept list | Location |
|---|---|
| `GAME_REGISTRY` entry + `config.ts` | `ts/src/games/` |
| `GAME_PATHS` | `studio_mcp/game_metadata.py` |
| `_EXAMPLE_DEMOS`, `_DEMO_STATIC_NAME`, `_DEMO_EXTERNAL_PATHS` | `studio_mcp/tools.py` |
| `!examples/<slug>/` | `.gitignore` |
| Pinned registry order and count | `ts/tests/test_arcade_registry_directive.ts` |

A re-export also overwrites local edits: `studio_promote_to_examples` extracts over `src/`, `package.json` and the README.

## 1. Interface

```
uv run python -m studio_mcp.demos import <zip> [--slug S] [--bump minor|patch|major] [--note TEXT] [--overwrite]
uv run python -m studio_mcp.demos adopt <slug> --baseline <commit>
uv run python -m studio_mcp.demos status
```

MCP tools `studio_import_demo(zip_path, slug=None, bump=None, note=None, overwrite=False)` and `studio_demos_status()` call the same functions and return the stage results and report path as a dict.

## 2. Stages

Each stage returns `{stage, ok, detail, next_step}`. A failure stops the run. The report is always written, including on failure. Re-running the same zip is safe: intake detects the duplicate and the run resumes from the build.

| # | Stage | Behavior |
|---|---|---|
| 1 | Identify | Slug from `--slug` or the zip name: strip a trailing ` (N)` and the extension, lowercase, spaces → `-` (`systemic-extract (12).zip` → `systemic-extract`). `gameId` = slug with `-` → `_`. **Re-import** when a registry game has `source.slug == slug`, otherwise **new**. |
| 2 | Intake | **Copy** (never move) the zip into `intake/<slug>/` and run `process_intake` (versioning, duplicate detection, `MANIFEST.md`). |
| 3 | Branch | §3. |
| 4 | Build | Normalize the base path to `/arcade/<gameId>/`. Install the demo's **own** dependencies (`npm install` in `examples/<slug>/`; no sibling `node_modules` junctions). `vite build`. |
| 5 | Register (new games only) | §4. |
| 6 | Verify | `tsc --noEmit` when a `tsconfig.json` exists; build succeeded; headless smoke run (the built `dist/` served under its base path loads, renders a canvas or non-empty `#root`/`#app`, and has no page errors within the settle period); the four non-AI `zip_verify` checks via `ZipVerifier(...).analyze()` only (concept grep, revision diff against the previous export, caller check, narrative artifact) — never `verify()` or `write_report()`, which call the OpenRouter model; dependency usage scan (declared dependencies never imported by `src/`, informational). Smoke failure stops the run; `zip_verify` findings and unused dependencies are reported, not blocking. |
| 7 | Stage on site | Registry export and manifest export; copy `dist/` to the site's `static/arcade/<gameId>/`; `inject_return.py`; `check_arcade.py --only <gameId>` (contract + cover; `--only` is a new option that checks one build and updates only its entry in `arcade_health.json`); `sync_arcade.py`; `build_all.py`. Site changes stay uncommitted on site branch `import/<slug>-<version>`. |
| 8 | Report + preview | Write `intake/<slug>/reports/<version>.md` (committed on the import branch): every stage result, warnings, the merge/diff summary and every command run. Print the preview command (`scripts/site/preview.py`) and `http://localhost:8081/games/<slug>/`. |

The run never merges into `main`, pushes or deploys. After review, the owner merges, and deploys with the existing tools.

## 3. Re-imports: vendor branch

- **`ai-studio/<slug>`** holds only untouched exports: each import replaces `examples/<slug>/` wholesale with the zip's contents (excluding `node_modules`), plus the base-path normalization. One commit per version: `ai-studio: <slug> v<version> (sha256 <hash>)`.
- **`import/<slug>-<version>`** is cut from `main`; the run merges `ai-studio/<slug>` into it. The previous export is the merge base, so local edits are kept and only lines changed on both sides conflict.
- **Clean merge:** continue with stage 4 on the merged tree.
- **Conflicts:** stop, leave the branch mid-merge with the conflicted files, and list them in the report. After resolving and committing, re-running the same command resumes.
- **Lock file:** if `package-lock.json` is the only conflicted file, keep the merged `package.json` and regenerate the lock with `npm install`, then continue.
- **New game:** create `ai-studio/<slug>` from `main`; the first export is its first commit.
- **Existing games without a vendor branch:** the importer refuses. Guessing a baseline could equal the current tree, in which case the merge silently overwrites local edits. `demos adopt <slug> --baseline <commit>` creates the vendor branch at a pristine commit (Systemic Extract: `75277c70`). Without a known baseline, `adopt` lists the commits that touched `examples/<slug>/` so the owner can pick one. `--overwrite` lets the new export replace the folder deliberately; the old tree stays in git history.

## 4. Single source of truth

`GameConfig` gains:

```ts
source?: { kind: 'example'; slug: string }   // built from examples/<slug>/
       | { kind: 'sibling'; repo: string }   // built in a sibling repo (e.g. SlimeBreeder)
// absent: a game built inside the studio app (ts/src/games/<id>)
```

A configs-only **registry export** (`ts/tools/export-registry.ts` → `ts/src/games/registry-export.json`, gitignored) is written before the metadata step. Python derives:

| Replaced | Derived as |
|---|---|
| `_EXAMPLE_DEMOS` | games with `source.kind` `example` or `sibling`, in registry order |
| `_DEMO_STATIC_NAME` | `gameId` |
| `_DEMO_EXTERNAL_PATHS` | `sibling` → `sibling_repo(repo)` |
| `GAME_PATHS` | `ts/src/games/<id>`, plus `games/<id>` if it exists, plus `examples/<slug>` or the sibling repo |

The manifest export (`export-arcade-manifest.ts`) no longer requires `game-metadata.json`; missing metadata yields null version/date, as `buildArcadeManifest` already allows.

**Migration without behavior change:** snapshot today's four Python lists into a test fixture; add `source` to the current example/sibling games; a parity test asserts the derived lists equal the snapshot entry for entry; only then delete the hand-kept lists. The migration keeps one existing quirk and records it for the owner: SlimeWorld is deployed from both `ts/dist-slimeworld` and `examples/slimeworld`, and the example copy wins because it is copied second.

**The importer writes, for a new game only:** `ts/src/games/<gameId>/config.ts` (label and description from the zip's `metadata.json`; `status: 'external'`; a color derived deterministically from the slug; `source: { kind: 'example', slug }`); the import and registry entry between `// demos:begin` and `// demos:end` markers in `registry.ts`; one `!examples/<slug>/` line in `.gitignore`.

**Registry test:** the pinned order and count in `test_arcade_registry_directive.ts` are replaced with invariants: unique ids, every `ts/src/games/*/config.ts` registered, every `source` path exists, and the existing Origin/legacy rules. The import diff is the reviewable decision.

## 5. Status report

`demos status` prints one row per example/sibling game:

| Column | Source |
|---|---|
| Game, version | registry; intake `MANIFEST.md` |
| Local edits since last export | `git diff --stat ai-studio/<slug> main -- examples/<slug>`; "no vendor branch (run `demos adopt`)" when missing |
| Build | `dist/` newer than `src/` → fresh, otherwise stale |
| Site check | the site's `data/arcade_health.json` |
| Live | MD5 of the site's `static/arcade/<gameId>/index.html` against its committed `.deploy_manifest.json`: current / stale / not deployed |

It also lists orphan site builds (folders with no registry game, e.g. Brewfield) and registry games with no site build.

## 6. Safety

- The importer writes only under `examples/<slug>/`, `intake/<slug>/`, `ts/src/games/<gameId>/`, between the registry markers, the `.gitignore` line, and the site's `static/arcade/<gameId>/` plus generated site data. It deletes nothing elsewhere.
- It never commits to `main`, pushes, or deploys. `deploy_config*.json` is never read beyond what existing site scripts do, and never printed.
- A blocked tool call stops the run with the message; it is never retried another way.
- `node_modules` is never copied or committed.

## 7. Testing

- **Unit (pytest):** slug and id parsing; `config.ts` generation from `metadata.json`; registry marker edit (idempotent, order kept); `.gitignore` insertion; lock-file-only conflict detection; status row computation; derived lists; the parity test.
- **Integration (pytest, throwaway git repos in a temp dir, never the real repos):** first import creates the vendor branch; local edit plus a second export touching another file → clean merge keeps the edit; the same line changed on both sides → stops with the file listed; lock-file-only conflict → regenerated and continues; re-run after resolving → resumes; missing vendor branch → refuses with the `adopt` hint.
- **TS (vitest):** registry invariants; the registry export includes `source`.
- **End-to-end dry run (real repos, then discarded):** adopt Systemic Extract at `75277c70`, build a second export from the current zip with one visible change, import it, show the owner the report and preview, then delete the branches.

## Out of scope

- Deploying, pushing, merging to `main`.
- AI verdicts (`zip_verify`'s OpenRouter step).
- The games subdomain switch.
- Changing SlimeWorld's double source (recorded only).
- Watching folders or running in the background.
