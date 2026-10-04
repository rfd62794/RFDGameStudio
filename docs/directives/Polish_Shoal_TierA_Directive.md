# Shoal Tier A: in-play New Reef control and touch input

## Read first

`docs/demos/shoal/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A, items A1-A8),
`ts/src/games/shoal/App.tsx` (lines 139-232, 268-378 and 380-455), `ts/src/games/shoal/styles.css` (lines 1-48),
`ts/tests/test_shoal_chrome_polish.ts` (lines 1-30), `ts/package.json` (line 10, `build:shoal`). Everything you
need is quoted below; do not search for anything else.

## 1. Why this exists

Shoal is the only `stable` demo in the arcade, so it must pass Tier A cleanly. The 2026-10-03 audit
(`docs/state/demo-audit-batch2-2026-10-03.md`, shoal row) found "no restart label" in play, and the scope analysis
verified it: a reef can be restarted only after extinction (the `EndStateScreen` "Seed a New Reef" button) or by
going "← Title" and pressing Start Reef. Tier A item A3 asks for a visible Restart / New Game that works without a
page reload. Separately, canvas input is mouse-only (`mousemove` / `mousedown` on `window`), so the primary action
is not verified reachable by touch at 390x844 (A4), and the toolbar cannot wrap.

Current code, quoted from `ts/src/games/shoal/App.tsx`:

```tsx
  const handleReplay = () => {
    sound.playUiConfirm();
    resetReefTracking();
    setReefKey((k) => k + 1);
  };
```

the toolbar (lines 337-358):

```tsx
        <div className="shoal-toolbar">
          {TOOLS.map((t) => (
            ...
          ))}
          <Button
            id="shoal-mechanics"
            label="Mechanics"
            onClick={() => { sound.playUiConfirm(); setShowMechanics(true); }}
            variant="neutral"
            size="sm"
          />
        </div>
        <ShoalCanvas key={reefKey} session={session} tool={tool} onStats={handleStats} />
```

and the input effect inside `ShoalCanvas` (lines 432-453):

```tsx
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      stateRef.current.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      const dims = stateRef.current.dims;
      const world = renderStateRef.current?.world;
      if (!world) return;
      const x = (e.clientX - r.left) * (world.width / dims.w);
      const y = (e.clientY - r.top) * (world.height / dims.h);
      stateRef.current.click = { x, y };
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
    };
  }, []);
```

`ts/src/games/shoal/styles.css` lines 8-13 and 42-46:

```css
.shoal-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
}
```
```css
.shoal-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
```

`handleReplay` already reseeds the reef in place (the keyed `ShoalCanvas` remounts and calls `initGame()`); no page
reload is involved. The new control reuses it.

## 2. Scope

Copied from `docs/demos/shoal/SCOPE.md`.

Top 3 changes, in order: 1. In-play "New Reef" control beside Mechanics, pointer-event input, verified at 390x844 (A3, A4). 2. Say "session-only" on the title, or persist seed/tick with a reset control (B2). 3. Headless run test: N ticks per scenario, no NaN/negative counts, extinction and survival both reachable (B4).

Out of scope: new habitats, orca/whale mechanic, typed arrays, layered canvas, sprite rewire (ROADMAP backlog), Y8/itch changes, changing `stable` status.

This directive targets Tier A only. It executes change 1 (A3, A4). Changes 2 and 3 are Tier B (B2, B4) and wait for a
later directive: do not start them.

## 3. The work

1. NEW `ts/src/games/shoal/components/NewReefControl.tsx` <!-- new: ts/src/games/shoal/components/NewReefControl.tsx -->:
   a tiny component `NewReefControl({ onNewReef })` rendering the shared `Button` (already imported in `App.tsx`
   from `../../ui/components`) with `id="shoal-new-reef"`, `label="New Reef"`, `variant="neutral"`, `size="sm"`.
   No confirm step (a reef holds no progress).
2. `ts/src/games/shoal/App.tsx`: import it and render `<NewReefControl onNewReef={handleReplay} />` directly after the
   `Mechanics` Button inside `.shoal-toolbar`. Do not change `handleReplay`, `handleStart` or any other behaviour.
3. NEW `ts/src/games/shoal/utils/pointerWorld.ts` <!-- new: ts/src/games/shoal/utils/pointerWorld.ts -->: two pure
   functions with the exact arithmetic of the quoted effect: `clientToCanvas(client, rect)` returning
   `{ x: client.x - rect.left, y: client.y - rect.top }`, and `clientToWorld(client, rect, dims, world)` returning
   `{ x: (client.x - rect.left) * (world.width / dims.w), y: (client.y - rect.top) * (world.height / dims.h) }`.
4. `ts/src/games/shoal/App.tsx`, the `ShoalCanvas` input effect: type the handlers as `PointerEvent`, use the two
   helpers, and register `pointermove` and `pointerdown` on `window` instead of `mousemove` / `mousedown` (pointer
   events cover mouse, touch and pen). Keep the listeners on `window`, keep the cleanup, keep `stateRef` shapes.
   No `mousedown` / `mousemove` string may remain in `App.tsx`.
5. `ts/src/games/shoal/styles.css`: add `flex-wrap: wrap;` to `.shoal-toolbar` and `touch-action: none;` to
   `.shoal-canvas` (so a touch drops a fish instead of scrolling the page, and six toolbar buttons wrap at 390 px).
6. NEW `ts/tests/test_shoal_new_reef_control.ts` <!-- new: ts/tests/test_shoal_new_reef_control.ts -->: unit tests of
   both pointerWorld helpers with fixed numbers (including a scaled case: rect 10,20; client 110,70; dims 400x300;
   world 1200x900 gives x=300, y=150), plus source-text assertions in the style of `test_shoal_chrome_polish.ts`
   (read files with `readFileSync(resolve(import.meta.dirname, '../src/games/shoal/...'))`): `App.tsx` contains
   `NewReefControl`, `pointerdown` and `pointermove` and contains neither `mousedown` nor `mousemove`;
   `styles.css` contains `flex-wrap: wrap` and `touch-action: none`.

## 4. What NOT to do

- Do not change simulation logic, scenarios, balance constants, the extinction `EndStateScreen`, the title screen, the
  sound module or Y8/itch wiring. Keep every existing behaviour and every existing test green.
- Do not add persistence, a "session-only" notice or a headless balance test (changes 2 and 3, Tier B).
- Do not change the registry status (`stable`), `ts/src/games/shoal/config.ts`, or any file under `examples/`.
- `App.tsx` is already 715 lines: net growth of at most 10 lines; the new logic lives in the two new modules.
- No new dependencies. No visual restyle beyond the two CSS lines named.

## 5. Verification

Run each as its own tool call, from the worktree root, and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_shoal_new_reef_control.ts test_shoal_chrome_polish.ts test_shoal_config.ts
```

The full suite (`cd ts && npm test`) and `cd ts && npm run build:shoal` (A6, A7; the script already exists at
`ts/package.json` line 10) are run by the reviewer after Review; they are not part of this run because the rules
allow only the one `cd ts &&` line. The A1-A4 browser smoke and the 390x844 screenshots are the reviewer's too.

Reference, run on main (f3208bc1) when this directive was written: `uv run python --version` gave
`Python 3.12.12`. The same vitest form on main with `test_shoal_chrome_polish.ts test_registry_export.ts` gave
`Test Files  2 passed (2)` and `Tests  28 passed (28)` (25 and 3 tests).
The `cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here; full-path filters such as `ts/tests/<name>.ts`
find none. Record any failure that also fails on a clean main as pre-existing, do not fix it.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry another
  way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&` or `||` chains, no pipes, no redirects. The one allowed
  exception is the fixed verification line `cd ts && npx vitest run test_shoal_new_reef_control.ts test_shoal_chrome_polish.ts test_shoal_config.ts`. Do not use `ls`, `Get-ChildItem` or `cat`: use
  Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not search or hunt for files
  that are not named in this directive: every path you need is quoted above. If something named here is
  missing or different from the quote, STOP and write exactly what is missing in the Status row.
- Work only on branch `directive/rfdgamestudio-polish-shoal-tiera-directive`. Never commit to main, never push, never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with a `<!-- new: ... -->` marker in your report, and a `// new:` header comment in new code files.
- New logic goes in the small new modules named in The work (SOLID/SRP/KISS). Keep every file you touch under
  600 lines where it already is; where a file is already over 600 lines, its net line count must not grow by more
  than 10.
- Free models only wherever any model config is touched (none is expected in this directive).
- Do not run `agentflow lint` or any other `agentflow` CLI. Never use `git -C`, `git -c`, `git --git-dir` or
  `git --work-tree`.
- Update this directive's Status row when you finish or stop partway. Done for the Status row means: the files in
  The work are changed or created, the verification commands in section 5 were run and their real tails are in
  the report, and the work is committed on the directive branch (not pushed). Move the row to `Review`, never to
  Done.

## 7. Completion criteria

Done means all of: (a) a visible "New Reef" button (`id="shoal-new-reef"`) sits in the in-play toolbar and calls
the existing `handleReplay`; (b) canvas input uses pointer events through `pointerWorld.ts`; (c) the two CSS lines are
in; (d) the verification line passes with the new test file included and no existing shoal test broken; (e) the work is
committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass counts. The run does
not mark Done and does not merge.

## 8. Report

Findings first: what changed, in which files. Then evidence: the real output tails of the commands in section 5.
Then one recommended action per open item. List every created file with a `<!-- new: ... -->` marker. State that
nothing was deployed and that nothing was pushed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching the site repo; touching protected repos
  (TeleseroAdminSuite2026, DialerListPulse); editing `.gitignore`, `examples/` (unless this directive names a
  file there), any `dist` or `dist-*` directory, or any other demo's files; installing or fetching anything.

## Required from User

none for the run. After Review and merge, deploying is Robert's separate step (Shoal ships to the arcade, itch and Y8 from the same
source, so a deploy reaches all three). Deploying is not part of this run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-shoal-tiera-directive |
| Base branch | - |

**Status log**
- 2026-10-03 · robert-claude-laptop · none → Queued — demo polish wave 1, Tier A only; Scope and Out of scope copied from the demo's SCOPE.md
<!-- queue:end -->
