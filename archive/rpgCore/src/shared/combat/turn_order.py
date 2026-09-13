class TurnOrderManager:
    """
    Manages turn order for combatants based on a speed stat.
    Ties are broken by insertion order.
    """
    def __init__(self):
        self._combatants: list[tuple[str, int, int]] = []  # (entity_id, speed, insertion_order)
        self._current_index: int = -1
        self._insertion_counter: int = 0

    def add_combatant(self, entity_id: str, speed: int) -> None:
        """Adds a combatant to the initiative queue."""
        # Remove if already exists to update speed
        self.remove_combatant(entity_id)
        
        self._combatants.append((entity_id, speed, self._insertion_counter))
        self._insertion_counter += 1
        self._sort_combatants()
        
        # If we added a combatant before the current index, adjust the index
        # to ensure we don't skip the entity that was at the current index.
        # Note: sorting might shuffle things, but a full recalculation of index
        # based on active entity isn't perfect if the active entity just moved.
        # For simplicity, we assume dynamic additions happen gracefully, usually
        # at start of combat.

    def _sort_combatants(self) -> None:
        # Sort by speed descending, then insertion order ascending
        self._combatants.sort(key=lambda x: (x[1], -x[2]), reverse=True)

    def next_turn(self) -> str | None:
        """Returns the entity_id of the next actor, advancing the turn."""
        if not self._combatants:
            return None
        
        self._current_index = (self._current_index + 1) % len(self._combatants)
        return self._combatants[self._current_index][0]

    def remove_combatant(self, entity_id: str) -> None:
        """Removes a combatant (e.g., when dead). Adjusts turn index if needed."""
        target_idx = -1
        for i, (eid, _, _) in enumerate(self._combatants):
            if eid == entity_id:
                target_idx = i
                break
                
        if target_idx != -1:
            self._combatants.pop(target_idx)
            # If we removed an entity before or at our current index, we must shift the index back
            # so the next call to next_turn() yields the correct *next* entity.
            # E.g. [A(0), B(1)*, C(2)] -> remove A -> [B(0), C(1)]. Old index 1 is now C. 
            # We want the active entity to remain the same visually but the counter needs adjusting.
            if target_idx <= self._current_index and self._current_index > -1:
                self._current_index -= 1

    def reset(self) -> None:
        """Clears the turn order queue."""
        self._combatants.clear()
        self._current_index = -1
        self._insertion_counter = 0

    def get_order(self) -> list[str]:
        """Returns the full turn order preview (ordered list of entity IDs)."""
        return [eid for eid, _, _ in self._combatants]
