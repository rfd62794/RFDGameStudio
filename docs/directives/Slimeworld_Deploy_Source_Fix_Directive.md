# Fix: the slimeworld arcade page serves the SlimeGarden build

## Read first

`studio_mcp/tools.py` (function `studio_deploy_arcade`, about lines 721-870, and helpers
`_example_demos`, `_demo_static_names`, `_demo_source_path` at about lines 648-671),
`studio_mcp/demos/registry.py` (whole file, 80 lines),
`ts/src/games/slimeworld/config.ts`, `ts/src/engine/types.ts` lines 78-82 (type `DemoSource`),
`ts/tests/test_registry_export.ts` lines 1-30, `tests/test_demos_registry_parity.py`,
`tests/fixtures/demo_lists_snapshot.json`, `tests/test_studio_mcp.py` lines 250-300 (the existing
deploy test, your model for fakes), `docs/demos/slimeworld/SCOPE.md`,
`docs/gdd/SlimeWorld_PublishPush_Directive.md` lines 15-32. Everything you need is quoted below; do
not search for anything else.

## 1. Why this exists

On 2026-10-03 `https://games.rfditservices.com/arcade/slimeworld/` was checked with curl: it serves
`<title>SlimeGarden — Asteroid Breed & Assignment Lab` and the same JS asset
(`index-DOvLH266.js`) as `/arcade/slimegarden/`, although slimeworld is registered `status: 'stable'`.

Root cause, traced in `docs/demos/slimeworld/SCOPE.md` and re-verified when this directive was written:

1. `ts/src/games/slimeworld/config.ts` line 6 declares `source: { kind: 'example', slug: 'slimeworld' }`,
   which makes `studio_mcp/demos/registry.py` treat slimeworld as an example demo
   (`demo_entries` keeps any game whose `source.kind` is `example` or `sibling`).
2. In `studio_deploy_arcade` the TS-native standalone copy (`ts/dist-slimeworld` to
   `static/arcade/slimeworld`) runs first, then the example-demo loop runs and overwrites it.
3. `examples/slimeworld/dist` is an untracked, gitignored copy (`.gitignore` line 193 `examples/*`) of the
   SlimeGarden app built 2026-08-04. A fresh clone has no such dist, so a fresh deploy would fail with
   "does not exist. Build it first." instead.

Current code, quoted from `studio_mcp/tools.py` (the demo loop, after the standalone loop):

```python
        # Copy each example demo
        for demo_slug in demos:
            demo_dist = _demo_source_path(demo_slug, repo_root) / "dist"
            static_name = _demo_static_names()[demo_slug]
            demo_target = _SITE_REPO_PATH / "static" / "arcade" / static_name
            if demo_target.exists():
                shutil.rmtree(demo_target)
            shutil.copytree(demo_dist, demo_target)
```

and the precheck near the top of the function:

```python
    # Verify all example demo dists exist before copying anything
    demos = _example_demos()
    for demo_slug in demos:
        demo_dist = _demo_source_path(demo_slug, repo_root) / "dist"
        if not demo_dist.exists():
            return {
                "error": f"{_demo_source_path(demo_slug, repo_root)} / dist/ does not exist. Build it first.",
                "tool": "studio_deploy_arcade",
            }
```

followed by a staleness loop over `demos` that compares `examples/<slug>/dist` with `examples/<slug>/src`,
and the standalone discovery (`ts/dist-<gameId>/index.html` present means a standalone build, appended to
the list `standalone_builds: list[tuple[str, Path]]`, which is built AFTER the precheck).

Config type, `ts/src/engine/types.ts` lines 79-82:

```ts
/** Where a standalone demo's build comes from. Absent = a game built inside the studio app. */
export type DemoSource =
  | { kind: 'example'; slug: string }   // examples/<slug>/ (AI Studio exports)
  | { kind: 'sibling'; repo: string };  // a sibling repository, e.g. SlimeBreeder
```

`source` is optional. `ts/src/games/shoal/config.ts` is a TS-native game with a standalone build and has
NO `source` line; slimeworld (a TS-native game under `ts/src/games/slimeworld`, build script
`build:slimeworld` in `ts/package.json`, `ts/vite.slimeworld.config.ts` uses the
shared standalone factory with the id slimeworld) should look like shoal.

Not part of this directive: the live site, redeploying, and the stray `examples/slimeworld` folder in
Robert's live checkout.

## 2. Scope

In scope, exactly these files:

- `studio_mcp/tools.py` (the deploy function plus one small new helper)
- `docs/architecture/violations-baseline.txt`: append exactly one line `size: studio_mcp/tools.py`
  (tools.py is already over the 600-line architecture ratchet; this is pre-authorized for directive runs)
- `ts/src/games/slimeworld/config.ts` (remove the `source` line)
- `ts/tests/test_registry_export.ts` (drop the slimeworld entry from `SOURCES`, line 11)
- `tests/fixtures/demo_lists_snapshot.json` and `tests/test_demos_registry_parity.py` (keep the parity
  test true; see the work)
- `tests/test_deploy_arcade_copy_order.py` <!-- new: tests/test_deploy_arcade_copy_order.py -->

Out of scope: any other game config, `studio_mcp/demos/registry.py`, the site repo, any `dist` or
`dist-*` directory, `examples/`, `.gitignore`, `ts/package.json`, anything under `.worktrees`.

## 3. The work

1. `studio_mcp/tools.py`: add a small pure helper near `_is_dist_stale`, for example
   `_demos_needing_example_copy(demos, static_names, standalone_ids) -> list[str]`, returning the demo
   slugs whose static name (from `_demo_static_names()`) is NOT in the set of standalone game ids. In
   `studio_deploy_arcade`:
   - Move the standalone discovery loop (the `for dist_dir_candidate in sorted(ts_root.iterdir())` block
     and its `ts_root`/`standalone_builds` setup) ABOVE the "Verify all example demo dists exist" precheck,
     so the standalone game ids are known first. Keep the standalone staleness error unchanged.
   - Compute `demos = _demos_needing_example_copy(...)` once and use that list for the precheck, the
     staleness loop and the copy loop, so a demo whose standalone dist exists is skipped in all three.
   - Record the skipped slugs and include `"skipped_example_demos": [...]` in the successful result dict
     (read the end of the function first and add the key beside the existing ones; do not rename keys).
   - Fail loudly: a registered demo with no standalone dist AND no `examples/<slug>/dist` must return an
     error naming the slug, the checked standalone path (`ts/dist-<static_name>/index.html`) and the
     checked example path, for example `"demo 'X' has neither ts/dist-X/ nor <path>/dist/. Build it first."`
     Keep the key `"tool": "studio_deploy_arcade"`. Reuse the existing error shape.
2. `ts/src/games/slimeworld/config.ts`: delete the line `  source: { kind: 'example', slug: 'slimeworld' },`
   (line 6). Do not change anything else in the file. Rationale to cite in the report: `source` is
   optional in `DemoSource` usage (`ts/src/engine/types.ts` line 79 comment "Absent = a game built inside
   the studio app"), and `ts/src/games/shoal/config.ts` has no `source`.
3. Keep the other tests true:
   - `ts/tests/test_registry_export.ts`: remove the line `  slimeworld: { kind: 'example', slug: 'slimeworld' },`
     from `SOURCES`.
   - `tests/fixtures/demo_lists_snapshot.json`: remove `"slimeworld"` from the `example_demos` list and the
     `"examples/slimeworld"` entry from `game_paths.slimeworld` (the demo stops being an example). Leave
     `demo_static_name` as is (the parity test filters it by `example_demos`). If
     `tests/test_demos_registry_parity.py` still fails after that, add the smallest documented exception in
     that file next to `DROPPED`, with a one-line reason pointing at this directive.
4. New test `tests/test_deploy_arcade_copy_order.py` <!-- new: tests/test_deploy_arcade_copy_order.py -->
   under the repo's real layout (flat `tests/`, tests of `studio_mcp.tools` live in
   `tests/test_studio_mcp.py`). Model the fakes on `test_deploy_arcade_copies_files_when_dist_exists`
   (lines 252-300): build a fake repo in `tmp_path`, `monkeypatch.setattr(tools, "__file__", ...)`,
   `_SITE_REPO_PATH`, `_external_demo_paths` (lambda returning `{}`), `write_game_metadata`,
   `verify_arcade_deploy`, `_prepare_site_arcade`, and `patch("subprocess.run", ...)` as that test does.
   Also monkeypatch `tools._example_demos` and `tools._demo_static_names` so the test does not depend on the
   real registry or on Node. Cases:
   a. a demo named alpha with BOTH a standalone dist (the fake `dist-alpha` folder under the fake `ts`
      folder, index.html content STANDALONE) and an example dist (the fake `examples` folder, alpha, `dist`,
      index.html content EXAMPLE): after the deploy the copied site index.html for alpha reads STANDALONE,
      and `"alpha"` is in `result["skipped_example_demos"]`;
   b. a demo named beta with only an example dist: it is copied (the site index.html for beta reads the
      example content);
   c. a demo `gamma` with neither: result has an `"error"` mentioning `gamma` and `studio_deploy_arcade`;
   d. a direct unit test of `_demos_needing_example_copy`.
   Keep every file in the fake repo older/newer consistent so `_is_dist_stale` does not fire (create
   sources before dists, or have no source directory at all).

## 4. What NOT to do

- No deploy, no `studio_deploy_arcade` call against the real site repo, no touching the site repo.
- Do not rebuild, copy, delete or commit any `dist`, `dist-*` or `examples/` content anywhere.
- Do not change other games' configs, `registry.py`, `ts/package.json`, `.gitignore`, or the vite configs.
- Do not "fix" `npm run build:slimeworld` (the PublishPush directive's silent-failure note); out of scope.
- No new dependencies, no comment churn in code you do not change.

## 5. Verification

Run each as its own tool call, from the worktree root, and paste the real output tails in the report:

```
uv run python --version
uv run pytest -q tests/test_deploy_arcade_copy_order.py
uv run pytest -q tests/test_studio_mcp.py
uv run pytest -q tests/test_demos_registry.py tests/test_demos_registry_parity.py
cd ts && npx vitest run test_registry_export.ts
```

Reference, run when this directive was written on main (7bbae258): `uv run python --version` gave
`Python 3.12.12`; `uv run pytest -q tests/test_demos_registry.py` gave `4 passed in 0.12s`.
The `cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here; `ts/tests/...`
paths find none. Record any failure that also fails on a clean main as pre-existing, do not fix it.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry
  another way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&` or `|` chains and no redirects (the one allowed exception
  is the fixed `cd ts && npx vitest run test_registry_export.ts` line above). Do not use `ls`,
  `Get-ChildItem` or `cat`: use Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not use a search, memory or
  web tool beyond Read/Glob/Grep inside the worktree.
- Work only on branch `directive/rfdgamestudio-slimeworld-deploy-source-fix-directive`. Never commit to main,
  never push, never deploy.
- No scratch files; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with `<!-- new: path -->` in your report (and the test file header comment).
- Do not run `agentflow lint` or any other `agentflow` CLI.
- Never use `git -C`, `git -c`, `git --git-dir` or `git --work-tree`.
- Update this directive's Status row when you finish or stop partway.

## 7. Completion criteria

Done means all of: (a) `studio_deploy_arcade` never overwrites a standalone dist with an example dist and
errors clearly when a registered demo has neither; (b) `ts/src/games/slimeworld/config.ts` has no
`source`; (c) the new test file passes and the four verification commands show no new failures versus main;
(d) the work is committed on the directive branch and not pushed. Status row: `Review`, with one line giving
the pass counts. The run does not mark Done and does not merge; Robert reviews (this is a deploy path).

## 8. Report

Findings first: what changed, in which functions. Then evidence: the real output tails of the five commands
in section 5. Then one recommended action per open item. List every created file with
`<!-- new: path -->`. State that nothing was deployed and the site repo was not touched.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching the site repo; editing `.gitignore`,
  `examples/` or any `dist`/`dist-*` directory; touching protected repos; installing or fetching anything.

## Required from User

- Before the run: nothing.
- After Review and merge, Robert's separate step: rebuild `ts/dist-slimeworld` (`npm run build:slimeworld`,
  or the workaround in `docs/gdd/SlimeWorld_PublishPush_Directive.md`), run the deploy, then curl
  `https://games.rfditservices.com/arcade/slimeworld/` and confirm `<title>SlimeWorld`. Remove the stray
  untracked `examples/slimeworld` in the live checkout if wanted. Deploying is not part of this run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-03 · robert-claude-laptop · none → Queued — priority high: live /arcade/slimeworld/ serves the SlimeGarden build; deploy copy order + slimeworld config source fix; no deploy in this run
<!-- queue:end -->
