#!/usr/bin/env python3
"""
DGT Unified CLI Launcher
Tri-Modal Display Suite - Universal Entry Point

Usage:
    python main.py --mode terminal    # Headless monitoring
    python main.py --mode cockpit      # Development dashboard  
    python main.py --mode ppu          # Game rendering
    python main.py --demo              # Demo all modes
"""

import sys
import time
import argparse
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / 'src'))

from loguru import logger

def run_demo_mode():
    """Run demo showing all three modes"""
    try:
        from dgt_core import BodyEngine, DisplayMode, TRI_MODAL_AVAILABLE
        
        if not TRI_MODAL_AVAILABLE:
            logger.error("❌ Tri-Modal Display Suite not available")
            return False
        
        print("🎭 DGT Tri-Modal Demo")
        print("=" * 50)
        print("Demonstrating all three display modes...")
        print()
        
        # Create engine
        engine = BodyEngine(use_tri_modal=True, universal_packet_enforcement=True)
        
        # Demo data - same data, different presentations
        demo_data = {
            'entities': [
                {'id': 'player', 'x': 10, 'y': 10, 'type': 'dynamic', 'effect': 'sway'},
                {'id': 'item', 'x': 5, 'y': 8, 'type': 'dynamic', 'effect': 'pulse'},
                {'id': 'wall', 'x': 15, 'y': 12, 'type': 'dynamic', 'effect': None}
            ],
            'background': {'id': 'demo_bg', 'type': 'baked'},
            'hud': {
                'line_1': 'DGT Tri-Modal Demo',
                'line_2': 'Universal Packet Data',
                'line_3': f'Time: {time.strftime("%H:%M:%S")}',
                'line_4': 'Same data, three lenses'
            },
            'metadata': {
                'demo_mode': True,
                'packet_format': 'universal',
                'enforcement': 'ADR 122'
            }
        }
        
        modes = [
            (DisplayMode.TERMINAL, "Terminal Mode", 5),
            (DisplayMode.COCKPIT, "Cockpit Mode", 5),
            (DisplayMode.PPU, "PPU Mode", 5)
        ]
        
        for mode, mode_name, duration in modes:
            print(f"🎯 Switching to {mode_name}...")
            
            if not engine.set_mode(mode):
                logger.error(f"❌ Failed to set {mode_name}")
                continue
            
            print(f"✅ {mode_name} active for {duration} seconds")
            
            # Run for specified duration
            start_time = time.time()
            frame_count = 0
            
            try:
                while time.time() - start_time < duration:
                    # Update timestamp
                    demo_data['hud']['line_3'] = f'Time: {time.strftime("%H:%M:%S")}'
                    demo_data['frame'] = frame_count
                    
                    # Render
                    success = engine.render(demo_data, mode)
                    
                    if not success:
                        logger.warning(f"⚠️ {mode_name} render failed")
                    
                    frame_count += 1
                    time.sleep(0.5)  # 2Hz updates for demo
                    
            except KeyboardInterrupt:
                print(f"\n🛑 {mode_name} interrupted")
                break
            except Exception as e:
                if "window was closed" in str(e).lower():
                    print(f"\n🪟 {mode_name} window closed")
                    break
                else:
                    raise e
        
        # Cleanup
        engine.cleanup()
        
        print("\n✅ Demo completed - same data shown in three different lenses!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Demo failed: {e}")
        return False

def run_mode(mode: str, args):
    """Run specific mode"""
    mode_map = {
        'terminal': ('apps.monitor', 'run_terminal_monitor'),
        'cockpit': ('apps.dashboard', 'run_cockpit_dashboard'),
        'ppu': ('apps.play_slice', 'run_ppu_game')
    }
    
    if mode not in mode_map:
        logger.error(f"❌ Unknown mode: {mode}")
        return False
    
    module_name, function_name = mode_map[mode]
    
    try:
        # Import the module
        module = __import__(module_name, fromlist=[function_name])
        function = getattr(module, function_name)
        
        # Run the function
        return function()
        
    except Exception as e:
        logger.error(f"❌ Failed to run {mode} mode: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='DGT Unified CLI Launcher - Tri-Modal Display Suite',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py --mode terminal    # Headless monitoring
  python main.py --mode cockpit      # Development dashboard
  python main.py --mode ppu          # Game rendering
  python main.py --demo              # Demo all modes
  
Display Modes:
  terminal    Rich-based console output (10Hz)
  cockpit      Tkinter dashboard (30Hz)
  ppu          Game Boy rendering (60Hz)
        """
    )
    
    parser.add_argument('--mode', choices=['terminal', 'cockpit', 'ppu'], 
                       help='Display mode to launch')
    parser.add_argument('--demo', action='store_true',
                       help='Run demo showing all modes')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    parser.add_argument('--debug', '-d', action='store_true',
                       help='Enable debug logging')
    
    args = parser.parse_args()
    
    # Configure logging
    if args.debug:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    elif args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="INFO")
    else:
        logger.remove()
        logger.add(sys.stderr, level="WARNING")
    
    print("🎭 DGT Unified CLI Launcher")
    print("Tri-Modal Display Suite - Universal Packet Architecture")
    print("ADR 120: Tri-Modal Rendering Bridge")
    print("ADR 122: Universal Packet Enforcement")
    print()
    
    # Check if tri-modal is available
    try:
        from dgt_core import TRI_MODAL_AVAILABLE
        
        if not TRI_MODAL_AVAILABLE:
            print("⚠️ Tri-Modal Display Suite not available")
            print("   Check installation of Rich, Tkinter, and Rust components")
            return 1
        
        print("✅ Tri-Modal Display Suite available")
        print()
        
    except ImportError as e:
        print(f"❌ Failed to import DGT Core: {e}")
        return 1
    
    # Run appropriate mode
    if args.demo:
        success = run_demo_mode()
    elif args.mode:
        success = run_mode(args.mode, args)
    else:
        parser.print_help()
        return 0
    
    if success:
        print("✅ Session completed successfully")
        return 0
    else:
        print("❌ Session failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
