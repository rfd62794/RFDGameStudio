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
