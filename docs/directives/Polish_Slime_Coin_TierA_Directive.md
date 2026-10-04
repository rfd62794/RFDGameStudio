# Slime Coin Tier A polish: Lua/TS bridge tests and a persisted best score

## Read first

`docs/demos/slime_coin/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A,
items A1-A8), `ts/src/games/slime_coin/App.tsx` (lines 1-20, 58-80, 160-170, 390-416; the file is 416 lines),
`games/slime_coin/logic.lua` (lines 147-375 and 857-920), `ts/src/engine/runtime.ts` (lines 1-14),
`ts/tests/test_multi_return_bridge.ts` (lines 1-45, the existing real-Lua test style),
`ts/tests/test_shared_persistence.ts` (lines 1-20, the localStorage pattern),
`ts/src/engine/shared/persistence.ts`. Everything you need is quoted below; do not search for anything else.

## 1. Why this exists

Slime Coin (registry status `dev`) is a real-time coin pusher run: 15 rounds, rising target score (x1.5 per
round), chip cards, tokens, a shop. It loads, has "New Game", and shows zero console errors (audit,
`docs/state/demo-audit-batch2-2026-10-03.md`). The polish standard found:

1. A6 gap: no test file for Slime Coin's own logic. The files named `*slime*` in `ts/tests` belong to
   SlimeWorld. The Lua logic (`games/slime_coin/logic.lua`, 920 lines) drives the whole run; the TS side
   calls it through `useLuaCall` (`ts/src/hooks/useLuaCall.ts`), which wraps `call` from
   `ts/src/engine/runtime.ts`. That `call` is testable directly in vitest with the real engine:

```ts
import { loadGame, call } from '../src/engine/runtime';
const session = loadGame('slime_coin', 42);   // real fengari, real logic.lua, engine primitives prepended
const [summary] = call(session, 'get_state_summary') as Array<Record<string, unknown>>;
```

   `call` returns an ARRAY of Lua return values; the first element is the result table. This was run when the
   directive was written and gave, for a fresh session after `init_game`:
   `init_game` -> `[{"success":true}]`;
   `get_state_summary` -> `phase:"playing", round:1, total_rounds:15, score:0, target_score:100, score_rate:1,
   hand_in:10, shelf_coin_count:80, floor_coin_count:0, owned_chips:[], combo_count:0`;
   `shop_purchase('hand_upgrade')` with 0 tokens -> `{"error":"Insufficient tokens"}`;
   `end_round()` at round 1, score 0 -> `{round:1, score:0, target:100, target_met:false, offered_cards:[3 cards,
   each {id,name,rarity,description}]}`;
   then `select_card('heavy_impact')` -> `{card_id:"heavy_impact", next_round:2}` and `get_state_summary` ->
   `phase:"playing", round:2, target_score:150, owned_chips:["heavy_impact"], shelf_coin_count:0`;
   then `tick_game(0.016, {fire:false, side:'right'})` -> a table with `phase:"playing", round:2, score:0,
   target_score:150, hand_in:10`.

   The relevant Lua, quoted:

```lua
function end_round()
  -- Check if target met
  local target_met = GAME_STATE.score >= GAME_STATE.target_score
  -- Offer chip cards
  GAME_STATE.phase = 'card_select'
  GAME_STATE.offered_cards = generate_card_offer(3)
  return { round = GAME_STATE.round, score = GAME_STATE.score, target = GAME_STATE.target_score,
           target_met = target_met, offered_cards = GAME_STATE.offered_cards }
end

function select_card(card_id)
  table.insert(GAME_STATE.owned_chips, card_id)
  GAME_STATE.selected_card = card_id
  GAME_STATE.phase = 'playing'
  -- Advance to next round
  if GAME_STATE.round < GAME_STATE.total_rounds then
    start_round(GAME_STATE.round + 1)
  else
    GAME_STATE.phase = 'run_end'
  end
  return {card_id = card_id, next_round = GAME_STATE.round}
end

-- start_round: GAME_STATE.target_score = math.floor(100 * (1.5 ^ (round_num - 1)))
-- tick_game: if GAME_STATE.phase ~= 'playing' then return {phase = GAME_STATE.phase} end
```

   **A defect found while writing this directive (report it, do not fix it):** `exchange()` in
   `games/slime_coin/logic.lua` computes its cost with `math.pow(cost_growth, GAME_STATE.exchanges_used)`
   (line 319). `math.pow` is nil under the engine's Lua 5.3, so calling `exchange` raises
   `LuaError: ... attempt to call a nil value (field 'pow')`; `useLuaCall` swallows it and returns null, so the
   in-game Exchange button (`ts/src/games/slime_coin/App.tsx` line 350 `call('exchange')`) silently does
   nothing. `logic.lua` is out of scope for this run. Do NOT test `exchange`, do NOT edit `logic.lua`; state the
   defect and the one-line fix (`cost_growth ^ GAME_STATE.exchanges_used`) in the Report for Robert.

2. Only the tutorial-seen flag is persisted today; there is no best score. `ts/src/games/slime_coin/App.tsx`
   lines 71-77 (the existing pattern to follow):

```tsx
  // First-run pusher primer: fires only when the game has never been
  // completed-onboarded, via the shared OnboardingGate (boolean mode).
  const [hasOnboarded] = useState<boolean>(
    () => loadSave<boolean>('slime_coin_tutorial_seen') === true
  );
  const { shouldShow: showPrimer, handleComplete: completePrimer, trigger: triggerPrimer } =
    useOnboardingGate({ mode: 'boolean', initialShow: false });
```

   The run-end screen, `App.tsx` lines 392-413:

```tsx
      {state.phase === 'run_end' && (
        <div className="sc-modal-overlay">
          <EndStateScreen
            won={state.score >= state.target_score}
            headline={state.score >= state.target_score ? 'Vat Overflowing' : 'Run Complete'}
            flavorLine={
              state.score >= state.target_score
                ? 'The pusher paid out — final target cleared.'
                : 'The shelf went quiet before the final target fell.'
            }
            stats={[
              { label: 'Final Score', value: state.score },
              { label: 'Final Target', value: state.target_score },
              { label: 'Rounds', value: state.total_rounds },
              { label: 'Tokens Banked', value: state.tokens },
              { label: 'Chips Owned', value: state.owned_chips.length },
            ]}
```

   The run always lasts 15 rounds (there is no early loss state), so "rounds reached" carries no information;
   only a best score is persisted.

3. A4 on a phone: the `BoardCanvas` playtest at 390x844 has no screenshot recorded ("n/v" in the audit). A
   browser is not available to this run; that item is done by the reviewer, not by you.

Shared persistence, quoted (`ts/src/engine/shared/persistence.ts`): `loadSave<T>(key, opts?) => T | null`
(missing key or bad JSON gives null, never throws), `writeSave<T>(key, value, opts?) => void`,
`clearSave(key)`. Callers keep their own key strings.

## 2. Scope

Copied from `docs/demos/slime_coin/SCOPE.md` (Robert's direction). Class: refine, the loop is complete and
passes Tier A; the gaps are tests and meta polish.

Top 3 changes, in order:
1. Add tests for the Lua/TS bridge (round end, card select, run_end).
2. Persist best score / rounds reached via shared persistence.
3. Phone-width playtest of BoardCanvas (screenshot "n/v", audit batch2:21).

In scope, exactly these files: `ts/tests/test_slime_coin_bridge.ts` <!-- new: ts/tests/test_slime_coin_bridge.ts -->,
`ts/src/games/slime_coin/utils/bestScore.ts` <!-- new: ts/src/games/slime_coin/utils/bestScore.ts -->,
`ts/tests/test_slime_coin_best_score.ts` <!-- new: ts/tests/test_slime_coin_best_score.ts -->, and
`ts/src/games/slime_coin/App.tsx` (three small edits).

Out of scope (verbatim from SCOPE.md): new chip cards/coin types, balance changes, cross-run meta-progression,
multiplayer, the archived Coin Pusher Arcade project (roadmap:76), a new genre value.

Also not touched: `games/slime_coin/` (all Lua and YAML), `ts/src/games/slime_coin/utils/sound.ts` (its
duplication is the subject of `docs/directives/Polish_Shared_Sfx_Directive.md`), `ts/src/games/slime_coin/config.ts`,
shared components, any other demo.

## 3. The work

Tier A target. A6 is the gap this run closes (change 1). A7 already holds: `ts/package.json` has the line
below, so add no script. A1-A5 are browser checks for the reviewer.

```
    "build:slime_coin": "vite build --config vite.slime_coin.config.ts",
```

1. New test `ts/tests/test_slime_coin_bridge.ts` <!-- new: ts/tests/test_slime_coin_bridge.ts -->. Use
   `loadGame` and `call` from `'../src/engine/runtime'` exactly as quoted in section 1, a FRESH
   `loadGame('slime_coin', 42)` plus `call(session, 'init_game', {})` in each test (the Lua state is global
   per session). Cases, with the values observed when this directive was written:
   a. `init_game` returns `success: true`; `get_state_summary` has phase `playing`, round 1, `total_rounds` 15,
      `target_score` 100, `hand_in` 10, `shelf_coin_count` 80, `owned_chips` empty.
   b. Round end: `end_round` returns `round` 1, `score` 0, `target` 100, `target_met` false and exactly 3
      `offered_cards`, each with a string `id`; afterwards `get_state_summary().phase` is `card_select`.
   c. While in `card_select`, `tick_game(0.016, {fire:false, side:'right'})` returns a table whose `phase` is
      `card_select` (the loop is parked until a card is chosen).
   d. Card select: after `end_round`, `select_card('heavy_impact')` returns `card_id` `heavy_impact` and
      `next_round` 2; the summary then has phase `playing`, round 2, `target_score` 150,
      `owned_chips` equal to `['heavy_impact']`, `shelf_coin_count` 0.
   e. Targets grow x1.5: after a second `end_round` + `select_card`, the summary round is 3 and
      `target_score` is 225.
   f. run_end: repeat `end_round` then `select_card('heavy_impact')` 15 times from a fresh session; after the
      15th, the summary phase is `run_end` and round is 15, `owned_chips` has 15 entries, and
      `tick_game(0.016, {fire:false, side:'right'})` returns phase `run_end`.
   g. Playing tick: from a fresh session, `tick_game(0.016, {fire:false, side:'right'})` returns phase
      `playing`, round 1, hand_in 10.
   h. Shop errors: `shop_purchase('hand_upgrade')` with 0 tokens returns an `error` of
      `Insufficient tokens`; `shop_purchase('nonsense')` returns an `error` of `Unknown item type`.
   Do not test `exchange` (known defect, section 1). Do not assert `offered_cards` contents beyond count and
   `id` type (they are random). The test header comment says it exercises the real Lua through the same
   `call` the game's `useLuaCall` uses.
2. New module `ts/src/games/slime_coin/utils/bestScore.ts` <!-- new: ts/src/games/slime_coin/utils/bestScore.ts -->
   with exactly this content:

```ts
// bestScore.ts — Slime Coin best-score persistence (shared persistence, raw number).
import { loadSave, writeSave } from '../../../engine/shared/persistence';

export const BEST_SCORE_SLOT = 'slime_coin_best_score';

/** Stored best score, or 0 when missing, corrupt or not a positive finite number. */
export function loadBestScore(): number {
  const stored = loadSave<unknown>(BEST_SCORE_SLOT);
  return typeof stored === 'number' && Number.isFinite(stored) && stored > 0 ? stored : 0;
}

/** Records a finished run's score; persists it only when it beats the stored best. */
export function recordRunScore(score: number): { best: number; isNewBest: boolean } {
  const previous = loadBestScore();
  if (!Number.isFinite(score) || score <= previous) return { best: previous, isNewBest: false };
  writeSave(BEST_SCORE_SLOT, score);
  return { best: score, isNewBest: true };
}
```

3. New test `ts/tests/test_slime_coin_best_score.ts` <!-- new: ts/tests/test_slime_coin_best_score.ts -->
   (jsdom localStorage, `beforeEach(() => localStorage.clear())`, like `ts/tests/test_shared_persistence.ts`):
   empty storage gives `loadBestScore()` 0; `recordRunScore(120)` returns `{best:120,isNewBest:true}` and
   `JSON.parse(localStorage.getItem('slime_coin_best_score') as string)` is 120; then `recordRunScore(80)`
   returns `{best:120,isNewBest:false}` and storage still holds 120; `recordRunScore(200)` is a new best; a
   corrupt value (`localStorage.setItem('slime_coin_best_score','{broken')`) and a non-number value
   (`'"abc"'`) both give `loadBestScore()` 0; `recordRunScore(0)` and `recordRunScore(NaN)` on empty storage
   return `isNewBest:false` and write nothing (`localStorage.getItem` is null).
4. `ts/src/games/slime_coin/App.tsx`, three small edits (the file stays well under 600 lines):
   a. Add the import beside the existing `loadSave, writeSave` import (line 9):
      `import { loadBestScore, recordRunScore } from './utils/bestScore';`
   b. Directly after the `useOnboardingGate` block (the line `useOnboardingGate({ mode: 'boolean', initialShow: false });`
      at line 77, which is BEFORE the `if (showTitle)` early return at line 116, so hook order is stable) add:

```tsx
  // Best score: read once, recorded when a run ends.
  const [bestScore, setBestScore] = useState<number>(() => loadBestScore());
  useEffect(() => {
    if (!state || state.phase !== 'run_end') return;
    setBestScore(recordRunScore(state.score).best);
  }, [state]);
```

   c. In the run-end `stats` array add, directly after the `Final Score` line:
      `{ label: 'Best Score', value: bestScore },`
5. Do not do the phone playtest; state in the report that it was not performed by this run.

## 4. What NOT to do

- No new chip cards or coin types, no balance change, no cross-run meta-progression, no multiplayer, no new
  genre value, no edit to `games/slime_coin/` Lua or YAML (including the `exchange` fix: report it).
- Do not change the existing key `slime_coin_tutorial_seen` or any existing behaviour; the best score uses its
  own new key `slime_coin_best_score` and a raw number.
- Do not extract anything into shared modules (no second consumer exists; ADR-014 says do not extract
  speculatively). Do not touch `sound.ts`.
- Do not add a reset-save control or any UI beyond the one stat row.

## 5. Verification

Run each as its own tool call from the worktree root and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_slime_coin_bridge.ts test_slime_coin_best_score.ts test_shared_persistence.ts test_multi_return_bridge.ts
```

Reference, run when this directive was written against origin/main: `uv run python --version` gave
`Python 3.12.12`; `cd ts && npx vitest run test_shared_persistence.ts test_multi_return_bridge.ts` gave
`Test Files  2 passed (2)` and `Tests  16 passed (16)` (your two new files add to that). The
`cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here; `ts/tests/...` paths
find none. The full suite (`cd ts && npm test`) and `cd ts && npm run build:slime_coin` are reviewer-side
steps, not run here. A failure that also fails on a clean main is pre-existing: record it, do not fix it.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry
  another way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&`, `||` or `|` chains and no redirects (the one allowed
  exception is the fixed `cd ts && npx vitest run ...` line in section 5). Do not use `ls`,
  `Get-ChildItem` or `cat`: use Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not use a search, memory or
  web tool beyond the Read, Glob and Grep tools inside the worktree. Do not hunt: everything you need is quoted in this
  directive; if a quoted line or a cited path is not where it says, STOP and write why in the Status row.
- Work only on branch `directive/rfdgamestudio-polish-slime-coin-tiera-directive`. Never commit to main, never push, never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with `<!-- new: path -->` in your report (and, where the file type allows, in
  a header comment).
- New logic goes in small new modules (one job per file); do not grow a file that is already over 600 lines
  (note: edit those in place, same line count).
- Free models only wherever any model configuration is touched (none is expected).
- Do not run `agentflow lint` or any other `agentflow` CLI.
- Never use `git -C`, `git -c`, `git --git-dir` or `git --work-tree`; run git with the worktree as the
  working directory.
- Done means (the Status row): you stopped at `Review` after committing on the directive branch, with one
  line in the log giving the test pass counts. You do not mark Done and you do not merge.

## 7. Completion criteria

- [ ] `ts/tests/test_slime_coin_bridge.ts` covers cases a-h of section 3 against the real Lua and passes.
- [ ] `ts/src/games/slime_coin/utils/bestScore.ts` and `ts/tests/test_slime_coin_best_score.ts` exist and pass;
      `ts/src/games/slime_coin/App.tsx` has exactly the three edits of section 3.4 and nothing else.
- [ ] The vitest line in section 5 passes (4 files) and `git status` shows exactly four files created and one
      modified (`App.tsx`); nothing under `games/slime_coin/` changed.
- [ ] Committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass
      counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: what changed, and the `exchange()` / `math.pow` defect with the one-line fix for Robert.
Then evidence: the real output tails of the two commands in section 5. Then one recommended action per open
item; state that the A4 phone-width playtest of `BoardCanvas` was NOT performed (reviewer-side). List every
created file with `<!-- new: path -->`. State that nothing was deployed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching protected repos; installing or fetching
  anything; editing `.gitignore`, `examples/` or any `dist`/`dist-*` directory; changing gameplay, rules,
  balance or art; touching any demo other than the one named in this directive.

## Required from User

none. Deploying the changed blurb to games.rfditservices.com is Robert's separate step after review and
merge; it is not part of this run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-slime-coin-tiera-directive |
| Base branch | - |
| Base commit | 3875a8142484b3cc757e8cce1ea4b7f26595f6cd |

**Status log**
- 2026-10-03 · robert-claude-laptop · none → Queued — wave 1 Tier A polish for slime_coin: Lua/TS bridge tests, persisted best score; exchange() math.pow defect to report not fix; docs/demos/slime_coin/SCOPE.md
- 2026-10-04 00:05 · robert-claude-laptop · Queued → Approved — lint override: errors are files the run creates (test_slime_coin_bridge.ts, bestScore.ts, test_slime_coin_best_score.ts), each marked with a new-file marker; author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
- 2026-10-04 00:05 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-slime-coin-tiera-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 00:06 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-polish-slime-coin-tiera-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
