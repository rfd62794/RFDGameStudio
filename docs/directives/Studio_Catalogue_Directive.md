# Studio catalogue — make the work addressable

## 1. Why this exists

Robert's goal is a studio where he plans loosely and agents execute directives that cut across many
games at once. That is blocked by one thing: **the work is not addressable.** A cross-cutting
directive has to say "for every game where X, do Y", and nothing can currently enumerate X.

What that cost, all found by hand on 2026-09-19 and all derivable from files already on disk:

- Brewfield was retired in `docs/state/StatusBoard.md` on Aug 15, listed STABLE in
  `GENRE_TRACKER.md` on Aug 16, and still said `status: 'stable'` in its config a month later.
- Brewfield is **not imported in `ts/src/games/registry.ts`** — a complete game with a working
  `App.tsx` and its own build script, invisible to every downstream consumer.
- Three catalogues disagree: 27 games on the site, 23 in `GENRE_TRACKER.md`, 36 directories in
  `ts/src/games/`.
- The `stack` field is in the arcade schema, rendered by the site template, and populated for zero
  of 27 games.

Build the thing that would have surfaced all of it.

**The model to follow is `C:\GitHub\RFD_IT_Services_Site\scripts\site\game_board.py`.** Read it
first. Its principle is the whole design: derive everything derivable so it can never go stale, and
let a human hand-maintain only judgement. Copy that shape.

## 2. Scope — create two files

```
scripts/studio_catalogue.py     the catalogue, described below
tests/test_studio_catalogue.py  tests, described in §5
```

Do not modify `registry.ts`, any game config, `GENRE_TRACKER.md`, or anything under `ts/src/games/`.
This directive builds a reader, not a fixer. What it finds is reported, never corrected.

## 3. What it must derive

For every directory under `ts/src/games/` that contains a `config.ts`:

| Field | Derived from |
|---|---|
| `slug` | the directory name |
| `gameId`, `label`, `status`, `section` | string literals in that `config.ts` |
| `in_registry` | whether `ts/src/games/registry.ts` imports that game's config |
| `in_manifest` | whether the slug appears in `ts/src/games/arcade-manifest.json` |
| `published` | whether the slug appears in `C:\GitHub\RFD_IT_Services_Site\data\arcade.json` |
| `shared_modules` | which `engine/shared/*` modules the game's files import |
| `renderer` | inferred from the imports it uses — say `unknown` when it cannot be determined |
| `lines` | total lines of `.ts`/`.tsx` in the directory |

**Parsing approach:** regex the simple string literals out of `config.ts` (`gameId:`, `label:`,
`status:`, `section:`). Do not try to execute TypeScript from Python and do not add a Node
dependency. Where a field cannot be parsed, record `null` and count it as a gap — a named gap is
useful, a guess is not.

## 4. Findings it must report

Each with a priority, worst first:

- **P1 `orphan`** — a game directory with a `config.ts` that `registry.ts` does not import. This is
  the check that matters most: it is how a finished game stayed invisible for a month.
- **P1 `retired-but-listed`** — `status: 'retired'` while still in the registry, the manifest, or
  the published site.
- **P2 `unregistered-but-published`** — appears on the site but not in the registry. Means the site
  is serving something the studio no longer tracks.
- **P2 `built-not-published`** — in the registry with a non-dev status, absent from the site.
- **P3 `no-stack`** — `stack` absent, so the site's "Built with" row renders empty.
- **P3 `status-conflict`** — the config's status disagrees with `GENRE_TRACKER.md`'s row for the
  same game.
- **P4 `sole-consumer`** — a module under `engine/shared/` that exactly one game imports. By the
  studio's "extract on the second consumer" rule these are the extractions that have not earned
  themselves yet, and the ones at risk of orphaning when their single consumer is retired.

## 5. Interface and tests

```
python scripts/studio_catalogue.py                 # the board, worst finding first
python scripts/studio_catalogue.py --json          # machine readable, for directives
python scripts/studio_catalogue.py --summary       # one line
python scripts/studio_catalogue.py --check         # exit 1 on any P1, for a pre-commit or CI gate
python scripts/studio_catalogue.py --game brewfield
```

`--json` is the important one: a cross-game directive will be written against its output, so give
each finding a stable machine-readable `kind` (`orphan`, `retired-but-listed`, …) alongside the
human text.

Tests in `tests/test_studio_catalogue.py`, against a temporary fixture tree you build in the test —
**never against the real `ts/src/games/`**, which changes:

- a game dir present with a config but absent from registry.ts is reported `orphan` at P1
- a game with `status: 'retired'` still imported by registry.ts is reported `retired-but-listed`
- a shared module imported by exactly one game is reported `sole-consumer`; by two, not reported
- a config whose `label` cannot be parsed yields `null` and a counted gap, not a crash
- `--check` exits 1 when a P1 exists and 0 when none does
- a missing `arcade.json` at the site path degrades to `published: null` rather than failing

## 6. Two things you will find, as a correctness check on your work

Your first real run should report **Brewfield as `orphan`** (its config exists, `registry.ts` does
not import it) and **`wheelRelation` as `sole-consumer`** (only `brewfield/gameLogic.ts` imports
it). If it does not report both, the derivation is wrong — say so in your report rather than
adjusting the expectations.

## 7. Rules for this run

- **Write only inside this worktree.** Never `%TEMP%`, never `/tmp`. Scratch goes in
  `.devin-scratch/`.
- **Do not delete anything.** `rm` is not permitted in a headless run and ends it silently.
- **One shell command at a time.** No `&&` or `;` chains, no `$(...)`, no heredocs, no `cat` piped
  into a command.
- Commit with a plain single-line message: `git commit -m "one line"`.
- No servers, no long-running processes. Use the `python` already on PATH and do not probe for
  another interpreter.
- Reading `C:\GitHub\RFD_IT_Services_Site\data\arcade.json` is expected. Do not modify anything in
  that repo.
- Never merge, rebase onto, or push to `main`.
- If a command is refused, **stop immediately** and report Blocked with the refused command. Do not
  try a variation.

## 8. Completion criteria

- [ ] Both files exist; `python scripts/studio_catalogue.py` runs and prints a board.
- [ ] `--json` emits a stable `kind` per finding.
- [ ] `--check` exits 1 on a P1 and 0 otherwise.
- [ ] Tests pass and use a fixture tree, not the real games directory.
- [ ] The run reports Brewfield as `orphan` and `wheelRelation` as `sole-consumer` (§6).
- [ ] Nothing outside `scripts/` and `tests/` is modified.

## 9. Report

The counts it found per finding kind, whether §6 held, anything in this directive that was wrong or
ambiguous, and any judgement you made that it did not cover.

<!-- check: python scripts/studio_catalogue.py --check -->
<!-- outputs: scripts/studio_catalogue.py; tests/test_studio_catalogue.py -->

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | - |
| Branch | - |
| Base branch | - |

**Status log**
<!-- queue:end -->
