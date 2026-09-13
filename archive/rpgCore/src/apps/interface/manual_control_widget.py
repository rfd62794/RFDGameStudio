"""
Manual Control Widget - Human Player Control
Provides UI controls for switching from AI to manual control
"""

import tkinter as tk
from tkinter import ttk
from typing import Optional, Callable
from loguru import logger


class ManualControlWidget:
    """Widget for manual control and AI switching"""
    
    def __init__(self, parent_frame: tk.Widget, on_manual_toggle: Optional[Callable[[bool], None]] = None):
        self.parent_frame = parent_frame
        self.on_manual_toggle = on_manual_toggle
        
        # Control state
        self.manual_control_active = False
        
        # Create frame
        self.frame = ttk.LabelFrame(parent_frame, text="Manual Control", padding=10)
        self.frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Create controls
        self._create_controls()
        
        logger.info("🎮 ManualControlWidget initialized")
    
    def _create_controls(self) -> None:
        """Create control widgets"""
        # Manual control toggle
        self.manual_button = ttk.Button(
            self.frame, 
            text="SWAP TO MANUAL", 
            command=self._toggle_manual_control
        )
        self.manual_button.pack(fill=tk.X, pady=5)
        
        # Status display
        self.status_label = ttk.Label(self.frame, text="AI Control Active", font=('Arial', 10, 'bold'))
        self.status_label.pack(anchor=tk.W, pady=5)
        
        # Control instructions
        instructions_frame = ttk.Frame(self.frame)
        instructions_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(instructions_frame, text="Manual Controls:", font=('Arial', 9, 'bold')).pack(anchor=tk.W)
        ttk.Label(instructions_frame, text="W/S - Thrust", font=('Arial', 9)).pack(anchor=tk.W)
        ttk.Label(instructions_frame, text="A/D - Rotate", font=('Arial', 9)).pack(anchor=tk.W)
        ttk.Label(instructions_frame, text="Space - Fire", font=('Arial', 9)).pack(anchor=tk.W)
        
        # Control state display
        self.control_state_label = ttk.Label(self.frame, text="", font=('Arial', 9))
        self.control_state_label.pack(anchor=tk.W, pady=5)
        
        # Bind keyboard events
        self._bind_keyboard()
        
        # Track key states
        self.keys_pressed = set()
        self.manual_thrust = 0.0
        self.manual_rotation = 0.0
        self.manual_fire = False
    
    def _bind_keyboard(self) -> None:
        """Bind keyboard events for manual control"""
        self.parent_frame.bind('<KeyPress>', self._on_key_press)
        self.parent_frame.bind('<KeyRelease>', self._on_key_release)
    
    def _on_key_press(self, event) -> None:
        """Handle key press events"""
        if not self.manual_control_active:
            return
        
        key = event.keysym.lower()
        self.keys_pressed.add(key)
        
        # Update control state
        self._update_control_state()
    
    def _on_key_release(self, event) -> None:
        """Handle key release events"""
        key = event.keysym.lower()
        self.keys_pressed.discard(key)
        
        # Update control state
        self._update_control_state()
    
    def _update_control_state(self) -> None:
        """Update control state based on pressed keys"""
        thrust = 0.0
        rotation = 0.0
        fire = False
        
        if 'w' in self.keys_pressed:
            thrust = 1.0
        elif 's' in self.keys_pressed:
            thrust = -1.0
        
        if 'a' in self.keys_pressed:
            rotation = -1.0
        elif 'd' in self.keys_pressed:
            rotation = 1.0
        
        if 'space' in self.keys_pressed:
            fire = True
        
        # Update manual control values
        self.manual_thrust = thrust
        self.manual_rotation = rotation
        self.manual_fire = fire
        
        # Update display
        self.control_state_label.config(
            text=f"Thrust: {thrust:+.1f} | Rotation: {rotation:+.1f} | Fire: {'ON' if fire else 'OFF'}"
        )
        
        # Notify parent if callback provided
        if self.on_manual_toggle and self.manual_control_active:
            self.on_manual_toggle(True, thrust, rotation, fire)
    
    def _toggle_manual_control(self) -> None:
        """Toggle between AI and manual control"""
        self.manual_control_active = not self.manual_control_active
        
        if self.manual_control_active:
            self.manual_button.config(text="SWAP TO AI")
            self.status_label.config(text="Manual Control Active", foreground='green')
            logger.info("🎮 Manual control activated")
        else:
            self.manual_button.config(text="SWAP TO MANUAL")
            self.status_label.config(text="AI Control Active", foreground='black')
            self.control_state_label.config(text="")
            
            # Reset manual controls
            self.manual_thrust = 0.0
            self.manual_rotation = 0.0
            self.manual_fire = False
            
            logger.info("🤖 AI control activated")
        
        # Notify parent
        if self.on_manual_toggle:
            self.on_manual_toggle(self.manual_control_active)
    
    def get_manual_inputs(self) -> tuple:
        """Get current manual control inputs"""
        return (self.manual_thrust, self.manual_rotation, self.manual_fire)
    
    def is_manual_control_active(self) -> bool:
        """Check if manual control is active"""
        return self.manual_control_active
    
    def set_manual_control(self, active: bool) -> None:
        """Set manual control state programmatically"""
        if self.manual_control_active != active:
            self._toggle_manual_control()


def create_manual_control_widget(parent_frame: tk.Widget, 
                                on_manual_toggle: Optional[Callable[[bool], None]] = None) -> ManualControlWidget:
    """Create a manual control widget"""
    return ManualControlWidget(parent_frame, on_manual_toggle)


# Test function
def test_manual_control_widget():
    """Test the manual control widget"""
    import tkinter as tk
    
    def on_toggle(active: bool, thrust: float = 0.0, rotation: float = 0.0, fire: bool = False):
        if active:
            print(f"🎮 Manual: T={thrust:+.1f} R={rotation:+.1f} F={'ON' if fire else 'OFF'}")
        else:
            print("🤖 AI Control")
    
    # Create test window
    root = tk.Tk()
    root.title("Manual Control Test")
    root.geometry("300x200")
    
    # Create widget
    widget = create_manual_control_widget(root, on_toggle)
    widget.frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
    
    print("🎮 Testing Manual Control Widget")
    print("=" * 40)
    print("Click 'SWAP TO MANUAL' to enable manual control")
    print("Use W/S/A/D/Space keys to control")
    print("Click 'SWAP TO AI' to return to AI control")
    print()
    
    root.mainloop()


if __name__ == "__main__":
    test_manual_control_widget()
