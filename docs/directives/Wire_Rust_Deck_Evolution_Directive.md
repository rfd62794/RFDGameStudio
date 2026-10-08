# Wire & Rust deck evolution: spend scrap to add parts, lose a part when a fight goes wrong

**Depends on:** `Polish_Wire_Rust_TierA_Directive.md` merged (it adds `ts/src/games/wire_rust/run.ts` <!-- new: ts/src/games/wire_rust/run.ts -->, the win rule and `test_wire_rust_run.ts`, which this run extends).
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations (`docs/demos/wire_rust/DIRECTION.md`, Phase 2: "the missing pillar").

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/wire_rust/DIRECTION.md`, `docs/gdd/WireAndRust_Design.md` (Core Loop and Pillars), `games/wire_rust/data.yaml` (cards and rooms), `games/wire_rust/logic.lua` (read only: `draw_hand`, `move_room`, `resolve_encounter`),
`ts/src/games/wire_rust/run.ts`, `ts/src/games/wire_rust/App.tsx`, `ts/src/games/wire_rust/types.ts`.

## 1. Why this exists

The design says "your deck IS your salvage pile": salvage adds cards, failed checks destroy them. The build dropped that, and `DIRECTION.md` calls it the point of the game: scrap is "earned (`logic.lua:144-146`) and shown (`App.tsx:172-173`) but never spent; cards are never added or lost".
Facts that shape the design, measured:
- The deck is `player.deck`, a list of `{ id, quantity }` entries, 10 parts at the start (3 copper rod, 3 zinc plate, 2 iron block, 2 lead solder; `logic.lua` `init_game`). `draw_hand` rebuilds a hand of 4 from the deck on every `move_room`. So adding or removing deck entries in TypeScript changes what the player draws next, with no Lua change.
- Part prices: `data.yaml` gives each card a `scrap_value` (copper rod 3, zinc plate 2, iron block 4, lead solder 1).
- Salvage rooms: `interaction_types` containing `salvage` are `junk_heap` and `wire_maze`.
- A won fight already pays 3 to 5 scrap (`logic.lua`: `math.random(3) + 2`).
Design (small and honest): in a salvage room a "Salvage Bench" sells one copy of any part for twice its scrap value; you draw it after your next move. A lost fight scraps the part you played (one copy leaves the deck), but the deck never drops below 4 parts so a full hand can always be drawn. The Tier A directive made the Control Room a win; this makes the deck matter on the way there.

## 2. Scope

1. New module `<!-- new: ts/src/games/wire_rust/deck.ts -->` (pure deck rules).
2. `ts/src/games/wire_rust/run.ts`: replace with the version below (adds `isSalvageRoom`, `applyBuyCard`, and card loss in `applyPlayCard`).
3. `ts/src/games/wire_rust/App.tsx`: a Salvage Bench card, a Deck line, a buy handler.
4. New test `<!-- new: ts/tests/test_wire_rust_deck.ts -->`.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them).

**Step 1: `deck.ts`**, exactly:
```
import type { CardId, InventoryItem, PlayerState } from './types';

/** The deck never shrinks below one full hand, so every move can draw 4 parts. */
export const MIN_DECK_SIZE = 4;
/** A part from the salvage bench costs this many times its scrap value. */
export const SALVAGE_COST_FACTOR = 2;

export function deckSize(deck: readonly InventoryItem[]): number {
  return deck.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
}

export function salvageCost(scrapValue: number): number {
  return Math.max(1, scrapValue) * SALVAGE_COST_FACTOR;
}

export function addCardToDeck(player: PlayerState, cardId: CardId): PlayerState {
  const deck = player.deck.map((item) => ({ ...item }));
  const entry = deck.find((item) => item.id === cardId);
  if (entry) entry.quantity = (entry.quantity ?? 1) + 1;
  else deck.push({ id: cardId, quantity: 1 });
  return { ...player, deck };
}

/** Scraps one copy of the card. Returns the same player object when the deck is at its minimum or has no copy. */
export function removeCardFromDeck(player: PlayerState, cardId: CardId): PlayerState {
  if (deckSize(player.deck) <= MIN_DECK_SIZE) return player;
  const index = player.deck.findIndex((item) => item.id === cardId && (item.quantity ?? 1) > 0);
  if (index === -1) return player;
  const deck = player.deck
    .map((item, i) => (i === index ? { ...item, quantity: (item.quantity ?? 1) - 1 } : { ...item }))
    .filter((item) => (item.quantity ?? 1) > 0);
  return { ...player, deck };
}

export function canAffordSalvage(scrap: number, scrapValue: number): boolean {
  return scrap >= salvageCost(scrapValue);
}
```
**Step 2: `run.ts`.** Replace the whole file with exactly this (it is the Tier A `run.ts` plus the new pieces; read the Tier A file first and confirm nothing else differs):
```
import type { GameSession } from '../../engine/types';
import { call } from '../../engine/runtime';
import { mulberry32 } from '../../engine/shared/seededRandom';
import type { CardId, EncounterResult, PlayerState, Room, WireRustGameState } from './types';
import { addCardToDeck, canAffordSalvage, removeCardFromDeck, salvageCost } from './deck';

export const GATE_ROOM = 'reactor_core';
export const GOAL_ROOM = 'control_room';

export type RunStatus = 'playing' | 'won' | 'lost';

/** The D20 for a given turn of a given run. Same seed and turn always give the same roll. */
export function rollD20(seed: number, turn: number): number {
  return Math.floor(mulberry32(seed + turn * 7919)() * 20) + 1;
}

/** The Control Room opens only after the Reactor Core challenge has been won. */
export function canEnterRoom(cleared: readonly string[], roomId: string): boolean {
  return roomId !== GOAL_ROOM || cleared.includes(GATE_ROOM);
}

export function runStatus(state: Pick<WireRustGameState, 'player'>): RunStatus {
  if (state.player.hp <= 0) return 'lost';
  return state.player.current_room_id === GOAL_ROOM ? 'won' : 'playing';
}

function roomsOf(session: GameSession): Record<string, Room> {
  const data = session.files.data as Record<string, unknown>;
  return (data.rooms ?? {}) as Record<string, Room>;
}

export function newRun(session: GameSession, seed: number = Math.floor(Math.random() * 0x7fffffff)): WireRustGameState {
  const data = session.files.data as Record<string, unknown>;
  const rooms = roomsOf(session);
  const player = call(session, 'init_game', data)[0] as PlayerState;
  return {
    player,
    currentRoom: rooms[player.current_room_id] ?? rooms.junk_heap,
    combatHistory: [],
    message: 'Scrapyard entered.',
    cleared: [],
    seed,
    turn: 0,
  };
}

/** Returns the same state object when the move is not allowed. */
export function applyMove(session: GameSession, state: WireRustGameState, roomId: string): WireRustGameState {
  if (!canEnterRoom(state.cleared, roomId)) return state;
  const data = session.files.data as Record<string, unknown>;
  const next = call(session, 'move_room', data, state.player, roomId)[0] as PlayerState | null;
  if (!next || next.current_room_id === state.player.current_room_id) return state;
  const rooms = roomsOf(session);
  return {
    ...state,
    player: next,
    currentRoom: rooms[next.current_room_id] ?? state.currentRoom,
    message: `Moved to ${rooms[next.current_room_id]?.name ?? roomId}`,
  };
}

export function isSalvageRoom(room: Room): boolean {
  return (room.interaction_types ?? []).includes('salvage');
}

/** Spends scrap to add one copy of a part to the deck. Returns the same state when it is not allowed. */
export function applyBuyCard(session: GameSession, state: WireRustGameState, cardId: CardId): WireRustGameState {
  if (!isSalvageRoom(state.currentRoom)) return state;
  const data = session.files.data as Record<string, unknown>;
  const cards = (data.cards ?? {}) as Record<string, { name?: string; scrap_value?: number }>;
  const card = cards[cardId];
  if (!card) return state;
  const scrapValue = card.scrap_value ?? 1;
  if (!canAffordSalvage(state.player.scrap, scrapValue)) return state;
  const cost = salvageCost(scrapValue);
  const player = addCardToDeck({ ...state.player, scrap: state.player.scrap - cost }, cardId);
  return {
    ...state,
    player,
    message: `Bought ${card.name ?? cardId} for ${cost} scrap. You will draw it after your next move.`,
  };
}

export interface PlayOutcome {
  state: WireRustGameState;
  result: EncounterResult | null;
}

export function applyPlayCard(session: GameSession, state: WireRustGameState, cardId: CardId): PlayOutcome {
  const data = session.files.data as Record<string, unknown>;
  const roll = rollD20(state.seed, state.turn);
  const result = call(session, 'resolve_encounter', data, state.player, cardId, roll)[0] as EncounterResult | null;
  if (!result) return { state, result: null };

  const cards = (data.cards ?? {}) as Record<string, { combat_mod?: number }>;
  const cardMod = cards[cardId]?.combat_mod ?? 0;
  const math = `D20 ${roll} + card ${cardMod} + chem ${result.bonus} = ${result.total_score} vs ${result.difficulty}`;
  const lostPlayer = result.won ? result.player : removeCardFromDeck(result.player, cardId);
  const scrapped = !result.won && lostPlayer !== result.player;
  const cardName = (data.cards as Record<string, { name?: string }> | undefined)?.[cardId]?.name ?? cardId;
  const logMsg = result.won
    ? `[WIN] ${state.currentRoom.name}: ${math} — salvage stored!`
    : `[LOSS] ${state.currentRoom.name}: ${math} — core integrity damaged${scrapped ? `, and your ${cardName} was scrapped` : ''}.`;

  return {
    result,
    state: {
      ...state,
      player: lostPlayer,
      combatHistory: [logMsg, ...state.combatHistory.slice(0, 49)],
      message: result.won ? 'Encounter resolved' : 'Core hit',
      cleared: result.won && !state.cleared.includes(state.currentRoom.id)
        ? [...state.cleared, state.currentRoom.id]
        : state.cleared,
      turn: state.turn + 1,
    },
  };
}
```
**Step 3: `App.tsx`, four edits.**
1. Replace the line `import { GATE_ROOM, applyMove, applyPlayCard, canEnterRoom, newRun, runStatus } from './run';` with:
```
import { GATE_ROOM, applyBuyCard, applyMove, applyPlayCard, canEnterRoom, isSalvageRoom, newRun, runStatus } from './run';
import { canAffordSalvage, deckSize, salvageCost } from './deck';
```
2. Directly above `  const handleReset = useCallback(() => {` add:
```
  const handleBuy = useCallback((cardId: CardId) => {
    if (!state) return;
    const next = applyBuyCard(session, state, cardId);
    if (next === state) return;
    sfx.play('confirm');
    setState(next);
  }, [state, session, setState]);

```
3. In the Vital Stats card, directly above the `<div className="flex justify-between items-center text-xs text-slate-400 mt-1">` row that shows `Stored Items:` add:
```
                <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                  <span>Deck:</span>
                  <span>{deckSize(state.player.deck)} parts</span>
                </div>
```
4. Directly above the Navigation card (`<Card className="border-cyan-800 bg-slate-900/60 p-4">` whose heading holds `<ArrowRight ... /> Navigation`) add:
```
            {isSalvageRoom(state.currentRoom) && (
              <Card className="border-amber-700 bg-slate-900/60 p-4">
                <h3 className="text-lg font-bold text-amber-400 mb-1">Salvage Bench</h3>
                <p className="text-xs text-slate-400 mb-3">Spend scrap to add a part to your deck. A lost fight can scrap a part, so keep some spares.</p>
                <div className="flex flex-col gap-2">
                  {(Object.keys(CARD_DATA) as CardId[]).map(cardId => {
                    const scrapValue = ((data.cards as Record<string, { scrap_value?: number }> | undefined)?.[cardId]?.scrap_value) ?? 1;
                    return (
                      <Button
                        key={cardId}
                        onClick={() => handleBuy(cardId)}
                        disabled={!canAffordSalvage(state.player.scrap, scrapValue)}
                        variant="secondary"
                        size="sm"
                        className="justify-between"
                        label={`${CARD_DATA[cardId].name} (+${CARD_DATA[cardId].combat_mod})`}
                        icon={<span className="ml-2"><Badge variant="muted" label={`${salvageCost(scrapValue)} scrap`} /></span>}
                      />
                    );
                  })}
                </div>
              </Card>
            )}

```

**Step 4: test**, exactly `ts/tests/test_wire_rust_deck.ts`:
```
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame } from '../src/engine/runtime';
import type { CardId, PlayerState } from '../src/games/wire_rust/types';
import {
  MIN_DECK_SIZE,
  addCardToDeck,
  canAffordSalvage,
  deckSize,
  removeCardFromDeck,
  salvageCost,
} from '../src/games/wire_rust/deck';
import { GATE_ROOM, applyBuyCard, applyMove, applyPlayCard, newRun, runStatus } from '../src/games/wire_rust/run';

const app = readFileSync(resolve(import.meta.dirname, '../src/games/wire_rust/App.tsx'), 'utf8');

const player = (deck: { id: string; quantity: number }[], scrap = 10): PlayerState => ({
  hp: 50,
  scrap,
  current_room_id: 'junk_heap',
  hand: [],
  deck,
  inventory: { items: [] },
});

describe('Wire & Rust deck rules', () => {
  it('the starting deck is 10 parts', () => {
    const session = loadGame('wire_rust', 1);
    expect(deckSize(newRun(session, 1).player.deck)).toBe(10);
  });

  it('adds a copy to an existing or new entry without mutating', () => {
    const p = player([{ id: 'copper_rod', quantity: 3 }]);
    const a = addCardToDeck(p, 'copper_rod');
    expect(a.deck).toEqual([{ id: 'copper_rod', quantity: 4 }]);
    expect(p.deck).toEqual([{ id: 'copper_rod', quantity: 3 }]);
    expect(addCardToDeck(p, 'zinc_plate').deck).toEqual([
      { id: 'copper_rod', quantity: 3 },
      { id: 'zinc_plate', quantity: 1 },
    ]);
  });

  it('scraps one copy, drops empty entries, and never goes below 4 parts', () => {
    const p = player([{ id: 'copper_rod', quantity: 1 }, { id: 'zinc_plate', quantity: 4 }]);
    const a = removeCardFromDeck(p, 'copper_rod');
    expect(a.deck).toEqual([{ id: 'zinc_plate', quantity: 4 }]);
    expect(MIN_DECK_SIZE).toBe(4);
    expect(removeCardFromDeck(a, 'zinc_plate')).toBe(a);
    expect(removeCardFromDeck(p, 'iron_block')).toBe(p);
  });

  it('prices a part at twice its scrap value', () => {
    expect(salvageCost(3)).toBe(6);
    expect(salvageCost(0)).toBe(2);
    expect(canAffordSalvage(6, 3)).toBe(true);
    expect(canAffordSalvage(5, 3)).toBe(false);
  });
});

describe('Wire & Rust salvage bench and scrapping in play', () => {
  it('buying in a salvage room costs scrap and adds a part; refused elsewhere or when short', () => {
    const session = loadGame('wire_rust', 3);
    const start = newRun(session, 3); // junk_heap is a salvage room, scrap 10
    const bought = applyBuyCard(session, start, 'copper_rod'); // scrap_value 3 -> cost 6
    expect(bought.player.scrap).toBe(4);
    expect(deckSize(bought.player.deck)).toBe(11);
    expect(applyBuyCard(session, bought, 'iron_block')).toBe(bought); // cost 8 > 4

    const moved = applyMove(session, start, 'rust_pit'); // a fight room
    expect(applyBuyCard(session, moved, 'lead_solder')).toBe(moved);
  });

  it('a lost fight scraps the played part, a won fight keeps the deck', () => {
    let lostSeen = false;
    let wonSeen = false;
    for (let seed = 1; seed <= 60 && !(lostSeen && wonSeen); seed++) {
      const session = loadGame('wire_rust', seed);
      let state = applyMove(session, applyMove(session, newRun(session, seed), 'rust_pit'), GATE_ROOM);
      const before = deckSize(state.player.deck);
      const card = state.player.hand[0] as CardId;
      const out = applyPlayCard(session, state, card);
      state = out.state;
      if (out.result!.won) {
        expect(deckSize(state.player.deck)).toBe(before);
        wonSeen = true;
      } else {
        expect(deckSize(state.player.deck)).toBe(before - 1);
        expect(state.combatHistory[0]).toContain('was scrapped');
        lostSeen = true;
      }
    }
    expect(wonSeen).toBe(true);
    expect(lostSeen).toBe(true);
  });

  it('repeated losses stop at the 4-part floor and the run still ends', () => {
    const session = loadGame('wire_rust', 9);
    let state = applyMove(session, applyMove(session, newRun(session, 9), 'rust_pit'), GATE_ROOM);
    for (let i = 0; i < 400 && runStatus(state) === 'playing'; i++) {
      if (state.player.hand.length === 0) {
        state = applyMove(session, state, 'rust_pit');
        state = applyMove(session, state, GATE_ROOM);
        continue;
      }
      const weakest = [...state.player.hand].sort()[0] as CardId;
      state = applyPlayCard(session, state, weakest).state;
      expect(deckSize(state.player.deck)).toBeGreaterThanOrEqual(MIN_DECK_SIZE);
    }
    expect(runStatus(state)).not.toBe('playing');
  });

  it('the app shows a Salvage Bench and the deck size', () => {
    expect(app).toContain('Salvage Bench');
    expect(app).toContain('isSalvageRoom(state.currentRoom)');
    expect(app).toContain('deckSize(state.player.deck)');
  });
});
```

## 4. What NOT to do

- NO Lua additions or edits (`games/wire_rust/logic.lua`, `data.yaml`, `systems.yaml`, `ui.yaml`, anything under `engine/`). The deck is plain data that TypeScript may change; Lua only reads it.
- No new cards, rooms, prices in `data.yaml`, or balance numbers beyond the two constants in `deck.ts` (`MIN_DECK_SIZE` 4, `SALVAGE_COST_FACTOR` 2).
- No saves, no keep-or-retire review note (Robert's call after he plays), no restyle.
- Do not change the win rule, the locked Control Room, the dice or Restart from the Tier A directive.
- Do not edit existing tests. No deploys, no protected repos, no player-layer work.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline with the Tier A directive merged (prototype state): `cd ts && npx vitest run test_wire_rust_run.ts test_wire_rust_ui.ts` gives `Test Files  2 passed (2)` / `Tests  11 passed (11)`.

After editing:
```
cd ts && npx vitest run test_wire_rust_deck.ts test_wire_rust_run.ts test_wire_rust_ui.ts
```
Real prototype tail: `Test Files  3 passed (3)` / `Tests  19 passed (19)` (8 new). The Tier A headless test (40 seeds x 2 strategies) must still pass: scrapped parts never reduce the deck below 4, so a full hand is always drawn and every run still ends.
```
uv run pytest tests/test_wire_rust.py -q
```
Expected `4 passed` (Lua is untouched).
Type check, prints nothing when clean: `cd ts && npx tsc --noEmit` (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).
Source check (Grep tool): `App.tsx` contains `Salvage Bench` once.

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

- [ ] `deck.ts` exists as pasted; `run.ts` is replaced; `App.tsx` has the four edits.
- [ ] In a salvage room the Salvage Bench shows prices (twice the scrap value), buying costs scrap and raises the Deck count by one; elsewhere the bench is absent.
- [ ] A lost fight logs "was scrapped" and lowers the Deck count by one (never below 4); a won fight leaves the deck unchanged.
- [ ] The three-file vitest command and the pytest line pass (real tails pasted); `cd ts && npx tsc --noEmit` prints nothing.
- [ ] No file outside the Scope list changed (no Lua); the Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files and the real test counts. Evidence second: the real tails. State what you observed, not hoped, about balance (the headless runs show wins and losses both reachable; whether it is fun is Robert's five-run judgment).
**Controller finish (after merge):** `cd ts && npm run build:wire_rust`, then screenshots of a salvage room with the bench and of the log line after a scrapped part.
Recommended action: review, merge. Then Robert plays five runs and decides keep or retire (`DIRECTION.md` Phase 3).

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or the demo-lists snapshot fixture under `tests/fixtures/`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin-any |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:29 · robert-claude-laptop · none → Queued
- 2026-10-08 17:47 · robert-claude-laptop · Queued → Approved — dispatch deferred to work-tower
- 2026-10-08 17:50 · robert-claude-laptop · assignee devin-tower -> devin-any — reassigned to the devin-any pool: Robert meant the Home Tower, which has no host-scoped assignee
<!-- queue:end -->
