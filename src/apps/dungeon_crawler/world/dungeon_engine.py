"""Dungeon Engine for party traversal on a path.
"""

from typing import List
from src.shared.simulation.base_engine import BaseParticipant, BaseEngine
from src.apps.dungeon_crawler.world.dungeon_track import DungeonTrack, DungeonZoneType
from src.shared.teams.roster import RosterSlime

class PartyParticipant(BaseParticipant):
    def __init__(self, slimes: List[RosterSlime]):
        # Use a "leader" or representative slime for engine logic
        leader = slimes[0] if slimes else None
        super().__init__(leader)
        self.slimes = slimes
        self.is_paused = False
        self.last_zone_triggered = None
        
        # Base speed from party average or leader
        self.base_speed = 100.0 # logical units per second

    def update(self, dt: float, **kwargs):
        if self.finished or self.is_paused:
            return
            
        # Autonomous movement
        self.velocity = self.base_speed
        self.distance += self.velocity * dt

class DungeonEngine(BaseEngine):
    def __init__(self, party_slimes: List[RosterSlime], track: DungeonTrack):
        self.party = PartyParticipant(party_slimes)
        super().__init__([self.party], track)
        
    def _update_participant(self, p: PartyParticipant, dt: float):
        # 1. Update distance
        p.update(dt)
        
        # 2. Check for zone triggers
        zone = self.track.get_zone_at(p.distance)
        if zone and zone != p.last_zone_triggered:
            # New zone entered
            self._handle_zone_entry(p, zone)
            
        # 3. Check for finish
        if p.distance >= self.track.total_length:
            p.finished = True
            p.distance = self.track.total_length

    def _handle_zone_entry(self, p: PartyParticipant, zone: Any):
        p.last_zone_triggered = zone
        z_type = zone.zone_type
        
        if z_type in [DungeonZoneType.COMBAT, DungeonZoneType.BOSS, DungeonZoneType.TREASURE]:
            # Pause simulation to resolve event
            p.is_paused = True
            p.velocity = 0.0
            # Event will be picked up by the Scene
