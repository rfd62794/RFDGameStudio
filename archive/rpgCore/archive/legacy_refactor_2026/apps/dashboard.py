#!/usr/bin/env python3
"""
DGT Dashboard - Cockpit Mode Launcher
Development dashboard with Tkinter meters and progress bars
"""

import sys
import time
import argparse
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger

def create_demo_metrics() -> dict:
    """Create demo dashboard metrics"""
    import random
    
    return {
        'performance': {
            'fps': 60.0 + random.uniform(-5, 5),
            'render_time': 12.5 + random.uniform(-3, 3),
            'frame_count': random.randint(1000, 9999),
            'entities': random.randint(10, 50),
            'sprites_loaded': random.randint(100, 500)
        },
        'resources': {
            'cpu': random.uniform(20, 80),
            'memory': random.uniform(30, 90),
            'gpu': random.uniform(10, 60),
            'disk_io': random.uniform(0, 100)
        },
        'simulation': {
            'world_size': '50x50',
            'active_entities': random.randint(5, 25),
            'events_per_second': random.uniform(10, 100),
            'simulation_time': random.uniform(0.1, 2.0)
        },
        'status': {
            'engine': 'Running',
            'renderer': 'Active',
            'physics': 'Enabled',
            'audio': 'Ready'
        }
    }

def run_cockpit_dashboard():
    """Run cockpit dashboard mode"""
    try:
        from dgt_core import BodyEngine, DisplayMode, TRI_MODAL_AVAILABLE
        
        if not TRI_MODAL_AVAILABLE:
            logger.error("❌ Tri-Modal Display Suite not available")
            return False
        
        # Create engine with cockpit mode
        engine = BodyEngine(use_tri_modal=True, universal_packet_enforcement=True)
        
        if not engine.set_mode(DisplayMode.COCKPIT):
            logger.error("❌ Failed to set cockpit mode")
            return False
        
        print("🪟 DGT Development Dashboard Started")
        print("=" * 50)
        print("Real-time metrics dashboard... Close window to stop")
        print()
        
        # Dashboard loop
        try:
            counter = 0
            while True:
                # Create dashboard data
                data = create_demo_metrics()
                
                # Add session info
                data['session'] = {
                    'update_counter': counter,
                    'timestamp': time.strftime('%H:%M:%S'),
                    'uptime': counter * 2  # 2 seconds per update
                }
                
                # Render in cockpit mode
                success = engine.render(data, DisplayMode.COCKPIT)
                
                if not success:
                    logger.warning("⚠️ Cockpit render failed")
                
                counter += 1
                time.sleep(2)  # Update every 2 seconds
                
        except KeyboardInterrupt:
            print("\n🛑 Dashboard stopped by user")
        except Exception as e:
            if "window was closed" in str(e).lower():
                print("\n🪟 Dashboard window closed")
            else:
                raise e
        
        # Cleanup
        engine.cleanup()
        return True
        
    except Exception as e:
        logger.error(f"❌ Cockpit dashboard failed: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='DGT Development Dashboard')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    parser.add_argument('--debug', '-d', action='store_true', help='Enable debug logging')
    
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
    
    print("🎭 DGT Development Dashboard")
    print("Real-time metrics dashboard with Tkinter interface")
    print()
    
    success = run_cockpit_dashboard()
    
    if success:
        print("✅ Dashboard session completed")
        return 0
    else:
        print("❌ Dashboard session failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
