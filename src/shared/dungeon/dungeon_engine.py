from dataclasses import dataclass
from .dungeon_track import DungeonTrack, DungeonZoneType, DungeonZone

@dataclass
class PartyState:
    distance:    float = 0.0
    speed:       float = 60.0   # units per second
    paused:      bool  = False
    pause_reason: str  = ""     # "combat", "rest", "treasure"
    current_zone: DungeonZone = None
    finished:    bool  = False
    rest_timer:  float = 0.0

class DungeonEngine:
    def __init__(self, track: DungeonTrack, 
                 team: list):
        self.track  = track
        self.team   = team
        self.party  = PartyState()
    
    def tick(self, dt: float) -> list[str]:
        # Returns list of events that occurred
        events = []
        
        if self.party.paused or self.party.finished:
            if self.party.pause_reason == "rest":
                self.party.rest_timer -= dt
                if self.party.rest_timer <= 0:
                    # Heal party slightly
                    for slime in self.team:
                        if hasattr(slime, 'current_hp') and hasattr(slime, 'max_hp'):
                            slime.current_hp = min(float(slime.max_hp), slime.current_hp + (slime.max_hp * 0.1))
                    self.resume()
            return events
        
        self.party.distance += self.party.speed * dt
        
        # Check current zone:
        zone = self._get_zone_at(self.party.distance)
        if zone and zone != self.party.current_zone:
            self.party.current_zone = zone
            event = self._enter_zone(zone)
            if event:
                events.append(event)
        
        # Check finished:
        if self.party.distance >= self.track.total_length:
            self.party.finished = True
            events.append("path_complete")
        
        return events
    
    def _get_zone_at(self, dist) -> DungeonZone:
        for zone in self.track.zones:
            if zone.start_dist <= dist <= zone.end_dist:
                return zone
        return None
    
    def _enter_zone(self, zone) -> str:
        if zone.resolved:
            return None
            
        if zone.zone_type == DungeonZoneType.COMBAT:
            self.party.paused = True
            self.party.pause_reason = "combat"
            return "combat_encounter"
        
        if zone.zone_type == DungeonZoneType.REST:
            self.party.paused = True
            self.party.pause_reason = "rest"
            self.party.rest_timer = 2.0
            return "rest_encountered"
        
        if zone.zone_type == DungeonZoneType.TRAP:
            return "trap_triggered"
        
        if zone.zone_type == DungeonZoneType.TREASURE:
            self.party.paused = True
            self.party.pause_reason = "treasure"
            return "treasure_found"
        
        if zone.zone_type == DungeonZoneType.BOSS:
            self.party.paused = True
            self.party.pause_reason = "boss"
            return "boss_encountered"
        
        return None
    
    def resume(self):
        # Called after encounter resolved
        if self.party.current_zone:
            self.party.current_zone.resolved = True
        self.party.paused = False
        self.party.pause_reason = ""
