"""
Character Sprite System - ADR 106: Visual-Mechanical Convergence
16x16 Metasprite system with idle and walk animations
"""

import tkinter as tk
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import math
import time


class AnimationState(Enum):
    """Character animation states"""
    IDLE = "idle"
    WALKING = "walking"
    INTERACTING = "interacting"


@dataclass
class SpriteFrame:
    """Single animation frame"""
    image: tk.PhotoImage
    duration: float  # seconds
    offset_x: int = 0
    offset_y: int = 0


@dataclass
class Animation:
    """Complete animation sequence"""
    name: str
    frames: List[SpriteFrame]
    loop: bool = True
    frame_rate: float = 4.0  # FPS


class CharacterSprite:
    """16x16 character sprite with animation support"""
    
    def __init__(self, sprite_id: str, character_type: str = "mystic"):
        self.sprite_id = sprite_id
        self.character_type = character_type
        self.current_state = AnimationState.IDLE
        self.current_frame_index = 0
        self.last_frame_time = time.time()
        self.animation_start_time = time.time()
        
        # Animation registry
        self.animations: Dict[AnimationState, Animation] = {}
        
        # Create sprite animations
        self._create_metasprite_animations()
    
    def _create_metasprite_animations(self) -> None:
        """Create 16x16 metasprite animations"""
        if self.character_type == "mystic":
            self._create_mystic_animations()
        elif self.character_type == "warrior":
            self._create_warrior_animations()
        else:
            self._create_default_animations()
    
    def _create_mystic_animations(self) -> None:
        """Create mystic-style character animations (robes, staff)"""
        # Mystic color palette - deep blues and purples
        primary_color = "#4a5c8a"  # Mystic blue
        secondary_color = "#7b4397"  # Mystic purple
        accent_color = "#ffd700"  # Gold accent
        
        # Create idle animation (2-frame breathing)
        idle_frames = []
        for frame_num in range(2):
            sprite = self._create_mystic_idle_frame(frame_num, primary_color, secondary_color, accent_color)
            idle_frames.append(SpriteFrame(
                image=sprite,
                duration=0.5,  # 2 FPS for breathing
                offset_x=0,
                offset_y=-1 if frame_num == 1 else 0  # Slight bob
            ))
        
        self.animations[AnimationState.IDLE] = Animation(
            name="idle",
            frames=idle_frames,
            loop=True,
            frame_rate=2.0
        )
        
        # Create walk animation (4-frame)
        walk_frames = []
        for frame_num in range(4):
            sprite = self._create_mystic_walk_frame(frame_num, primary_color, secondary_color, accent_color)
            walk_frames.append(SpriteFrame(
                image=sprite,
                duration=0.25,  # 4 FPS for walking
                offset_x=0,
                offset_y=0
            ))
        
        self.animations[AnimationState.WALKING] = Animation(
            name="walking",
            frames=walk_frames,
            loop=True,
            frame_rate=4.0
        )
        
        # Create interact animation (staff raise)
        interact_frames = []
        for frame_num in range(3):
            sprite = self._create_mystic_interact_frame(frame_num, primary_color, secondary_color, accent_color)
            interact_frames.append(SpriteFrame(
                image=sprite,
                duration=0.3,
                offset_x=0,
                offset_y=-2 if frame_num == 1 else 0  # Staff raise effect
            ))
        
        self.animations[AnimationState.INTERACTING] = Animation(
            name="interacting",
            frames=interact_frames,
            loop=False,
            frame_rate=3.33
        )
    
    def _create_mystic_idle_frame(self, frame_num: int, primary: str, secondary: str, accent: str) -> tk.PhotoImage:
        """Create mystic idle animation frame"""
        sprite = tk.PhotoImage(width=16, height=16)
        
        # Base pixel art for mystic character
        # Frame 0: Resting pose
        # Frame 1: Slight breathing expansion
        
        # Head (8x8 at top)
        head_y = 2
        for y in range(head_y, head_y + 6):
            for x in range(4, 12):
                if y == head_y or y == head_y + 5:  # Top/bottom of head
                    sprite.put(primary, (x, y))
                elif x == 4 or x == 11:  # Sides of head
                    sprite.put(primary, (x, y))
                else:
                    sprite.put("#f4e4c1", (x, y))  # Skin tone
        
        # Robe body
        robe_start_y = head_y + 6
        robe_width = 8 if frame_num == 0 else 9  # Breathing expansion
        robe_start_x = 4 if frame_num == 0 else 3
        
        for y in range(robe_start_y, 14):
            for x in range(robe_start_x, robe_start_x + robe_width):
                if y == 13:  # Bottom of robe
                    sprite.put(primary, (x, y))
                elif x == robe_start_x or x == robe_start_x + robe_width - 1:  # Sides
                    sprite.put(primary, (x, y))
                else:
                    sprite.put(secondary, (x, y))
        
        # Staff (vertical line on right side)
        staff_x = 13
        for y in range(4, 14):
            sprite.put("#8b4513", (staff_x, y))  # Brown staff
        
        # Staff crystal (top)
        sprite.put(accent, (staff_x, 3))
        
        # Scale for display (4x)
        return sprite.zoom(4, 4)
    
    def _create_mystic_walk_frame(self, frame_num: int, primary: str, secondary: str, accent: str) -> tk.PhotoImage:
        """Create mystic walk animation frame"""
        sprite = tk.PhotoImage(width=16, height=16)
        
        # Head (same as idle)
        head_y = 2
        for y in range(head_y, head_y + 6):
            for x in range(4, 12):
                if y == head_y or y == head_y + 5:
                    sprite.put(primary, (x, y))
                elif x == 4 or x == 11:
                    sprite.put(primary, (x, y))
                else:
                    sprite.put("#f4e4c1", (x, y))
        
        # Robe with walking sway
        robe_start_y = head_y + 6
        sway_offset = [0, 1, 0, -1][frame_num]  # Walking sway pattern
        
        for y in range(robe_start_y, 14):
            for x in range(4, 12):
                robe_x = x + sway_offset
                if 0 <= robe_x < 16:
                    if y == 13:
                        sprite.put(primary, (robe_x, y))
                    elif robe_x == 4 + sway_offset or robe_x == 11 + sway_offset:
                        sprite.put(primary, (robe_x, y))
                    else:
                        sprite.put(secondary, (robe_x, y))
        
        # Staff with walking motion
        staff_x = 13 + sway_offset
        for y in range(4, 14):
            if 0 <= staff_x < 16:
                sprite.put("#8b4513", (staff_x, y))
        
        # Staff crystal
        if 0 <= staff_x < 16:
            sprite.put(accent, (staff_x, 3))
        
        return sprite.zoom(4, 4)
    
    def _create_mystic_interact_frame(self, frame_num: int, primary: str, secondary: str, accent: str) -> tk.PhotoImage:
        """Create mystic interact animation frame (staff raise)"""
        sprite = tk.PhotoImage(width=16, height=16)
        
        # Head (tilted up slightly)
        head_y = 1 if frame_num == 1 else 2
        for y in range(head_y, head_y + 6):
            for x in range(4, 12):
                if y == head_y or y == head_y + 5:
                    sprite.put(primary, (x, y))
                elif x == 4 or x == 11:
                    sprite.put(primary, (x, y))
                else:
                    sprite.put("#f4e4c1", (x, y))
        
        # Robe (same as idle)
        robe_start_y = head_y + 6
        for y in range(robe_start_y, 14):
            for x in range(4, 12):
                if y == 13:
                    sprite.put(primary, (x, y))
                elif x == 4 or x == 11:
                    sprite.put(primary, (x, y))
                else:
                    sprite.put(secondary, (x, y))
        
        # Staff raised for interaction
        staff_x = 13
        staff_height = [10, 8, 10][frame_num]  # Raise and lower
        staff_start_y = 14 - staff_height
        
        for y in range(staff_start_y, 14):
            sprite.put("#8b4513", (staff_x, y))
        
        # Glowing crystal during interaction
        glow_colors = [accent, "#ffff00", accent][frame_num]
        sprite.put(glow_colors, (staff_x, staff_start_y - 1))
        
        return sprite.zoom(4, 4)
    
    def _create_warrior_animations(self) -> None:
        """Create warrior-style character animations"""
        # Warrior color palette - steel and leather
        primary_color = "#708090"  # Steel gray
        secondary_color = "#8b4513"  # Leather brown
        accent_color = "#ffd700"  # Gold trim
        
        # Placeholder - create simple warrior sprites
        self._create_default_animations_with_colors(primary_color, secondary_color, accent_color)
    
    def _create_default_animations(self) -> None:
        """Create default character animations"""
        self._create_default_animations_with_colors("#4a5c8a", "#7b4397", "#ffd700")
    
    def _create_default_animations_with_colors(self, primary: str, secondary: str, accent: str) -> None:
        """Create animations with custom colors"""
        # Simple colored rectangle animations as fallback
        idle_frames = []
        for frame_num in range(2):
            sprite = tk.PhotoImage(width=16, height=16)
            color = primary if frame_num == 0 else secondary
            for y in range(16):
                for x in range(16):
                    sprite.put(color, (x, y))
            idle_frames.append(SpriteFrame(image=sprite.zoom(4, 4), duration=0.5))
        
        self.animations[AnimationState.IDLE] = Animation(
            name="idle", frames=idle_frames, loop=True, frame_rate=2.0
        )
        
        # Simple walk animation
        walk_frames = []
        for frame_num in range(4):
            sprite = tk.PhotoImage(width=16, height=16)
            for y in range(16):
                for x in range(16):
                    sprite.put(primary, (x, y))
            walk_frames.append(SpriteFrame(image=sprite.zoom(4, 4), duration=0.25))
        
        self.animations[AnimationState.WALKING] = Animation(
            name="walking", frames=walk_frames, loop=True, frame_rate=4.0
        )
    
    def set_state(self, state: AnimationState) -> None:
        """Set current animation state"""
        if state != self.current_state:
            self.current_state = state
            self.current_frame_index = 0
            self.animation_start_time = time.time()
            self.last_frame_time = time.time()
    
    def get_current_frame(self) -> Optional[tk.PhotoImage]:
        """Get current animation frame"""
        if self.current_state not in self.animations:
            return None
        
        animation = self.animations[self.current_state]
        if not animation.frames:
            return None
        
        # Update frame based on time
        current_time = time.time()
        frame_duration = 1.0 / animation.frame_rate
        
        if current_time - self.last_frame_time >= frame_duration:
            self.current_frame_index += 1
            self.last_frame_time = current_time
            
            # Handle loop vs one-shot animations
            if self.current_frame_index >= len(animation.frames):
                if animation.loop:
                    self.current_frame_index = 0
                else:
                    self.current_frame_index = len(animation.frames) - 1
                    # Return to idle after one-shot animation
                    if self.current_state != AnimationState.IDLE:
                        self.set_state(AnimationState.IDLE)
        
        return animation.frames[self.current_frame_index].image
    
    def get_frame_offset(self) -> Tuple[int, int]:
        """Get current frame's pixel offset"""
        if self.current_state not in self.animations:
            return (0, 0)
        
        animation = self.animations[self.current_state]
        if not animation.frames or self.current_frame_index >= len(animation.frames):
            return (0, 0)
        
        frame = animation.frames[self.current_frame_index]
        return (frame.offset_x, frame.offset_y)


class CharacterSpriteRegistry:
    """Registry for character sprite types"""
    
    def __init__(self):
        self.sprites: Dict[str, CharacterSprite] = {}
        self._create_default_sprites()
    
    def _create_default_sprites(self) -> None:
        """Create default character sprite types"""
        self.sprites["voyager"] = CharacterSprite("voyager", "mystic")
        self.sprites["warrior"] = CharacterSprite("warrior", "warrior")
        self.sprites["npc"] = CharacterSprite("npc", "mystic")
    
    def get_sprite(self, sprite_id: str) -> Optional[CharacterSprite]:
        """Get character sprite by ID"""
        return self.sprites.get(sprite_id)
    
    def register_sprite(self, sprite: CharacterSprite) -> None:
        """Register new character sprite"""
        self.sprites[sprite.sprite_id] = sprite


# Factory function
def create_character_sprite(sprite_id: str, character_type: str = "mystic") -> CharacterSprite:
    """Create character sprite with specified type"""
    return CharacterSprite(sprite_id, character_type)


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    
    # Test character sprite system
    root = tk.Tk()
    root.title("Character Sprite Test")
    root.configure(bg='#1a1a1a')
    
    canvas = tk.Canvas(root, width=320, height=320, bg='#0a0a0a')
    canvas.pack(pady=20)
    
    # Create character sprite
    character = create_character_sprite("test_voyager", "mystic")
    
    # Display sprite
    sprite_image = canvas.create_image(160, 160, image=character.get_current_frame())
    
    # Animation controls
    current_state = [AnimationState.IDLE]  # Use list to allow modification in nested function
    state_index = [0]  # Use list to allow modification in nested function
    states = list(AnimationState)
    
    def change_state():
        state_index[0] = (state_index[0] + 1) % len(states)
        current_state[0] = states[state_index[0]]
        character.set_state(current_state[0])
        print(f"Changed to {current_state[0].value}")
    
    def update_animation():
        # Update sprite
        new_frame = character.get_current_frame()
        if new_frame:
            canvas.itemconfig(sprite_image, image=new_frame)
        
        # Update position with offset
        offset_x, offset_y = character.get_frame_offset()
        canvas.coords(sprite_image, 160 + offset_x, 160 + offset_y)
        
        root.after(50, update_animation)  # 20 FPS
    
    # Controls
    control_frame = tk.Frame(root, bg='#1a1a1a')
    control_frame.pack()
    
    tk.Button(control_frame, text="Change State", command=change_state).pack(side=tk.LEFT, padx=5)
    tk.Label(control_frame, text=f"Current: {current_state[0].value}", bg='#1a1a1a', fg='white').pack(side=tk.LEFT, padx=5)
    
    # Start animation
    update_animation()
    
    print("🎮 Character Sprite Test - Close window to exit")
    root.mainloop()
