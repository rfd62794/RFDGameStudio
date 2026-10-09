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
