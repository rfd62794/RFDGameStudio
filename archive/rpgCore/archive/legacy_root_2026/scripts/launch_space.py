#!/usr/bin/env python3
"""
Launch Space Engine - Newtonian Vector Physics Simulation
Entry point for Space Fleet Combat with Rich CLI Dashboard
"""

import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from apps.space.space_voyager_engine import SpaceVoyagerEngine
from apps.space.asteroids_strategy import AsteroidsStrategy
from dgt_core.view.cli.logger_config import configure_logging


def main():
    """Launch Space Engine with Rich Dashboard"""
    # Configure logging
    configure_logging(
        log_level="INFO",
        log_file="logs/space_engine.log",
        enable_rich=True
    )
    
    # Create space orchestrator
    orchestrator = create_space_orchestrator(
        fleet_size=5,
        view_type=ViewType.RICH
    )
    
    # Start the system
    try:
        success = orchestrator.start()
        if not success:
            print("Failed to start Space Engine")
            sys.exit(1)
        
        print("🚀 Space Engine running... Press Ctrl+C to stop")
        
        # Keep running until interrupted
        while orchestrator._running:
            import time
            time.sleep(1)
            
            # Print status periodically
            status = orchestrator.get_status()
            print(f"🚀 Status: {status['fleet_size']} ships active")
    
    except KeyboardInterrupt:
        print("\n🚀 Space Engine stopped by user")
    except Exception as e:
        print(f"🚀 Unexpected error: {e}")
    finally:
        # Always try to stop gracefully
        if 'orchestrator' in locals():
            orchestrator.stop()
    
    print("🚀 Space Engine shutdown complete")


if __name__ == "__main__":
    main()
