"""Base engine for track-based simulations.
"""

from typing import List, Any

class BaseParticipant:
    def __init__(self, entity: Any):
        self.entity = entity
        self.distance = 0.0
        self.velocity = 0.0
        self.finished = False

    def update(self, dt: float, **kwargs):
        """Must be implemented by subclasses."""
        pass

class BaseEngine:
    def __init__(self, participants: List[BaseParticipant], track: Any):
        self.participants = participants
        self.track = track
        self._finished = False

    def tick(self, dt: float):
        if self._finished:
            return
            
        for p in self.participants:
            if not p.finished:
                self._update_participant(p, dt)
        
        if all(p.finished for p in self.participants):
            self._finished = True

    def _update_participant(self, p: BaseParticipant, dt: float):
        """Hook for specialized update logic."""
        pass

    def is_finished(self) -> bool:
        return self._finished
