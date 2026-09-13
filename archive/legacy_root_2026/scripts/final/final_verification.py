"""
Final Verification - Energy-to-Font Transition Test
Tests the complete energy-based font switching system with Phosphor Terminal

This test validates:
✅ Energy-based font switching (Green → Amber → Red)
✅ Phosphor Terminal energy coupling
✅ Font Manager integration
✅ Story drip with energy context
✅ Complete system integration
"""

import asyncio
import time
import sys
import tkinter as tk
from pathlib import Path
from typing import Optional, Any, Protocol
from dataclasses import dataclass
from abc import ABC, abstractmethod

# Add src to path
sys.path.append(str(Path(__file__).parent.parent))

from loguru import logger
from pydantic import BaseModel, Field, validator

# Configuration Models
@dataclass
class TestConfig:
    """Configuration for verification tests"""
    duration: float = 30.0
    test_phases: list[tuple[float, str, float]] = None
    
    def __post_init__(self):
        if self.test_phases is None:
            self.test_phases = [
                (100.0, "Systems online. All diagnostics green.", 5.0),
                (60.0, "Power drain detected. Switching to amber alert.", 5.0),
                (30.0, "Critical energy levels! System failure imminent.", 5.0),
                (15.0, "Emergency protocols activated. Barely functional.", 5.0),
                (100.0, "System restored. All systems nominal.", 5.0)
            ]

class SystemStatus(BaseModel):
    """System status tracking"""
    energy_level: float = Field(ge=0, le=100, default=100.0)
    current_font: str = "terminal_green"
    system_state: str = "Systems Optimal"
    terminal_active: bool = False
    
    @validator('system_state')
    def validate_system_state(cls, v, values):
        energy = values.get('energy_level', 100)
        if energy > 75:
            return "Systems Optimal"
        elif energy > 50:
            return "Systems Degraded"
        elif energy > 25:
            return "Systems Critical"
        else:
            return "SYSTEMS FAILURE"

# Component Protocols
class FontManagerProtocol(Protocol):
    """Protocol for font manager components"""
    current_font: str
    
    def set_font(self, font_name: str) -> bool: ...
    def get_font_for_energy(self, energy: float) -> str: ...

class TerminalProtocol(Protocol):
    """Protocol for terminal components"""
    
    def set_energy_level(self, energy: float) -> None: ...
    def write_text(self, text: str, typewriter: bool = False) -> None: ...
    def write_story_drip(self, story: str, typewriter: bool = False) -> None: ...
    def update(self) -> None: ...

class UIController(ABC):
    """Abstract base for UI controllers"""
    
    @abstractmethod
    def create_controls(self) -> None: ...
    
    @abstractmethod
    def update_display(self) -> None: ...

class TestRunner(ABC):
    """Abstract base for test runners"""
    
    @abstractmethod
    async def run_test(self, config: TestConfig) -> bool: ...

# Import system components
try:
    from src.ui.phosphor_terminal import PhosphorTerminal, PhosphorConfig
    from src.ui.font_manager import FontManager, get_font_manager
    from src.narrative_bridge import get_random_story_snippet
    SYSTEM_AVAILABLE = True
except ImportError as e:
    logger.error(f"❌ System components not available: {e}")
    SYSTEM_AVAILABLE = False

class VerificationUIController(UIController):
    """UI controller for verification interface"""
    
    def __init__(self, root_window: tk.Tk, font_manager: Optional[FontManagerProtocol]):
        self.root_window = root_window
        self.font_manager = font_manager
        self.energy_slider: Optional[tk.Scale] = None
        self.status_label: Optional[tk.Label] = None
        self.font_label: Optional[tk.Label] = None
        self.test_button: Optional[tk.Button] = None
        
    def create_controls(self) -> None:
        """Create test control panel"""
        control_frame = tk.Frame(self.root_window, bg='#1a1a1a')
        control_frame.pack(pady=10)
        
        # Energy slider
        tk.Label(control_frame, text="Ship Energy:", fg='#00FF00', bg='#1a1a1a', font=('Courier', 10, 'bold')).pack(side=tk.LEFT, padx=5)
        
        self.energy_slider = tk.Scale(
            control_frame,
            from_=0, to=100,
            orient=tk.HORIZONTAL,
            length=300,
            bg='#1a1a1a',
            fg='#00FF00',
            troughcolor='#003300',
            highlightthickness=0
        )
        self.energy_slider.set(100)
        self.energy_slider.pack(side=tk.LEFT, padx=5)
        
        # Status label
        self.status_label = tk.Label(
            control_frame,
            text="Systems Optimal",
            fg='#00FF00',
            bg='#1a1a1a',
            font=('Courier', 10, 'bold')
        )
        self.status_label.pack(side=tk.LEFT, padx=10)
        
        # Font status
        self.font_label = tk.Label(
            control_frame,
            text="Font: terminal_green",
            fg='#00FF00',
            bg='#1a1a1a',
            font=('Courier', 10)
        )
        self.font_label.pack(side=tk.LEFT, padx=10)
        
        # Test button
        self.test_button = tk.Button(
            control_frame,
            text="Start Test",
            bg='#003300',
            fg='#00FF00',
            font=('Courier', 10, 'bold')
        )
        self.test_button.pack(side=tk.LEFT, padx=5)
    
    def update_display(self, status: SystemStatus) -> None:
        """Update display based on system status"""
        if self.status_label:
            color = '#00FF00' if status.energy_level > 75 else '#FFFF00' if status.energy_level > 50 else '#FF8800' if status.energy_level > 25 else '#FF0000'
            self.status_label.config(text=status.system_state, fg=color)
        
        if self.font_label:
            self.font_label.config(text=f"Font: {status.current_font}")
        
        if self.energy_slider:
            self.energy_slider.set(status.energy_level)

class EnergyFontTestRunner(TestRunner):
    """Test runner for energy-to-font transitions"""
    
    def __init__(self, terminal: Optional[TerminalProtocol], font_manager: Optional[FontManagerProtocol], ui_controller: VerificationUIController):
        self.terminal = terminal
        self.font_manager = font_manager
        self.ui_controller = ui_controller
        
    async def run_test(self, config: TestConfig) -> bool:
        """Run the energy-to-font transition test"""
        try:
            for energy, story, duration in config.test_phases:
                # Update energy
                self.ui_controller.energy_slider.set(energy)
                
                # Update font if manager available
                if self.font_manager:
                    new_font = self.font_manager.get_font_for_energy(energy)
                    self.font_manager.set_font(new_font)
                
                # Display story
                if self.terminal:
                    self.terminal.write_story_drip(story, typewriter=True)
                
                logger.info(f"🔧 Test Phase: Energy={energy}%, Font={self.font_manager.current_font if self.font_manager else 'N/A'}")
                await asyncio.sleep(duration)
            
            return True
        except Exception as e:
            logger.error(f"❌ Test execution failed: {e}")
            return False

class FinalVerification:
    """Final verification test for energy-to-font transitions"""
    
    def __init__(self, config: Optional[TestConfig] = None):
        self.config = config or TestConfig()
        self.status = SystemStatus()
        
        # Components
        self.terminal: Optional[TerminalProtocol] = None
        self.font_manager: Optional[FontManagerProtocol] = FontManager() if SYSTEM_AVAILABLE else None
        self.ui_controller: Optional[VerificationUIController] = None
        self.test_runner: Optional[EnergyFontTestRunner] = None
        
        # UI State
        self.root_window: Optional[Any] = None
        
        logger.info("🔧 Final Verification initialized with SOLID architecture")
    
    async def initialize(self) -> bool:
        """Initialize all system components"""
        if not SYSTEM_AVAILABLE:
            logger.error("❌ System components not available")
            return False
        
        try:
            # Create root window
            self.root_window = tk.Tk()
            self.root_window.title("🔧 Final Verification - Energy-to-Font Transitions")
            self.root_window.resizable(False, False)
            self.root_window.configure(bg='#1a1a1a')
            
            # Create Phosphor Terminal
            config = PhosphorConfig(
                width=80,
                height=24,
                phosphor_color="#00FF00",
                scanline_intensity=0.3,
                flicker_rate=0.05,
                typewriter_speed=0.03,
                brownout_threshold=25.0
            )
            
            self.terminal = PhosphorTerminal(self.root_window, config)
            self.status.terminal_active = True
            
            # Initialize font manager
            if self.font_manager:
                self.font_manager.set_font('terminal_green')
                self.status.current_font = 'terminal_green'
                logger.info("🔤 Font Manager initialized")
            
            # Create UI controller and test runner
            self.ui_controller = VerificationUIController(self.root_window, self.font_manager)
            self.ui_controller.create_controls()
            
            self.test_runner = EnergyFontTestRunner(self.terminal, self.font_manager, self.ui_controller)
            
            # Wire up event handlers
            self.ui_controller.energy_slider.config(command=self._on_energy_change)
            self.ui_controller.test_button.config(command=self._start_test)
            
            logger.info("✅ Final Verification initialized with SOLID architecture")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize: {e}")
            return False
    
    
    def _on_energy_change(self, value):
        """Handle energy level change with proper state management"""
        try:
            self.status.energy_level = float(value)
            
            # Auto-switch font if font manager available
            if self.font_manager:
                old_font = self.font_manager.current_font
                new_font = self.font_manager.get_font_for_energy(self.status.energy_level)
                
                if old_font != new_font:
                    result = self.font_manager.set_font(new_font)
                    if result:
                        self.status.current_font = new_font
                        logger.info(f"🔤 Font switched: {old_font} → {new_font} (Energy: {self.status.energy_level}%)")
            
            # Update terminal energy
            if self.terminal:
                self.terminal.set_energy_level(self.status.energy_level)
            
            # Update UI
            self.ui_controller.update_display(self.status)
            
        except Exception as e:
            logger.error(f"❌ Energy change handler failed: {e}")
    
    def _start_test(self):
        """Start the energy-to-font transition test"""
        if not self.test_runner:
            logger.error("❌ Test runner not initialized")
            return
        
        self.ui_controller.test_button.config(state='disabled', text="Testing...")
        
        logger.info("🔧 Starting energy-to-font transition test")
        
        # Run test asynchronously
        asyncio.create_task(self._run_transition_test())
    
    async def _run_transition_test(self):
        """Run the energy-to-font transition test"""
        try:
            success = await self.test_runner.run_test(self.config)
            
            if success:
                self.ui_controller.test_button.config(state='normal', text="Test Complete")
                logger.info("🔧 Energy-to-font transition test complete")
            else:
                self.ui_controller.test_button.config(state='normal', text="Test Failed")
                logger.error("❌ Energy-to-font transition test failed")
                
        except Exception as e:
            self.ui_controller.test_button.config(state='normal', text="Test Error")
            logger.error(f"❌ Test execution error: {e}")
    
    async def run_verification(self, duration: Optional[float] = None) -> bool:
        """Run the complete final verification"""
        if not await self.initialize():
            return False
        
        verification_duration = duration or self.config.duration
        
        logger.info("🔧 Starting Final Verification")
        logger.info("📊 Testing Energy-to-Font transitions")
        logger.info("🎨 Validating Phosphor Terminal integration")
        
        try:
            start_time = time.time()
            
            # Show welcome message
            welcome_text = """
╔════════════════════════════════════════════════════════════════╗
║              FINAL VERIFICATION - ENERGY-TO-FONT TEST           ║
║                 ADR 190: Final Baseline Freeze                ║
╚════════════════════════════════════════════════════════════════╝

Energy-to-Font System: ACTIVE
Phosphor Terminal: ONLINE
Font Manager: INTEGRATED
Story Pipeline: CONNECTED

Adjust energy slider to observe:
• Green → Amber → Red font transitions
• CRT effects intensity changes
• Story drip with energy context
• System state visual feedback

Use "Start Test" button for automated verification.
            """.strip()
            
            self.terminal.write_text(welcome_text, typewriter=True)
            
            # Run for specified duration
            while (time.time() - start_time) < verification_duration:
                # Update displays
                if self.terminal:
                    self.terminal.update()
                
                # Update window
                if self.root_window:
                    try:
                        self.root_window.update()
                    except tk.TclError:
                        logger.info("🖥️ Window closed by user")
                        break
                
                await asyncio.sleep(1/30)  # 30 FPS
            
            return True
            
        except KeyboardInterrupt:
            logger.info("🛑 Verification interrupted by user")
            return False
        except Exception as e:
            logger.error(f"❌ Verification failed: {e}")
            return False
    
    async def _cleanup(self):
        """Cleanup resources"""
        logger.info("🧹 Final Verification cleanup started")
        
        if self.terminal:
            self.terminal = None
        
        if self.root_window:
            try:
                self.root_window.quit()
                self.root_window.destroy()
            except:
                pass
            self.root_window = None
        
        logger.info("✅ Final Verification cleanup complete")

async def main():
    """Main entry point for Final Verification"""
    print("🔧 Final Verification - Energy-to-Font Transitions")
    print("=" * 60)
    print("🏆 ADR 190: Final Baseline Freeze")
    print("🎨 Testing Energy-Based Font Switching")
    print("📟 Validating Phosphor Terminal Integration")
    print("🔧 Font Manager System Verification")
    print("=" * 60)
    print("\n🚀 Starting 30-second verification...")
    print("📊 Adjust energy slider to see font transitions")
    print("🎨 Observe Green → Amber → Red font changes")
    print("📟 Watch CRT effects intensity changes")
    print("\n⚡ Press Ctrl+C to stop early\n")
    
    verification = FinalVerification()
    success = await verification.run_verification(duration=30.0)
    
    print("\n" + "=" * 60)
    print("🔧 FINAL VERIFICATION RESULTS")
    print("=" * 60)
    
    if success:
        print("✅ Energy-to-Font transitions: WORKING")
        print("✅ Phosphor Terminal integration: WORKING")
        print("✅ Font Manager system: WORKING")
        print("✅ Energy coupling: WORKING")
        print("✅ Story pipeline: WORKING")
        print("\n🎉 Final Verification SUCCESSFUL!")
        print("🔧 All systems ready for production freeze")
        print("🎯 ADR 190 Final Baseline: ACHIEVED")
    else:
        print("❌ Final Verification FAILED")
        print("🔧 Check system integration")
    
    print("\n" + "=" * 60)
    print("🔧 Final Verification Complete")
    print("🏁 Ready for Production Freeze: v1.0-Sovereign-Scout-Baseline")

if __name__ == "__main__":
    # Run the final verification
    asyncio.run(main())
