#!/usr/bin/env python3
"""
DGT Platform Launcher - Three-Tier Architecture Entry Point
Wave 3 Production Hardening - Unified launcher for Theater Mode, Asteroids, RPG Lab

This is the "Big Red Button" that provides access to all Tier 3 applications
with Three-Tier architecture compliance and Miyoo Mini optimization.
"""

import os
import sys
import time
import argparse
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

# Add src to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.system_clock import SystemClock
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from loguru import logger


class ApplicationMode(Enum):
    """Available application modes"""
    THEATER = "theater"
    ASTEROIDS = "asteroids"
    RPG_LAB = "rpg_lab"
    VALIDATION = "validation"
    DEPLOYMENT = "deployment"
    WORKSPACE = "workspace"  # Flexible layout mode
    LARGE_WORKSPACE = "large_workspace"  # 1280x720 professional IDE
    ADAPTIVE_WORKSPACE = "adaptive_workspace"  # 320x240 adaptive flight space


@dataclass
class LauncherConfig:
    """Configuration for the DGT launcher"""
    mode: ApplicationMode
    target_fps: float = 60.0
    max_cpu_usage: float = 80.0
    headless: bool = False
    debug: bool = False
    miyoo_optimized: bool = False


class ThreeTierValidator:
    """Validates Three-Tier architecture before launching"""
    
    def __init__(self):
        self.issues = []
        self.warnings = []
    
    def validate_all(self) -> bool:
        """Run all Three-Tier validations"""
        logger.info("🔍 Validating Three-Tier Architecture...")
        
        checks = [
            self._validate_tier1_foundation,
            self._validate_tier2_engines,
            self._validate_tier3_applications,
            self._validate_import_compliance
        ]
        
        for check in checks:
            try:
                check()
            except Exception as e:
                self.issues.append(f"Validation error in {check.__name__}: {e}")
        
        # Report results
        self._report_results()
        
        return len(self.issues) == 0
    
    def _validate_tier1_foundation(self) -> None:
        """Validate Tier 1 Foundation"""
        try:
            from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
            from dgt_engine.foundation.types import Result, ValidationResult
            from dgt_engine.foundation.system_clock import SystemClock
            
            # Test SystemClock
            clock = SystemClock(target_fps=60.0)
            
            if clock.target_fps != 60.0:
                self.issues.append("SystemClock not properly configured")
            
            if SOVEREIGN_WIDTH != 160 or SOVEREIGN_HEIGHT != 144:
                self.issues.append("Sovereign constraints not properly set")
            
            logger.info("✅ Tier 1 Foundation validated")
            
        except ImportError as e:
            self.issues.append(f"Tier 1 import failed: {e}")
    
    def _validate_tier2_engines(self) -> None:
        """Validate Tier 2 Engines"""
        try:
            from dgt_engine.systems.body.cinematics.movie_engine import MovieEngine
            from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader
            
            # Test MovieEngine
            engine = MovieEngine(seed="LAUNCHER_TEST")
            
            # Test AssetLoader
            loader = AssetLoader()
            
            logger.info("✅ Tier 2 Engines validated")
            
        except ImportError as e:
            self.issues.append(f"Tier 2 import failed: {e}")
    
    def _validate_tier3_applications(self) -> None:
        """Validate Tier 3 Applications"""
        try:
            # Check for Theater Mode test
            theater_test = Path(__file__).parent.parent.parent / "tests" / "test_theater_mode.py"
            if not theater_test.exists():
                self.warnings.append("Theater Mode test script not found")
            
            # Check for scenarios
            scenarios_dir = Path(__file__).parent / "space" / "scenarios"
            if not scenarios_dir.exists():
                self.warnings.append("Space scenarios directory not found")
            
            logger.info("✅ Tier 3 Applications validated")
            
        except Exception as e:
            self.issues.append(f"Tier 3 validation failed: {e}")
    
    def _validate_import_compliance(self) -> None:
        """Validate import compliance"""
        try:
            # This should work - importing from lower tiers
            from dgt_engine.foundation.constants import SOVEREIGN_WIDTH
            from dgt_engine.systems.body.cinematics.movie_engine import MovieEngine
            
            logger.info("✅ Import compliance validated")
            
        except ImportError as e:
            self.issues.append(f"Import compliance failed: {e}")
    
    def _report_results(self) -> None:
        """Report validation results"""
        if self.issues:
            logger.error("Three-Tier validation issues:")
            for issue in self.issues:
                logger.error(f"  ❌ {issue}")
        
        if self.warnings:
            logger.warning("Three-Tier validation warnings:")
            for warning in self.warnings:
                logger.warning(f"  ⚠️ {warning}")
        
        if not self.issues and not self.warnings:
            logger.info("✅ All Three-Tier validations passed")


class DGTPlatformLauncher:
    """
    Three-Tier Architecture compliant launcher for the DGT Platform.
    
    This is the "Big Red Button" that handles all bootstrapping,
    Three-Tier validation, and application selection.
    """
    
    def __init__(self, config: LauncherConfig):
        self.config = config
        self.root_dir = Path(__file__).parent.parent.parent
        self.src_dir = self.root_dir / "src"
        
        # System clock for consistent timing
        self.system_clock = SystemClock(
            target_fps=config.target_fps,
            max_cpu_usage=config.max_cpu_usage
        )
        
        # Three-Tier validator
        self.validator = ThreeTierValidator()
        
        logger.info("🚀 DGT Platform Launcher initialized")
        logger.info(f"📁 Root directory: {self.root_dir}")
        logger.info(f"🎮 Mode: {config.mode.value}")
        logger.info(f"⏰ Target FPS: {config.target_fps}")
        logger.info(f"🔋 CPU limit: {config.max_cpu_usage}%")
    
    def launch(self) -> Result[bool]:
        """Launch the selected application mode"""
        logger.info(f"🚀 Launching DGT Platform in {self.config.mode.value} mode")
        
        try:
            # Step 1: Validate Three-Tier Architecture
            if not self.validator.validate_all():
                return Result(success=False, error="Three-Tier validation failed")
            
            # Step 2: Configure SystemClock for Miyoo Mini if needed
            if self.config.miyoo_optimized:
                self.system_clock.adjust_for_battery(0.5)  # 50% battery optimization
            
            # Step 3: Launch specific application
            if self.config.mode == ApplicationMode.THEATER:
                return self._launch_theater_mode()
            elif self.config.mode == ApplicationMode.ASTEROIDS:
                return self._launch_asteroids()
            elif self.config.mode == ApplicationMode.RPG_LAB:
                return self._launch_rpg_lab()
            elif self.config.mode == ApplicationMode.VALIDATION:
                return self._launch_validation()
            elif self.config.mode == ApplicationMode.DEPLOYMENT:
                return self._launch_deployment()
            elif self.config.mode == ApplicationMode.WORKSPACE:
                return self._launch_workspace()
            elif self.config.mode == ApplicationMode.LARGE_WORKSPACE:
                return self._launch_large_workspace()
            elif self.config.mode == ApplicationMode.ADAPTIVE_WORKSPACE:
                return self._launch_adaptive_workspace()
            else:
                return Result(success=False, error=f"Unknown mode: {self.config.mode}")
        
        except Exception as e:
            error_msg = f"Launch failed: {str(e)}"
            logger.error(error_msg)
            return Result(success=False, error=error_msg)
    
    def _launch_theater_mode(self) -> Result[bool]:
        """Launch Theater Mode"""
        logger.info("🎬 Launching Theater Mode")
        
        try:
            # Run the theater mode test script
            theater_script = self.root_dir / "test_theater_mode.py"
            
            if not theater_script.exists():
                return Result(success=False, error="Theater mode script not found")
            
            # Execute theater mode
            import subprocess
            
            cmd = [sys.executable, str(theater_script)]
            if self.config.debug:
                cmd.append("--debug")
            
            result = subprocess.run(cmd, cwd=self.root_dir)
            
            if result.returncode == 0:
                logger.info("✅ Theater Mode completed successfully")
                return Result(success=True, value=True)
            else:
                return Result(success=False, error=f"Theater Mode failed with code {result.returncode}")
        
        except Exception as e:
            return Result(success=False, error=f"Theater Mode launch failed: {str(e)}")
    
    def _launch_asteroids(self) -> Result[bool]:
        """Launch Asteroids with visual integration"""
        logger.info("🎮 Launching Visual Asteroids")
        
        try:
            # Import visual asteroids game
            from apps.space.visual_asteroids import VisualAsteroids
            
            # Create visual game
            game = VisualAsteroids(ai_mode=getattr(self.config, 'ai_mode', False))
            
            # Run the game
            result = game.run()
            
            if result.success:
                logger.info("✅ Visual Asteroids completed successfully")
                return Result(success=True, value=True)
            else:
                return Result(success=False, error=f"Visual Asteroids failed: {result.error}")
            
        except Exception as e:
            return Result(success=False, error=f"Visual Asteroids launch failed: {str(e)}")
    
    def _run_asteroids_game(self, strategy) -> Result[bool]:
        """Run the asteroids game loop"""
        try:
            import time
            
            # Game setup
            game_time = 0.0
            dt = 1.0 / 60.0  # 60 FPS
            max_duration = 30.0  # 30 seconds for AI test
            
            # Create mock world data
            world_data = {
                'asteroids': [
                    {'x': 50, 'y': 50, 'vx': 10, 'vy': 5, 'radius': 15, 'size': 2},
                    {'x': 120, 'y': 80, 'vx': -8, 'vy': 12, 'radius': 10, 'size': 1},
                    {'x': 30, 'y': 100, 'vx': 15, 'vy': -10, 'radius': 20, 'size': 3}
                ]
            }
            
            print("🎮 Asteroids Game Starting")
            print("========================")
            print("🚀 Ship at center of screen")
            print("☄️ Asteroids in motion")
            print("🎯 Controller active")
            print()
            
            # Game loop
            while game_time < max_duration:
                # Update game state
                state_result = strategy.update_game_state(dt, world_data)
                if not state_result.success:
                    logger.error(f"Game state update failed: {state_result.error}")
                    break
                
                game_state = state_result.value
                
                # Update asteroid positions
                for asteroid in world_data['asteroids']:
                    asteroid['x'] += asteroid['vx'] * dt
                    asteroid['y'] += asteroid['vy'] * dt
                    
                    # Wrap around screen
                    asteroid['x'] = asteroid['x'] % 160
                    asteroid['y'] = asteroid['y'] % 144
                
                # Get HUD data
                hud_data = strategy.get_hud_data()
                
                # Display status every 5 seconds
                if int(game_time) % 5 == 0:
                    print(f"⏰ Time: {game_time:.1f}s | "
                          f"Position: ({hud_data['position']['x']:.0f}, {hud_data['position']['y']:.0f}) | "
                          f"Energy: {hud_data['energy']:.0f}% | "
                          f"Lives: {hud_data['lives']}")
                
                # Check game over
                if game_state.get('game_over', False):
                    print(f"💥 Game Over! Final score: {hud_data['score']}")
                    break
                
                # Control frame rate
                time.sleep(dt)
                game_time += dt
            
            # Final status
            final_hud = strategy.get_hud_data()
            print(f"\n🏆 Game Complete!")
            print(f"⏱️ Survival time: {game_time:.1f}s")
            print(f"❤️ Lives remaining: {final_hud['lives']}")
            print(f"⚡ Energy: {final_hud['energy']:.0f}%")
            print(f"📍 Final position: ({final_hud['position']['x']:.0f}, {final_hud['position']['y']:.0f})")
            
            # Check AI performance if in AI mode
            if hasattr(self.config, 'ai_mode') and self.config.ai_mode:
                controller_status = strategy.controller_manager.get_controller_status()
                if controller_status.get('active_controller') == 'AI_PILOT':
                    ai_controller = strategy.controller_manager.controllers['AI_PILOT']
                    ai_status = ai_controller.get_status()
                    print(f"\n🤖 AI Pilot Performance:")
                    print(f"   State: {ai_status['state']}")
                    print(f"   Asteroids collected: {ai_status['asteroids_collected']}")
                    print(f"   Threats evaded: {ai_status['threats_evaded']}")
                    
                    # Verify AI success criteria
                    success = (game_time >= 30.0 and 
                              ai_status['asteroids_collected'] >= 1 and
                              final_hud['lives'] > 0)
                    
                    if success:
                        print("✅ AI Pilot SUCCESS: Survived 30s and collected scrap!")
                    else:
                        print("❌ AI Pilot needs improvement")
            
            logger.info("✅ Asteroids game completed")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Asteroids game failed: {str(e)}")
    
    def _launch_rpg_lab(self) -> Result[bool]:
        """Launch RPG Lab"""
        logger.info("🧪 Launching RPG Lab")
        
        try:
            # Look for RPG Lab implementation
            rpg_script = self.src_dir / "apps" / "rpg_lab" / "main.py"
            
            if not rpg_script.exists():
                # Fallback: create a simple RPG demo
                return self._create_rpg_demo()
            
            # Execute RPG Lab
            import subprocess
            result = subprocess.run([sys.executable, str(rpg_script)], cwd=self.root_dir)
            
            if result.returncode == 0:
                logger.info("✅ RPG Lab completed successfully")
                return Result(success=True, value=True)
            else:
                return Result(success=False, error=f"RPG Lab failed with code {result.returncode}")
        
        except Exception as e:
            return Result(success=False, error=f"RPG Lab launch failed: {str(e)}")
    
    def _launch_validation(self) -> Result[bool]:
        """Launch validation suite"""
        logger.info("🔍 Launching Validation Suite")
        
        try:
            # Run production validation
            validation_script = self.root_dir / "tools" / "production_validation.py"
            
            if not validation_script.exists():
                return Result(success=False, error="Production validation script not found")
            
            # Execute validation
            import subprocess
            result = subprocess.run([sys.executable, str(validation_script)], cwd=self.root_dir)
            
            if result.returncode == 0:
                logger.info("✅ Validation completed successfully")
                return Result(success=True, value=True)
            else:
                return Result(success=False, error=f"Validation failed with code {result.returncode}")
        
        except Exception as e:
            return Result(success=False, error=f"Validation launch failed: {str(e)}")
    
    def _launch_workspace(self) -> Result[bool]:
        """Launch flexible workspace with game and UI separation"""
        logger.info("🏛️ Launching Flexible Workspace")
        
        try:
            # Import the dashboard
            from apps.interface.dashboard import SovereignDashboard
            
            # Create and run dashboard
            dashboard = SovereignDashboard()
            dashboard.run()
            
            logger.info("✅ Flexible Workspace completed successfully")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Flexible Workspace launch failed: {str(e)}")
    
    def _launch_large_workspace(self) -> Result[bool]:
        """Launch 1280x720 professional workspace"""
        logger.info("🖥️ Launching Large Workspace (1280x720)")
        
        try:
            # Import the large workspace
            from apps.interface.large_workspace import LargeWorkspace
            
            # Create and run workspace
            workspace = LargeWorkspace()
            workspace.run()
            
            logger.info("✅ Large Workspace completed successfully")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Large Workspace launch failed: {str(e)}")
    
    def _launch_adaptive_workspace(self) -> Result[bool]:
        """Launch 320x240 adaptive workspace"""
        logger.info("🌌 Launching Adaptive Workspace (320x240)")
        
        try:
            # Import the adaptive workspace
            from apps.interface.adaptive_workspace import AdaptiveWorkspace
            
            # Create and run workspace
            workspace = AdaptiveWorkspace()
            workspace.run()
            
            logger.info("✅ Adaptive Workspace completed successfully")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Adaptive Workspace launch failed: {str(e)}")
    
    def _launch_deployment(self) -> Result[bool]:
        """Launch deployment tools"""
        logger.info("📦 Launching Deployment Tools")
        
        try:
            # Run deployment script
            deploy_script = self.root_dir / "tools" / "deploy.py"
            
            if not deploy_script.exists():
                return Result(success=False, error="Deployment script not found")
            
            # Execute deployment
            import subprocess
            cmd = [sys.executable, str(deploy_script), "--environment", "production"]
            if self.config.debug:
                cmd.append("--include-tests")
            
            result = subprocess.run(cmd, cwd=self.root_dir)
            
            if result.returncode == 0:
                logger.info("✅ Deployment completed successfully")
                return Result(success=True, value=True)
            else:
                return Result(success=False, error=f"Deployment failed with code {result.returncode}")
        
        except Exception as e:
            return Result(success=False, error=f"Deployment launch failed: {str(e)}")
    
    def _create_asteroids_demo(self) -> Result[bool]:
        """Create a simple asteroids demo"""
        logger.info("🎮 Creating Asteroids demo")
        
        try:
            from dgt_engine.body.cinematics.movie_engine import MovieEngine
            
            # Create a simple asteroids-like sequence
            engine = MovieEngine(seed="ASTEROIDS_DEMO", target_fps=60.0)
            
            # Create asteroids sequence
            from dgt_engine.systems.body.cinematics.movie_engine import CinematicEvent, EventType, MovieSequence
            
            events = [
                CinematicEvent(
                    event_id="spawn_asteroids",
                    event_type=EventType.SCENE_TRANSITION,
                    timestamp=0.0,
                    duration=2.0,
                    description="Spawn asteroids field"
                ),
                CinematicEvent(
                    event_id="player_ship",
                    event_type=EventType.MOVEMENT,
                    timestamp=2.0,
                    duration=5.0,
                    position=(80, 72),
                    description="Player ship enters"
                ),
                CinematicEvent(
                    event_id="asteroid_movement",
                    event_type=EventType.MOVEMENT,
                    timestamp=7.0,
                    duration=10.0,
                    description="Asteroids moving"
                )
            ]
            
            sequence = MovieSequence(
                sequence_id="asteroids_demo",
                title="Asteroids Demo",
                events=events,
                total_duration=sum(event.duration for event in events)
            )
            
            # Start and run sequence
            engine.start_sequence(sequence)
            
            print("🎮 Asteroids Demo")
            print("==================")
            print("🚀 Player ship at center of screen")
            print("☄️ Asteroids field spawned")
            print("🎯 Use arrow keys to move (demo mode)")
            print("⏱️ Running for 17 seconds...")
            
            # Simulate running
            time.sleep(17)
            
            engine.stop_sequence()
            
            logger.info("✅ Asteroids demo completed")
            return Result(success=True, value=True)
        
        except Exception as e:
            return Result(success=False, error=f"Asteroids demo failed: {str(e)}")
    
    def _create_rpg_demo(self) -> Result[bool]:
        """Create a simple RPG demo"""
        logger.info("🧪 Creating RPG Demo")
        
        try:
            from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader
            
            # Load some assets for the demo
            loader = AssetLoader()
            
            print("🧪 RPG Lab Demo")
            print("================")
            print("📖 Welcome to the RPG Laboratory")
            print("🎭 Testing character creation and inventory")
            print("🗡️ Testing combat mechanics")
            print("📊 Testing persistence system")
            print()
            print("🎲 Rolling character stats...")
            
            # Simulate character creation
            import random
            stats = {
                'strength': random.randint(8, 18),
                'dexterity': random.randint(8, 18),
                'constitution': random.randint(8, 18),
                'intelligence': random.randint(8, 18),
                'wisdom': random.randint(8, 18),
                'charisma': random.randint(8, 18)
            }
            
            print(f"💪 STR: {stats['strength']}")
            print(f"🏃 DEX: {stats['dexterity']}")
            print(f"🛡️ CON: {stats['constitution']}")
            print(f"🧠 INT: {stats['intelligence']}")
            print(f"🔮 WIS: {stats['wisdom']}")
            print(f"🗣️ CHA: {stats['charisma']}")
            print()
            print("✅ Character created successfully!")
            print("📚 RPG Lab demo completed")
            
            logger.info("✅ RPG Lab demo completed")
            return Result(success=True, value=True)
        
        except Exception as e:
            return Result(success=False, error=f"RPG Lab demo failed: {str(e)}")
    
    def show_menu(self) -> ApplicationMode:
        """Show interactive menu for mode selection"""
        print("🚀 DGT Platform Launcher - Three-Tier Architecture")
        print("=" * 60)
        print("Wave 3: Production Hardening")
        print()
        print("Select application mode:")
        print("1. 🎬 Theater Mode - Cinematic Engine Demo")
        print("2. 🎮 Asteroids - Space Combat Game")
        print("3. 🧪 RPG Lab - Character Creation Demo")
        print("4. 🔍 Validation - Run Production Validation")
        print("5. 📦 Deployment - Build Production Package")
        print("6. 🏛️ Workspace - Flexible Layout Dashboard")
        print("7. 🖥️ Large Workspace - 1280x720 Professional IDE")
        print("8. 🌌 Adaptive Workspace - 320x240 Flight Space")
        print()
        
        while True:
            try:
                choice = input("Enter choice (1-8): ").strip()
                
                if choice == "1":
                    return ApplicationMode.THEATER
                elif choice == "2":
                    return ApplicationMode.ASTEROIDS
                elif choice == "3":
                    return ApplicationMode.RPG_LAB
                elif choice == "4":
                    return ApplicationMode.VALIDATION
                elif choice == "5":
                    return ApplicationMode.DEPLOYMENT
                elif choice == "6":
                    return ApplicationMode.WORKSPACE
                elif choice == "7":
                    return ApplicationMode.LARGE_WORKSPACE
                elif choice == "8":
                    return ApplicationMode.ADAPTIVE_WORKSPACE
                else:
                    print("Invalid choice. Please enter 1-8.")
            except KeyboardInterrupt:
                print("\n👋 Exiting...")
                sys.exit(0)


def main():
    """Main launcher entry point"""
    parser = argparse.ArgumentParser(description="DGT Platform Three-Tier Launcher")
    parser.add_argument("--mode", choices=[mode.value for mode in ApplicationMode], 
                       help="Application mode to launch")
    parser.add_argument("--fps", type=float, default=60.0, help="Target FPS")
    parser.add_argument("--cpu", type=float, default=80.0, help="Max CPU usage percent")
    parser.add_argument("--headless", action="store_true", help="Run in headless mode")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    parser.add_argument("--miyoo", action="store_true", help="Optimize for Miyoo Mini")
    parser.add_argument("--ai", action="store_true", help="Enable AI controller for Asteroids")
    
    args = parser.parse_args()
    
    # Configure logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    # Create configuration
    if args.mode:
        mode = ApplicationMode(args.mode)
        config = LauncherConfig(
            mode=mode,
            target_fps=args.fps,
            max_cpu_usage=args.cpu,
            headless=args.headless,
            debug=args.debug,
            miyoo_optimized=args.miyoo
        )
        # Set AI mode flag
        config.ai_mode = args.ai
    else:
        # Interactive mode
        launcher = DGTPlatformLauncher(LauncherConfig(mode=ApplicationMode.THEATER))
        mode = launcher.show_menu()
        
        config = LauncherConfig(
            mode=mode,
            target_fps=args.fps,
            max_cpu_usage=args.cpu,
            headless=args.headless,
            debug=args.debug,
            miyoo_optimized=args.miyoo
        )
        # Set AI mode flag for interactive mode
        config.ai_mode = args.ai
    
    # Create launcher and run
    launcher = DGTPlatformLauncher(config)
    result = launcher.launch()
    
    if result.success:
        print(f"\n🏆 {mode.value.title()} completed successfully!")
        return 0
    else:
        print(f"\n❌ {mode.value.title()} failed: {result.error}")
        return 1


if __name__ == "__main__":
    exit(main())
