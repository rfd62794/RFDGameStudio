#!/usr/bin/env python3
"""
DGT Monitor - Terminal Mode Launcher
Headless office monitoring with Rich-based console display
"""

import sys
import time
import argparse
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger

def create_demo_data() -> dict:
    """Create demo monitoring data"""
    return {
        'system_metrics': {
            'cpu_usage': 45.2,
            'memory_usage': 67.8,
            'disk_usage': 23.4,
            'network_in': 1024,
            'network_out': 2048,
            'processes': 156,
            'uptime': 86400
        },
        'services': [
            {'name': 'web-server', 'status': 'running', 'cpu': 12.5, 'memory': 256},
            {'name': 'database', 'status': 'running', 'cpu': 8.3, 'memory': 512},
            {'name': 'cache', 'status': 'running', 'cpu': 3.1, 'memory': 128},
            {'name': 'queue', 'status': 'warning', 'cpu': 15.7, 'memory': 64},
        ],
        'alerts': [
            {'level': 'info', 'message': 'System health check passed', 'time': time.time()},
            {'level': 'warning', 'message': 'High memory usage on cache server', 'time': time.time() - 300},
        ]
    }

def run_terminal_monitor():
    """Run terminal monitoring mode"""
    try:
        from dgt_core import BodyEngine, DisplayMode, TRI_MODAL_AVAILABLE
        
        if not TRI_MODAL_AVAILABLE:
            logger.error("❌ Tri-Modal Display Suite not available")
            return False
        
        # Create engine with terminal mode
        engine = BodyEngine(use_tri_modal=True, universal_packet_enforcement=True)
        
        if not engine.set_mode(DisplayMode.TERMINAL):
            logger.error("❌ Failed to set terminal mode")
            return False
        
        print("🖥️ DGT Terminal Monitor Started")
        print("=" * 50)
        print("Monitoring system metrics... Press Ctrl+C to stop")
        print()
        
        # Monitoring loop
        try:
            counter = 0
            while True:
                # Create monitoring data
                data = create_demo_data()
                
                # Add counter to show updates
                data['update_counter'] = counter
                data['timestamp'] = time.strftime('%Y-%m-%d %H:%M:%S')
                
                # Render in terminal mode
                success = engine.render(data, DisplayMode.TERMINAL)
                
                if not success:
                    logger.warning("⚠️ Terminal render failed")
                
                counter += 1
                time.sleep(2)  # Update every 2 seconds
                
        except KeyboardInterrupt:
            print("\n🛑 Monitor stopped by user")
        
        # Cleanup
        engine.cleanup()
        return True
        
    except Exception as e:
        logger.error(f"❌ Terminal monitor failed: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='DGT Terminal Monitor')
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
    
    print("🎭 DGT Terminal Monitor")
    print("Headless system monitoring with Rich console display")
    print()
    
    success = run_terminal_monitor()
    
    if success:
        print("✅ Monitor session completed")
        return 0
    else:
        print("❌ Monitor session failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
