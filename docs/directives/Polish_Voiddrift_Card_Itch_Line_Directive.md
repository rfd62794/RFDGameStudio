# VoidDrift card: say it is the full game on itch.io and that it plays here as an embed

**Depends on:** none (independent of the naming directive; the new test finds the card by its description, not its label).
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations (`docs/demos/voiddrift/DIRECTION.md`, Phase 2, card-text half).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/voiddrift/DIRECTION.md`, `ts/src/arcade/GameSelector.tsx` (lines 67-90 and the card markup around line 150), `ts/tests/test_arcade.ts` (the `VoidDrift external entry` block, about lines 369-440), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (A8).

## 1. Why this exists

VoidDrift is an itch.io iframe of the paid Rust/Bevy game. Its card should say so plainly: that this is the real, shipped game, and that it plays right here. `docs/demos/voiddrift/DIRECTION.md`: "a generic grey itch frame with no cover art, so the card does not say 'this is a real, sellable game'", and the polish standard's A8 says the card "labels it honestly ('embed' or '(Origin)')".
Measured on origin/main `d3084de0`: the card's detail line for any game that has both an `embedUrl` and an `externalUrl` is set in `ts/src/arcade/GameSelector.tsx` (the `details` memo): `map[config.gameId] = 'Rust/Bevy · itch.io';`. It says neither "full game" nor "embed", and today only the status badge ("EXTERNAL") hints at what it is.
Existing test that pins part of that line, `ts/tests/test_arcade.ts` (`test_external_card_shows_itch_detail`): `expect(text).toContain('Rust/Bevy');` and `expect(text).toContain('itch.io');`. The new line keeps both words, so that test stays unchanged.
Scope note: the DIRECTION.md pairs this with a cover image from `npm run covers`. That script does not exist yet (the spec's covers directive is controller-run, needs a browser) and a cover is a binary image, so the cover is NOT part of this run.

## 2. Scope

1. `ts/src/arcade/GameSelector.tsx`: one string.
2. `ts/tests/test_arcade.ts`: one new test inside the existing `VoidDrift external entry` describe block.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them).

**Step 1.** In `ts/src/arcade/GameSelector.tsx` replace the one line
`        map[config.gameId] = 'Rust/Bevy · itch.io';`
with
`        map[config.gameId] = 'Full game on itch.io · plays here as an embed · Rust/Bevy';`
(it is the only place that string appears; keep the middle dots exactly as they are).

**Step 2.** In `ts/tests/test_arcade.ts`, inside `describe('VoidDrift external entry', ...)`, directly after the closing `  });` of `it('test_external_card_shows_itch_detail', ...)` and before the closing `});` of the describe, add:
```
  it('test_voiddrift_card_says_full_game_on_itch_and_embed', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(GameSelector));
    });
    const card = Array.from(container.querySelectorAll('.arcade-card')).find(
      c => c.textContent?.includes('A mining simulation at the edge of a black hole')
    );
    expect(card).toBeDefined();
    expect(card!.textContent).toContain('Full game on itch.io');
    expect(card!.textContent).toContain('plays here as an embed');
    root.unmount();
  });
```

## 4. What NOT to do

- No cover image, no `npm run covers`, no manifest or screenshot work, no binary files.
- Do not change the label, blurb, status or any other card, the click behaviour, the iframe or `GameLoader.tsx`.
- Do not change `ts/src/games/voiddrift/config.ts`. Do not edit any other test.
- No Lua, no engine changes, no deploys, no protected repos, no player-layer work.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline, before editing (origin/main `d3084de0`):
```
cd ts && npx vitest run test_arcade.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  32 passed (32)`.
After editing, the same command: real prototype tail `Test Files  1 passed (1)` / `Tests  33 passed (33)`.
Type check, prints nothing when clean: `cd ts && npx tsc --noEmit` (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).
Source check (Grep tool): `ts/src/arcade/GameSelector.tsx` contains `Full game on itch.io` once.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`), `cd ts && npx tsc --noEmit`, `uv run python --version` and (only where a Verification section names it) `uv run pytest tests/test_wire_rust.py -q`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files under `ts/` and `docs/` use CRLF line endings in the worktree; keep them (the Edit tool preserves them). New files may use either; git normalizes line endings on commit.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The VoidDrift card's detail line reads "Full game on itch.io · plays here as an embed · Rust/Bevy".
- [ ] `cd ts && npx vitest run test_arcade.ts` passes with 33 tests (real tail pasted); `cd ts && npx tsc --noEmit` prints nothing.
- [ ] No file outside the two in Scope changed; the Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the two files and the real test counts. Evidence second: the real tails. Say plainly that the cover image is not done and why (no cover script yet, controller-run).
**Controller finish (after merge):** when the covers directive lands, add the 630x500 voiddrift cover; screenshot the card at 1280 and 390 wide, yes/no on A8.
Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.
