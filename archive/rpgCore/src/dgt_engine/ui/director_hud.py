"""
Director HUD - Play/Pause/FF Controls

The Director's Heads-Up Display for controlling the autonomous movie experience.
Provides cinematic controls for playback speed, pause, and scene management.

This is the "Director's Chair" interface for the D&D movie.
"""

import tkinter as tk
from tkinter import ttk, Canvas, Frame, Label, Button, Scale
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum

from loguru import logger

from logic.director import DirectorMode, AutonomousDirector
from ui.cinematic_pauses import CinematicPauses
from ui.cinematic_camera import CameraController


class PlaybackSpeed(Enum):
    """Playback speed settings."""
    PAUSE = 0
    SLOW = 0.5
    NORMAL = 1.0
    FAST = 2.0
    VERY_FAST = 4.0


class HUDMode(Enum):
    """HUD display modes."""
    MINIMAL = "minimal"
    STANDARD = "standard"
    DETAILED = "detailed"


@dataclass
class DirectorState:
    """Current state of the Director system."""
    mode: DirectorMode
    playback_speed: float
    is_paused: bool
    current_beacon: Optional[str]
    beacons_completed: int
    total_beacons: int
    cinematic_pauses_active: bool
    camera_mode: str


class DirectorHUD:
    """
    Director's Heads-Up Display for cinematic control.
    
    Provides playback controls, scene management, and real-time status
    for the autonomous movie experience.
    """
    
    def __init__(self, parent: tk.Widget, director: AutonomousDirector, 
                 cinematic_pauses: CinematicPauses, camera_controller: CameraController):
        """
        Initialize Director HUD.
        
        Args:
            parent: Parent widget
            director: Autonomous Director instance
            cinematic_pauses: Cinematic pauses system
            camera_controller: Camera controller
        """
        self.parent = parent
        self.director = director
        self.cinematic_pauses = cinematic_pauses
        self.camera_controller = camera_controller
        
        # HUD state
        self.mode = HUDMode.STANDARD
        self.is_visible = True
        self.auto_hide = False
        self.last_interaction_time = 0.0
        
        # Event callbacks
        self.on_playback_speed_changed: Optional[Callable[[float], None]] = None
        self.on_pause_toggled: Optional[Callable[[bool], None]] = None
        self.on_scene_skip: Optional[Callable[[], None]] = None
        
        # Create HUD widgets
        self._create_hud_widgets()
        
        # Setup event handlers
        self._setup_event_handlers()
        
        # Start update loop
        self._update_display()
        
        logger.info("🎬 Director HUD initialized")
    
    def _create_hud_widgets(self) -> None:
        """Create HUD widget components."""
        # Main HUD frame
        self.hud_frame = Frame(self.parent, bg='black', relief=tk.RAISED, bd=2)
        
        # Top control bar
        self.control_frame = Frame(self.hud_frame, bg='black', height=60)
        self.control_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Playback controls
        self._create_playback_controls()
        
        # Status display
        self._create_status_display()
        
        # Scene controls
        self._create_scene_controls()
        
        # Bottom info bar
        self.info_frame = Frame(self.hud_frame, bg='black', height=40)
        self.info_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Info labels
        self._create_info_labels()
    
    def _create_playback_controls(self) -> None:
        """Create playback control widgets."""
        # Playback control frame
        playback_frame = Frame(self.control_frame, bg='black')
        playback_frame.pack(side=tk.LEFT, padx=10)
        
        # Play/Pause button
        self.play_pause_btn = Button(
            playback_frame,
            text="▶️ Play",
            command=self._toggle_playback,
            bg='#2a2a2a',
            fg='white',
            font=('Arial', 12, 'bold'),
            width=8,
            height=2
        )
        self.play_pause_btn.pack(side=tk.LEFT, padx=2)
        
        # Stop button
        self.stop_btn = Button(
            playback_frame,
            text="⏹️ Stop",
            command=self._stop_playback,
            bg='#2a2a2a',
            fg='white',
            font=('Arial', 10),
            width=6,
            height=2
        )
        self.stop_btn.pack(side=tk.LEFT, padx=2)
        
        # Speed control
        speed_frame = Frame(playback_frame, bg='black')
        speed_frame.pack(side=tk.LEFT, padx=10)
        
        Label(speed_frame, text="Speed:", bg='black', fg='white', font=('Arial', 10)).pack(side=tk.LEFT)
        
        self.speed_scale = Scale(
            speed_frame,
            from_=0,
            to=4,
            orient=tk.HORIZONTAL,
            command=self._on_speed_changed,
            bg='#2a2a2a',
            fg='white',
            highlightbackground='black',
            troughcolor='#1a1a1a',
            activebackground='#4a4a4a',
            length=150
        )
        self.speed_scale.set(1.0)
        self.speed_scale.pack(side=tk.LEFT)
        
        # Speed labels
        speed_labels_frame = Frame(speed_frame, bg='black')
        speed_labels_frame.pack(side=tk.LEFT, padx=5)
        
        Label(speed_labels_frame, text="⏸", bg='black', fg='gray', font=('Arial', 8)).pack()
        Label(speed_labels_frame, text="0.5x", bg='black', fg='gray', font=('Arial', 8)).pack()
        Label(speed_labels_frame, text="1x", bg='black', fg='white', font=('Arial', 8)).pack()
        Label(speed_labels_frame, text="2x", bg='black', fg='gray', font=('Arial', 8)).pack()
        Label(speed_labels_frame, text="4x", bg='black', fg='gray', font=('Arial', 8)).pack()
    
    def _create_status_display(self) -> None:
        """Create status display widgets."""
        # Status frame
        status_frame = Frame(self.control_frame, bg='black')
        status_frame.pack(side=tk.LEFT, padx=20)
        
        # Director mode
        self.mode_label = Label(
            status_frame,
            text="Mode: IDLE",
            bg='black',
            fg='#00ff00',
            font=('Arial', 10, 'bold')
        )
        self.mode_label.pack(anchor=tk.W)
        
        # Current beacon
        self.beacon_label = Label(
            status_frame,
            text="Beacon: None",
            bg='black',
            fg='#ffff00',
            font=('Arial', 9)
        )
        self.beacon_label.pack(anchor=tk.W)
        
        # Pause status
        self.pause_label = Label(
            status_frame,
            text="Pause: None",
            bg='black',
            fg='#ff9900',
            font=('Arial', 9)
        )
        self.pause_label.pack(anchor=tk.W)
    
    def _create_scene_controls(self) -> None:
        """Create scene control widgets."""
        # Scene control frame
        scene_frame = Frame(self.control_frame, bg='black')
        scene_frame.pack(side=tk.RIGHT, padx=10)
        
        # Skip scene button
        self.skip_scene_btn = Button(
            scene_frame,
            text="⏭️ Skip Scene",
            command=self._skip_scene,
            bg='#2a2a2a',
            fg='white',
            font=('Arial', 10),
            width=10
        )
        self.skip_scene_btn.pack(side=tk.LEFT, padx=2)
        
        # Next beacon button
        self.next_beacon_btn = Button(
            scene_frame,
            text="➡️ Next Beacon",
            command=self._next_beacon,
            bg='#2a2a2a',
            fg='white',
            font=('Arial', 10),
            width=10
        )
        self.next_beacon_btn.pack(side=tk.LEFT, padx=2)
        
        # Camera controls
        self.zoom_in_btn = Button(
            scene_frame,
            text="🔍+",
            command=self._zoom_in,
            bg='#2a2a2a',
            fg='white',
            font=('Arial', 8),
            width=3
        )
        self.zoom_in_btn.pack(side=tk.LEFT, padx=1)
        
        self.zoom_out_btn = Button(
            scene_frame,
            text="🔍-",
            command=self._zoom_out,
            bg='#2a2a2a',
            fg='white',
            font=('Arial', 8),
            width=3
        )
        self.zoom_out_btn.pack(side=tk.LEFT, padx=1)
    
    def _create_info_labels(self) -> None:
        """Create information display labels."""
        # Progress info
        self.progress_label = Label(
            self.info_frame,
            text="Progress: 0/0 beacons",
            bg='black',
            fg='#00ffff',
            font=('Arial', 9)
        )
        self.progress_label.pack(side=tk.LEFT, padx=10)
        
        # Time info
        self.time_label = Label(
            self.info_frame,
            text="Time: 00:00",
            bg='black',
            fg='#00ff00',
            font=('Arial', 9)
        )
        self.time_label.pack(side=tk.LEFT, padx=10)
        
        # Camera info
        self.camera_label = Label(
            self.info_frame,
            text="Camera: Follow",
            bg='black',
            fg='#ff00ff',
            font=('Arial', 9)
        )
        self.camera_label.pack(side=tk.LEFT, padx=10)
    
    def _setup_event_handlers(self) -> None:
        """Setup event handlers for Director events."""
        # Director events
        self.director.on_beacon_generated = self._on_beacon_generated
        self.director.on_beacon_achieved = self._on_beacon_achieved
        self.director.on_cinematic_pause = self._on_cinematic_pause
        
        # Cinematic pauses events
        self.cinematic_pauses.on_pause_started = self._on_pause_started
        self.cinematic_pauses.on_pause_ended = self._on_pause_ended
        self.cinematic_pauses.on_dialogue_displayed = self._on_dialogue_displayed
    
    def _toggle_playback(self) -> None:
        """Toggle play/pause state."""
        if self.director.is_paused:
            self.director.resume_cinematic()
            self.play_pause_btn.config(text="⏸️ Pause")
        else:
            self.director.pause_cinematic()
            self.play_pause_btn.config(text="▶️ Play")
        
        if self.on_pause_toggled:
            self.on_pause_toggled(self.director.is_paused)
    
    def _stop_playback(self) -> None:
        """Stop playback completely."""
        self.director.mode = DirectorMode.IDLE
        self.play_pause_btn.config(text="▶️ Play")
        self.speed_scale.set(1.0)
        
        logger.info("🎬 Playback stopped")
    
    def _on_speed_changed(self, value: float) -> None:
        """Handle speed change."""
        speed = float(value)
        self.director.set_playback_speed(speed)
        
        if self.on_playback_speed_changed:
            self.on_playback_speed_changed(speed)
    
    def _skip_scene(self) -> None:
        """Skip current scene/beacon."""
        if self.cinematic_pauses.is_paused:
            self.cinematic_pauses.skip_current_pause()
        
        if self.on_scene_skip:
            self.on_scene_skip()
        
        logger.info("🎬 Scene skipped")
    
    def _next_beacon(self) -> None:
        """Move to next beacon."""
        if self.director.current_beacon:
            self.director.current_beacon.achieved = True
            self.director.mode = DirectorMode.PLANNING
        
        logger.info("🎯 Next beacon requested")
    
    def _zoom_in(self) -> None:
        """Zoom camera in."""
        self.camera_controller.camera.zoom_in()
    
    def _zoom_out(self) -> None:
        """Zoom camera out."""
        self.camera_controller.camera.zoom_out()
    
    def _on_beacon_generated(self, beacon) -> None:
        """Handle beacon generation event."""
        self.beacon_label.config(text=f"Beacon: {beacon.description[:30]}...")
    
    def _on_beacon_achieved(self, beacon) -> None:
        """Handle beacon achievement event."""
        self.beacon_label.config(text="Beacon: Achieved!")
    
    def _on_cinematic_pause(self, message: str) -> None:
        """Handle cinematic pause event."""
        self.pause_label.config(text=f"Pause: {message[:30]}...")
    
    def _on_pause_started(self, pause) -> None:
        """Handle pause started event."""
        self.pause_label.config(text=f"Pause: {pause.pause_type.value}")
    
    def _on_pause_ended(self, pause) -> None:
        """Handle pause ended event."""
        self.pause_label.config(text="Pause: None")
    
    def _on_dialogue_displayed(self, dialogue: str) -> None:
        """Handle dialogue displayed event."""
        self.pause_label.config(text=f"Dialogue: {dialogue[:30]}...")
    
    def _update_display(self) -> None:
        """Update display with current state."""
        # Update mode display
        mode_text = f"Mode: {self.director.mode.value.upper()}"
        mode_color = {
            DirectorMode.IDLE: '#666666',
            DirectorMode.PLANNING: '#ffff00',
            DirectorMode.EXECUTING: '#00ff00',
            DirectorMode.PAUSED: '#ff9900',
            DirectorMode.CINEMATIC: '#ff00ff'
        }.get(self.director.mode, '#ffffff')
        
        self.mode_label.config(text=mode_text, fg=mode_color)
        
        # Update progress
        completed = len([b for b in self.director.beacon_history if b.achieved])
        total = len(self.director.beacon_history)
        self.progress_label.config(text=f"Progress: {completed}/{total} beacons")
        
        # Update camera info
        camera_info = self.camera_controller.get_camera_state()
        camera_mode = camera_info['camera_info']['mode']
        self.camera_label.config(text=f"Camera: {camera_mode}")
        
        # Update button states
        self._update_button_states()
        
        # Schedule next update
        self.parent.after(100, self._update_display)
    
    def _update_button_states(self) -> None:
        """Update button states based on current context."""
        # Update play/pause button
        if self.director.is_paused:
            self.play_pause_btn.config(text="▶️ Play")
        else:
            self.play_pause_btn.config(text="⏸️ Pause")
        
        # Update skip button
        skip_enabled = (
            self.cinematic_pauses.is_paused and 
            self.cinematic_pauses.active_pause and 
            self.cinematic_pauses.active_pause.can_skip
        )
        self.skip_scene_btn.config(state=tk.NORMAL if skip_enabled else tk.DISABLED)
        
        # Update next beacon button
        next_enabled = self.director.current_beacon is not None
        self.next_beacon_btn.config(state=tk.NORMAL if next_enabled else tk.DISABLED)
    
    def show(self) -> None:
        """Show the HUD."""
        self.hud_frame.pack(fill=tk.BOTH, expand=True)
        self.is_visible = True
        logger.debug("🎬 Director HUD shown")
    
    def hide(self) -> None:
        """Hide the HUD."""
        self.hud_frame.pack_forget()
        self.is_visible = False
        logger.debug("🎬 Director HUD hidden")
    
    def toggle_visibility(self) -> None:
        """Toggle HUD visibility."""
        if self.is_visible:
            self.hide()
        else:
            self.show()
    
    def set_mode(self, mode: HUDMode) -> None:
        """Set HUD display mode."""
        self.mode = mode
        
        if mode == HUDMode.MINIMAL:
            # Hide detailed controls
            self.info_frame.pack_forget()
        elif mode == HUDMode.STANDARD:
            # Show standard controls
            self.info_frame.pack(fill=tk.X, padx=5, pady=5)
        elif mode == HUDMode.DETAILED:
            # Show all controls
            self.info_frame.pack(fill=tk.X, padx=5, pady=5)
            # Add detailed info here
        
        logger.debug(f"🎬 HUD mode set to {mode.value}")
    
    def get_director_state(self) -> DirectorState:
        """Get current Director state."""
        return DirectorState(
            mode=self.director.mode,
            playback_speed=self.director.playback_speed,
            is_paused=self.director.is_paused,
            current_beacon=self.director.current_beacon.description if self.director.current_beacon else None,
            beacons_completed=len([b for b in self.director.beacon_history if b.achieved]),
            total_beacons=len(self.director.beacon_history),
            cinematic_pauses_active=self.cinematic_pauses.is_paused,
            camera_mode=self.camera_controller.camera.mode.value
        )


# Factory for creating HUD components
class HUDFactory:
    """Factory for creating HUD components."""
    
    @staticmethod
    def create_director_hud(parent: tk.Widget, director: AutonomousDirector,
                           cinematic_pauses: CinematicPauses, 
                           camera_controller: CameraController) -> DirectorHUD:
        """Create Director HUD."""
        return DirectorHUD(parent, director, cinematic_pauses, camera_controller)
