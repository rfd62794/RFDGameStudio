#!/usr/bin/env python3
"""
Launch RPG Engine - D20 Turn-Based Combat Simulation
Entry point for Shell Engine with Rich CLI Dashboard
"""

import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from apps.rpg.dd_engine import DDEngine
from apps.rpg.world_engine import WorldEngine
from dgt_core.view.cli.logger_config import configure_logging


def main():
    """Launch RPG Engine with Rich Dashboard"""
    # Configure logging
    configure_logging(
        log_level="INFO",
        log_file="logs/rpg_engine.log",
        enable_rich=True
    )
    
    # Create shell orchestrator
    orchestrator = create_shell_orchestrator(
        party_size=5,
        view_type=ViewType.RICH
    )
    
    # Start the system
    try:
        success = orchestrator.start()
        if not success:
            print("Failed to start RPG Engine")
            sys.exit(1)
        
        print("🐢 RPG Engine running... Press Ctrl+C to stop")
        
        # Keep running until interrupted
        while orchestrator._running:
            import time
            time.sleep(1)
            
            # Print status periodically
            status = orchestrator.get_status()
            print(f"🐢 Status: {status['fleet_size']} characters active")
    
    except KeyboardInterrupt:
        print("\n🐢 RPG Engine stopped by user")
    except Exception as e:
        print(f"🐢 Unexpected error: {e}")
    finally:
        # Always try to stop gracefully
        if 'orchestrator' in locals():
            orchestrator.stop()
    
    print("🐢 RPG Engine shutdown complete")


if __name__ == "__main__":
    main()
