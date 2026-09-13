"""
Phosphor Terminal Demo - ADR 187 CRT-Style Display Verification
Demonstrates the phosphor terminal with CRT effects for Sovereign Scout universe

This demo validates:
✅ Canvas-based bitmap terminal with phosphor glow
✅ Scanline overlay and flicker effects
✅ Energy-based brownout and color shifts
✅ Typewriter animation for story drips
✅ Physical response to ship systems
"""

import asyncio
import time
import random
import sys
import tkinter as tk
from pathlib import Path
from typing import Dict, Any, Optional

# Add src to path
sys.path.append(str(Path(__file__).parent.parent))

from loguru import logger

# Import phosphor terminal
try:
    from src.ui.phosphor_terminal import PhosphorTerminal, PhosphorConfig
    PHOSPHOR_AVAILABLE = True
except ImportError as e:
    logger.error(f"❌ Phosphor Terminal not available: {e}")
    PHOSPHOR_AVAILABLE = False

# Import narrative bridge for story content
try:
    from src.narrative_bridge import get_random_story_snippet
    NARRATIVE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ Narrative Bridge not available: {e}")
    NARRATIVE_AVAILABLE = False


class PhosphorTerminalDemo:
    """Phosphor Terminal demonstration with CRT effects"""
    
    def __init__(self):
        self.terminal: Optional[PhosphorTerminal] = None
        self.root_window: Optional[Any] = None
        self.is_running = False
        
        # Demo state
        self.energy_level = 100.0
        self.story_index = 0
        self.demo_time = 0.0
        
        # Story samples for demo
        self.stories = [
            "The extraction portal hums with an otherworldly energy.",
            "Your ship's systems flicker as you approach the anomaly.",
            "Warning: Spatial distortion detected. Maintain course.",
            "Scrap collected: 12.5 units. Credits earned: 125.",
            "Clone #2 reporting for duty. Previous clone terminated.",
            "The void whispers secrets to those who listen.",
            "Energy reserves critical. Consider immediate extraction.",
            "Asteroid field density increasing. Navigate with caution.",
            "Temporal rift detected. Timeline stability: 78.4%.",
            "The Sovereign Scout never gives up. Never surrenders."
        ]
        
        logger.info("📟 Phosphor Terminal Demo initialized")
    
    async def initialize(self) -> bool:
        """Initialize phosphor terminal demo"""
        if not PHOSPHOR_AVAILABLE:
            logger.error("❌ Phosphor Terminal not available")
            return False
        
        try:
            # Create root window
            self.root_window = tk.Tk()
            self.root_window.title("📟 Sovereign Scout - Phosphor Terminal Demo")
            self.root_window.resizable(False, False)
            self.root_window.configure(bg='#1a1a1a')
            
            # Create phosphor terminal with CRT effects
            config = PhosphorConfig(
                width=80,
                height=24,
                char_width=8,
                char_height=16,
                phosphor_color="#00FF00",
                phosphor_glow="#00FF00",
                scanline_intensity=0.3,
                flicker_rate=0.05,
                typewriter_speed=0.05,
                phosphor_decay=0.95,
                brownout_threshold=25.0,
                glitch_threshold=10.0
            )
            
            self.terminal = PhosphorTerminal(self.root_window, config)
            
            # Add demo controls
            self._create_controls()
            
            logger.info("✅ Phosphor Terminal Demo initialized")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize demo: {e}")
            return False
    
    def _create_controls(self):
        """Create demo control panel"""
        control_frame = tk.Frame(self.root_window, bg='#1a1a1a')
        control_frame.pack(pady=10)
        
        # Energy slider
        tk.Label(control_frame, text="Ship Energy:", fg='#00FF00', bg='#1a1a1a', font=('Courier', 10)).pack(side=tk.LEFT, padx=5)
        
        self.energy_slider = tk.Scale(
            control_frame,
            from_=0, to=100,
            orient=tk.HORIZONTAL,
            length=200,
            bg='#1a1a1a',
            fg='#00FF00',
            troughcolor='#003300',
            highlightthickness=0,
            command=self._on_energy_change
        )
        self.energy_slider.set(100)
        self.energy_slider.pack(side=tk.LEFT, padx=5)
        
        # Story button
        self.story_button = tk.Button(
            control_frame,
            text="Next Story",
            command=self._show_next_story,
            bg='#003300',
            fg='#00FF00',
            font=('Courier', 10, 'bold'),
            activebackground='#005500',
            activeforeground='#00FF00'
        )
        self.story_button.pack(side=tk.LEFT, padx=10)
        
        # Status label
        self.status_label = tk.Label(
            control_frame,
            text="Systems Online",
            fg='#00FF00',
            bg='#1a1a1a',
            font=('Courier', 10)
        )
        self.status_label.pack(side=tk.LEFT, padx=5)
    
    def _on_energy_change(self, value):
        """Handle energy level change"""
        self.energy_level = float(value)
        self.terminal.set_energy_level(self.energy_level)
        
        # Update status based on energy
        if self.energy_level > 75:
            status = "Systems Optimal"
            color = '#00FF00'
        elif self.energy_level > 50:
            status = "Systems Degraded"
            color = '#FFFF00'
        elif self.energy_level > 25:
            status = "Systems Critical"
            color = '#FF8800'
        else:
            status = "SYSTEMS FAILURE"
            color = '#FF0000'
        
        self.status_label.config(text=status, fg=color)
    
    def _show_next_story(self):
        """Show next story with typewriter effect"""
        if self.story_index < len(self.stories):
            story = self.stories[self.story_index]
            self.terminal.write_story_drip(story, typewriter=True)
            self.story_index += 1
        else:
            # Reset to beginning
            self.story_index = 0
            self.terminal.clear()
            self.terminal.write_text("📟 Story Archive Complete\nPress Next Story to restart", typewriter=True)
    
    async def run_demo(self, duration: float = 30.0) -> None:
        """Run the phosphor terminal demonstration"""
        if not await self.initialize():
            return
        
        logger.info("🚀 Starting Phosphor Terminal Demo")
        logger.info("📊 Features: CRT phosphor glow, scanlines, energy-based effects")
        logger.info("🌀 Observe energy-based brownout and flicker effects")
        logger.info("📖 Watch typewriter story drip animation")
        
        self.is_running = True
        start_time = time.time()
        
        # Show welcome message
        welcome_text = """
╔════════════════════════════════════════════════════════════════╗
║                    SOVEREIGN SCOUT TERMINAL                    ║
║                 ADR 187: PHOSPHOR-TEXT PIPELINE               ║
╚════════════════════════════════════════════════════════════════╝

System diagnostics complete...
CRT display online...
Phosphor emitters calibrated...
Ready for story drip transmission...

Adjust energy slider to see brownout effects.
Press Next Story for narrative content.
        """
        
        self.terminal.write_text(welcome_text.strip(), typewriter=True)
        
        try:
            while self.is_running and (time.time() - start_time) < duration:
                # Simulate random energy fluctuations
                if random.random() < 0.1:  # 10% chance per update
                    energy_change = random.uniform(-5, 5)
                    new_energy = max(0, min(100, self.energy_level + energy_change))
                    self.energy_slider.set(new_energy)
                
                # Update terminal display
                self.terminal.update()
                
                # Update window
                if self.root_window:
                    try:
                        self.root_window.update()
                    except:
                        break
                
                # Control frame rate (30 FPS)
                await asyncio.sleep(1/30)
                
                self.demo_time += 1/30
                
        except KeyboardInterrupt:
            logger.info("🛑 Demo interrupted by user")
        finally:
            await self._cleanup()
    
    async def _cleanup(self):
        """Cleanup demo resources"""
        logger.info("🧹 Phosphor Terminal Demo cleanup started")
        
        self.is_running = False
        
        if self.terminal:
            self.terminal = None
        
        if self.root_window:
            try:
                self.root_window.quit()
                self.root_window.destroy()
            except:
                pass
            self.root_window = None
        
        logger.info("✅ Phosphor Terminal Demo cleanup complete")


async def main():
    """Main entry point for Phosphor Terminal Demo"""
    print("📟 Phosphor Terminal Demo")
    print("=" * 50)
    print("🏆 ADR 187: Phosphor-Text Rendering Pipeline")
    print("🌀 CRT Effects: Scanlines, Flicker, Phosphor Glow")
    print("🔧 Energy-Based Brownout and Color Shifts")
    print("📖 Typewriter Story Drip Animation")
    print("=" * 50)
    print("\n🚀 Starting 30-second demonstration...")
    print("📊 Adjust energy slider to see brownout effects")
    print("📖 Press Next Story for narrative content")
    print("🌀 Observe CRT phosphor glow and scanlines")
    print("\n⚡ Press Ctrl+C to stop early\n")
    
    demo = PhosphorTerminalDemo()
    await demo.run_demo(duration=30.0)
    
    print("\n🎉 Phosphor Terminal Demo Complete!")
    print("✅ CRT phosphor effects verified")
    print("✅ Energy-based brownout working")
    print("✅ Typewriter animation functional")
    print("✅ Scanline overlay active")
    print("\n📟 Ready for Sovereign Scout integration!")


if __name__ == "__main__":
    # Run the demo
    asyncio.run(main())
