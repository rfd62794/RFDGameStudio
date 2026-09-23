# Wire & Rust — Design GDD
*September 2026 | New Prototype Deck-Building Game. Chapter 2 of the five-chapter demo canon.*

---

## Vision

Survival in the scrapyard requires parts, steel, and a cold calculations loop. 'Wire & Rust' is a turn-based deck builder where your deck IS your salvage pile. Players navigate through a series of hazardous scrapyard rooms, drawing parts/salvage cards to resolve D20 checks against room challenges. Reusing ScrapCrawl's combat and scrap economy skeleton combined with Brewfield's component-chemistry interactions, this prototype presents a systems-driven scrap synergy engine.

---

## Core Loop

1. **Room Exploration**: Navigate through 5-8 rooms per run.
2. **Draw Hand**: At the start of each room, draw 3-5 salvage/part cards.
3. **Synergy / Chemistry**: Reskinned Brewfield chemistry where combining different parts creates powerful synergies (e.g. combining 'Copper' and 'Zinc' parts creates a 'Brass' synergy, giving bonus combat stats).
4. **Encounter Resolution**: Face a room encounter (hostile machines, toxic waste, salvage piles). Player resolves the encounter by selecting a card and rolling a D20 check, modified by the card's stats and synergies, against the room's difficulty.
5. **Deck Evolution**: Finding salvage adds parts/cards to your deck. Failing checks or taking damage destroys parts, thinning your deck.

---

## Design Pillars

- **The Deck is the Inventory**: Every card is a physical piece of scrap in your salvage pile. If your deck runs out of parts, you are left with pure rust, leading to a breakdown (loss).
- **Turn-Based Deliberation**: No real-time input. Every decision—which room to explore, which card to play, when to salvage—is purely strategic.
- **Component Chemistry**: Synergies are determined by the elements in your parts, matching Brewfield's element/component chemistry matrix but reskinned to industrial scrap (Copper, Zinc, Iron, Lead).

---

## Shared Engine Infrastructure

- **`engine/systems/inventory.lua`**: For card/item management (`add_item`, `remove_item`, `has_item`, `count_item`, `use_item`).
- **`engine/primitives/resolution.lua`**: For resolving D20 checks (`resolve_check`) and selecting options/loot (`weighted_choice`, `resolve_contest`).
