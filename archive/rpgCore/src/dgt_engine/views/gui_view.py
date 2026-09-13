"""
GUI View - Observer of SimulatorHost

The GUI (Tkinter/2D PPU) observes the unified simulator and renders
the game world visually. This is NOT a separate game - it's a visual
perspective on the single simulation.
"""

import asyncio
import tkinter as tk
from tkinter import ttk, Canvas, Frame, Label, Text, Scrollbar
from typing import Optional, Dict, Any
import threading

from loguru import logger

from core.simulator import Observer, ActionResult, SimulatorHost
from game_state import GameState


class GUIView(Observer):
    """
    GUI view that observes the unified simulator.
    
    Renders the 2D PPU visualization of the single simulation.
    """
    
    def __init__(self, simulator: SimulatorHost):
        """Initialize GUI view."""
        self.simulator = simulator
        
        # Tkinter setup
        self.root = tk.Tk()
        self.root.title("DGT Perfect Simulator - GUI View")
        self.root.geometry("1024x768")
        
        # GUI components
        self.canvas: Optional[Canvas] = None
        self.narrative_text: Optional[Text] = None
        self.stats_frame: Optional[Frame] = None
        
        # Display state
        self.current_state: Optional[GameState] = None
        self.last_action_result: Optional[ActionResult] = None
        
        # Threading for async operations
        self.running = False
        self.update_thread: Optional[threading.Thread] = None
        
        self._setup_ui()
        
        logger.info("🖼️ GUIView initialized - Observer of SimulatorHost")
    
    def _setup_ui(self) -> None:
        """Setup the GUI components."""
        # Main container
        main_frame = Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left panel - Game viewport (70%)
        left_frame = Frame(main_frame)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        viewport_label = Label(left_frame, text="2D PPU Viewport", font=("Arial", 12, "bold"))
        viewport_label.pack()
        
        self.canvas = Canvas(left_frame, bg="black", width=700, height=500)
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
        # Right panel - Narrative and stats (30%)
        right_frame = Frame(main_frame, width=300)
        right_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(10, 0))
        right_frame.pack_propagate(False)
        
        # Stats frame
        self.stats_frame = ttk.LabelFrame(right_frame, text="Player Stats", padding=10)
        self.stats_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Narrative frame
        narrative_label = Label(right_frame, text="Narrative Log", font=("Arial", 12, "bold"))
        narrative_label.pack()
        
        # Text widget with scrollbar
        text_frame = Frame(right_frame)
        text_frame.pack(fill=tk.BOTH, expand=True)
        
        self.narrative_text = Text(text_frame, wrap=tk.WORD, width=35, height=20)
        scrollbar = Scrollbar(text_frame, orient=tk.VERTICAL, command=self.narrative_text.yview)
        self.narrative_text.configure(yscrollcommand=scrollbar.set)
        
        self.narrative_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Input frame at bottom
        input_frame = Frame(right_frame)
        input_frame.pack(fill=tk.X, pady=(10, 0))
        
        input_label = Label(input_frame, text="Action:")
        input_label.pack(side=tk.LEFT)
        
        self.input_var = tk.StringVar()
        input_entry = ttk.Entry(input_frame, textvariable=self.input_var, width=25)
        input_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(5, 0))
        input_entry.bind('<Return>', self._on_input_submit)
        
        # Initial canvas render
        self._render_empty_viewport()
    
    def _render_empty_viewport(self) -> None:
        """Render empty viewport."""
        if self.canvas:
            self.canvas.delete("all")
            # Draw placeholder
            self.canvas.create_text(
                350, 250,
                text="2D PPU Viewport\nWaiting for simulation...",
                fill="white",
                font=("Arial", 16),
                anchor="center"
            )
    
    def _update_stats_display(self, state: GameState) -> None:
        """Update player stats display."""
        if not self.stats_frame or not state:
            return
        
        # Clear existing widgets
        for widget in self.stats_frame.winfo_children():
            widget.destroy()
        
        # HP
        hp_frame = Frame(self.stats_frame)
        hp_frame.pack(fill=tk.X, pady=2)
        Label(hp_frame, text="❤️ HP:", font=("Arial", 10)).pack(side=tk.LEFT)
        Label(hp_frame, text=f"{state.player.hp}/{state.player.max_hp}", 
              font=("Arial", 10, "bold")).pack(side=tk.LEFT)
        
        # Gold
        gold_frame = Frame(self.stats_frame)
        gold_frame.pack(fill=tk.X, pady=2)
        Label(gold_frame, text="💰 Gold:", font=("Arial", 10)).pack(side=tk.LEFT)
        Label(gold_frame, text=str(state.player.gold), 
              font=("Arial", 10, "bold")).pack(side=tk.LEFT)
        
        # Turn count
        turn_frame = Frame(self.stats_frame)
        turn_frame.pack(fill=tk.X, pady=2)
        Label(turn_frame, text="🔄 Turn:", font=("Arial", 10)).pack(side=tk.LEFT)
        Label(turn_frame, text=str(state.turn_count), 
              font=("Arial", 10, "bold")).pack(side=tk.LEFT)
        
        # Current location
        room_frame = Frame(self.stats_frame)
        room_frame.pack(fill=tk.X, pady=2)
        Label(room_frame, text="📍 Location:", font=("Arial", 10)).pack(side=tk.LEFT)
        Label(room_frame, text=state.current_room, 
              font=("Arial", 10, "bold")).pack(side=tk.LEFT)
    
    def _render_game_viewport(self, state: GameState) -> None:
        """Render the 2D game viewport."""
        if not self.canvas or not state:
            return
        
        self.canvas.delete("all")
        
        # Get current room
        room = state.rooms.get(state.current_room)
        if not room:
            self._render_empty_viewport()
            return
        
        # Simple tile-based rendering
        tile_size = 20
        viewport_width = 700
        viewport_height = 500
        
        # Calculate grid dimensions
        grid_width = viewport_width // tile_size
        grid_height = viewport_height // tile_size
        
        # Draw floor tiles
        for x in range(grid_width):
            for y in range(grid_height):
                x1 = x * tile_size
                y1 = y * tile_size
                x2 = x1 + tile_size
                y2 = y1 + tile_size
                
                # Simple floor pattern
                color = "#2a2a2a" if (x + y) % 2 == 0 else "#1a1a1a"
                self.canvas.create_rectangle(x1, y1, x2, y2, fill=color, outline="")
        
        # Draw room boundaries
        self.canvas.create_rectangle(
            50, 50, viewport_width - 50, viewport_height - 50,
            outline="#666666", width=2
        )
        
        # Draw NPCs
        npc_x = 150
        for i, npc in enumerate(room.npcs):
            npc_y = 100 + i * 60
            
            # NPC representation
            npc_color = {
                "neutral": "#4a4a4a",
                "hostile": "#8b0000", 
                "distracted": "#ff8c00",
                "charmed": "#ff69b4",
                "dead": "#2f2f2f"
            }.get(npc.state, "#4a4a4a")
            
            self.canvas.create_oval(
                npc_x - 15, npc_y - 15, npc_x + 15, npc_y + 15,
                fill=npc_color, outline="white", width=1
            )
            
            # NPC name
            self.canvas.create_text(
                npc_x, npc_y + 25,
                text=npc.name,
                fill="white",
                font=("Arial", 8),
                anchor="center"
            )
        
        # Draw player
        player_x = viewport_width // 2
        player_y = viewport_height - 100
        
        self.canvas.create_rectangle(
            player_x - 10, player_y - 10, player_x + 10, player_y + 10,
            fill="#0066cc", outline="white", width=2
        )
        
        self.canvas.create_text(
            player_x, player_y + 20,
            text="PLAYER",
            fill="white",
            font=("Arial", 8, "bold"),
            anchor="center"
        )
        
        # Draw room items
        item_x = viewport_width - 150
        for i, item in enumerate(room.items[:5]):  # Limit to 5 items
            item_y = 100 + i * 40
            
            self.canvas.create_rectangle(
                item_x - 8, item_y - 8, item_x + 8, item_y + 8,
                fill="#8b4513", outline="#deb887", width=1
            )
            
            self.canvas.create_text(
                item_x, item_y + 15,
                text=item[:10],  # Truncate long names
                fill="white",
                font=("Arial", 7),
                anchor="center"
            )
        
        # Draw exits
        exit_positions = {
            "north": (viewport_width // 2, 30),
            "south": (viewport_width // 2, viewport_height - 30),
            "east": (viewport_width - 30, viewport_height // 2),
            "west": (30, viewport_height // 2)
        }
        
        for direction, room_id in room.exits.items():
            if direction in exit_positions:
                x, y = exit_positions[direction]
                self.canvas.create_rectangle(
                    x - 20, y - 10, x + 20, y + 10,
                    fill="#004400", outline="#00ff00", width=2
                )
                self.canvas.create_text(
                    x, y,
                    text=direction.upper(),
                    fill="white",
                    font=("Arial", 8, "bold"),
                    anchor="center"
                )
    
    def _on_input_submit(self, event) -> None:
        """Handle input submission."""
        player_input = self.input_var.get().strip()
        if not player_input:
            return
        
        # Clear input
        self.input_var.set("")
        
        # Submit to simulator
        self.simulator.submit_action(player_input)
    
    def on_state_changed(self, state: GameState) -> None:
        """Called when game state changes."""
        self.current_state = state
        
        # Update displays in main thread
        if self.running:
            self.root.after(0, lambda: self._update_stats_display(state))
            self.root.after(0, lambda: self._render_game_viewport(state))
    
    def on_action_result(self, result: ActionResult) -> None:
        """Called when an action is processed."""
        self.last_action_result = result
        
        # Update narrative display
        if self.running and self.narrative_text:
            self.root.after(0, lambda: self._add_narrative_entry(result))
    
    def on_narrative_generated(self, prose: str) -> None:
        """Called when narrative is generated."""
        # This is handled by on_action_result
        pass
    
    def on_simulator_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Handle simulator events (scene transitions, etc.)."""
        if event_type == "scene_transition":
            # Display cinematic transition in narrative
            message = data.get("message", "--- SCENE TRANSITION ---")
            self._add_text_entry(f"[CINEMATIC] {message}")
            
        elif event_type == "scene_lock_released":
            # Display location context when scene lock releases
            location = data.get("location", "Unknown Location")
            self._add_text_entry(f"[LOCATION] Now in: {location}")
            
        elif event_type == "portal_transition":
            # Display portal transition
            environment = data.get("environment", "Unknown")
            location = data.get("location", "Unknown")
            self._add_text_entry(f"[PORTAL] Transition to {location}")
            
        elif event_type == "landmark_interaction":
            # Display landmark interaction
            landmark = data.get("landmark", "Unknown")
            interaction_type = data.get("type", "Unknown")
            self._add_text_entry(f"[INTERACTION] {landmark} ({interaction_type})")
    
    def _add_text_entry(self, text: str) -> None:
        """Add plain text entry to the narrative log."""
        if not self.narrative_text or not self.running:
            return
        
        try:
            # Add entry with timestamp
            timestamp = f"[EVENT]"
            entry = f"{timestamp} {text}\n"
            
            # Use after_idle to ensure thread safety
            self.root.after_idle(lambda: self._safe_insert_text(entry))
        except Exception as e:
            logger.error(f"❌ Failed to add text entry: {e}")
    
    def _safe_insert_text(self, entry: str) -> None:
        """Safely insert text in the main thread."""
        try:
            if self.narrative_text and self.running:
                self.narrative_text.insert(tk.END, entry)
                self.narrative_text.see(tk.END)
        except Exception as e:
            logger.error(f"❌ Failed to insert text: {e}")

    def _add_narrative_entry(self, result: ActionResult) -> None:
        """Add narrative entry to the log."""
        if not self.narrative_text:
            return
        
        # Add timestamp and intent
        timestamp = f"[Turn {result.turn_count}]"
        intent_text = f"Intent: {result.intent}"
        
        # Add entry
        self.narrative_text.insert(tk.END, f"{timestamp}\n", "timestamp")
        self.narrative_text.insert(tk.END, f"{intent_text}\n", "intent")
        self.narrative_text.insert(tk.END, f"{result.prose}\n\n", "narrative")
        
        # Configure tags
        self.narrative_text.tag_config("timestamp", foreground="gray")
        self.narrative_text.tag_config("intent", foreground="cyan", font=("Arial", 9, "bold"))
        self.narrative_text.tag_config("narrative", foreground="white")
        
        # Scroll to bottom
        self.narrative_text.see(tk.END)
    
    def _update_loop(self) -> None:
        """Background update loop for GUI."""
        while self.running and self.simulator.is_running():
            try:
                # GUI updates are handled by observer callbacks
                # This loop just keeps the thread alive
                asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"❌ GUI update loop error: {e}")
                break
    
    def start(self) -> None:
        """Start the GUI view."""
        self.running = True
        
        # Start update thread
        self.update_thread = threading.Thread(target=self._update_loop, daemon=True)
        self.update_thread.start()
        
        # Start Tkinter main loop
        try:
            self.root.mainloop()
        except Exception as e:
            logger.error(f"❌ GUI main loop error: {e}")
        finally:
            self.running = False
            logger.info("🖼️ GUI view stopped")
    
    def stop(self) -> None:
        """Stop the GUI view."""
        self.running = False
        if self.root:
            self.root.quit()
        if self.update_thread and self.update_thread.is_alive():
            self.update_thread.join(timeout=1)
        logger.info("🖼️ GUI view stopped")
