# Space Trader Demo

Provides a simple economic simulation and travel network. The current iteration operates as a terminal REPL testing the underlying world economy and cargo models before layering a Pygame UI.

## Tech Debt / Future Harvest Targets
This demo scaffolds several modules that are explicitly destined to become shared systems when **Dungeon Crawler** comes online. They are located here temporarily to prevent "pre-harvesting" tech debt for a demo that does not yet exist.

### `src/shared/economy/` Candidates
- **`economy.market`**: Trading mechanics, buy/sell validations.
- **`economy.price_model`**: Fluctuation algorithms and baseline modifier logic.
- **`economy.cargo`**: The generalized `CargoHold` (inventory weight/slot abstraction) will be critical for Dungeon Crawler loot tables.

### `src/shared/world/` Candidates
- **`world.location_graph`**: Graph traversal and procedural graph linking is heavily reusable for multi-room D20 dungeon structures.
