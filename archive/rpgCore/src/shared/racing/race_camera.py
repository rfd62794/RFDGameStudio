"""Rubber band camera system for racing scenes.
Follows Mario Kart/Micro Machines camera pattern.
"""

from dataclasses import dataclass

@dataclass
class RaceCamera:
    x: float = 0.0
    zoom_x: float = 1.0
    
    # Tuning constants:
    PADDING_WORLD   = 200    # breathing room each side
    MIN_FRAME_WORLD = 800    # never show less than this
    MAX_FRAME_WORLD = 3000   # beyond: drop last, follow leader
    ZOOM_LERP       = 0.04   # how fast zoom transitions
    CAM_LERP        = 0.06   # how fast camera moves
    
    def update(self, racers: list, 
               screen_width: int, 
               track_left: int):
        
        active = [r for r in racers if not r.finished]
        if not active:
            return
        
        leader_dist = max(r.distance for r in active)
        last_dist   = min(r.distance for r in active)
        gap         = leader_dist - last_dist
        
        if gap > self.MAX_FRAME_WORLD:
            # Leader escaped — follow leader only
            target_x    = leader_dist - screen_width * 0.35
            target_zoom = 1.0
        else:
            # Fit entire pack on screen
            frame_world  = max(self.MIN_FRAME_WORLD,
                              gap + self.PADDING_WORLD * 2)
            target_x     = last_dist - self.PADDING_WORLD
            target_zoom  = screen_width / frame_world
        
        # Smooth transitions — never snap:
        self.x      += (target_x    - self.x)      * self.CAM_LERP
        self.zoom_x += (target_zoom - self.zoom_x) * self.ZOOM_LERP
    
    def to_screen_x(self, world_x: float, 
                    track_left: int) -> int:
        return int((world_x - self.x) * self.zoom_x + track_left)
    
    # Y is never touched by this camera:
    def to_screen_y(self, lane: int,
                    track_top: int,
                    track_height: int) -> int:
        lane_h = track_height / 4
        return int(track_top + (lane + 0.5) * lane_h)
