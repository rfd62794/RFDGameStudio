#!/usr/bin/env python3
"""
DGT Universal Launcher - CLI Entry Point for the Architectural Singularity
Provides unified access to all DGT engines and views
"""

import argparse
import sys
import time
from typing import Optional

from loguru import logger

from src.dgt_core.orchestrator import (
    DGTOrchestrator, EngineType, ViewType,
    create_space_orchestrator, create_shell_orchestrator, create_auto_orchestrator
)


def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="DGT Universal Launcher - Architectural Singularity Entry Point",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Launch Space engine with Rich dashboard
  python dgt_launcher.py --engine space --view rich
  
  # Launch Shell engine with auto-detected view
  python dgt_launcher.py --engine shell --view auto
  
  # Launch with Pygame graphics
  python dgt_launcher.py --engine space --view pygame --graphics
  
  # Quick start (auto-detect everything)
  python dgt_launcher.py --auto
        """
    )
    
    # Engine selection
    engine_group = parser.add_mutually_exclusive_group(required=True)
    engine_group.add_argument(
        '--engine', '-e',
        choices=['space', 'shell'],
        help='Engine type to launch'
    )
    engine_group.add_argument(
        '--auto', '-a',
        action='store_true',
        help='Auto-detect optimal configuration'
    )
    
    # View selection
    parser.add_argument(
        '--view', '-v',
        choices=['rich', 'pygame', 'terminal', 'auto'],
        default='auto',
        help='View type (default: auto)'
    )
    
    # Configuration options
    parser.add_argument(
        '--fleet-size', '-f',
        type=int,
        default=5,
        help='Fleet size for Space engine (default: 5)'
    )
    
    parser.add_argument(
        '--party-size', '-p',
        type=int,
        default=5,
        help='Party size for Shell engine (default: 5)'
    )
    
    parser.add_argument(
        '--graphics', '-g',
        action='store_true',
        help='Enable high-fidelity graphics (Pygame)'
    )
    
    parser.add_argument(
        '--log-level', '-l',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
        default='INFO',
        help='Logging level (default: INFO)'
    )
    
    parser.add_argument(
        '--refresh-rate', '-r',
        type=float,
        default=1.0,
        help='Dashboard refresh rate in seconds (default: 1.0)'
    )
    
    # Utility options
    parser.add_argument(
        '--status', '-s',
        action='store_true',
        help='Show system status and exit'
    )
    
    parser.add_argument(
        '--test', '-t',
        action='store_true',
        help='Run quick system test'
    )
    
    parser.add_argument(
        '--demo', '-d',
        action='store_true',
        help='Run demonstration mode'
    )
    
    return parser.parse_args()


def create_orchestrator_from_args(args: argparse.Namespace) -> Optional[DGTOrchestrator]:
    """Create orchestrator from command line arguments"""
    try:
        if args.auto:
            # Auto-detect optimal configuration
            engine_type = EngineType.SPACE  # Default to space
            view_type = ViewType.AUTO
            fleet_size = 5
            party_size = 5
        else:
            # Use explicit arguments
            engine_type = EngineType(args.engine)
            view_type = ViewType(args.view)
            fleet_size = args.fleet_size
            party_size = args.party_size
        
        # Create orchestrator
        if engine_type == EngineType.SPACE:
            orchestrator = create_space_orchestrator(
                fleet_size=fleet_size,
                view_type=view_type
            )
        else:
            orchestrator = create_shell_orchestrator(
                party_size=party_size,
                view_type=view_type
            )
        
        # Update configuration
        orchestrator.config.refresh_rate = args.refresh_rate
        orchestrator.config.log_level = args.log_level
        orchestrator.config.enable_graphics = args.graphics
        
        return orchestrator
        
    except Exception as e:
        logger.error(f"Failed to create orchestrator: {e}")
        return None


def run_system_test():
    """Run quick system test"""
    logger.info("🧪 Running DGT System Test...")
    
    try:
        # Test Space engine
        logger.info("🧪 Testing Space engine...")
        space_orchestrator = create_space_orchestrator(fleet_size=3)
        space_orchestrator.start()
        time.sleep(2)
        space_orchestrator.stop()
        
        # Test Shell engine
        logger.info("🧪 Testing Shell engine...")
        shell_orchestrator = create_shell_orchestrator(party_size=3)
        shell_orchestrator.start()
        time.sleep(2)
        shell_orchestrator.stop()
        
        logger.success("🧪 System test completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"🧪 System test failed: {e}")
        return False


def run_demo_mode():
    """Run demonstration mode"""
    logger.info("🎭 Running DGT Demo Mode...")
    
    try:
        # Create demo orchestrator
        orchestrator = create_space_orchestrator(fleet_size=10, view_type=ViewType.RICH)
        
        # Start with demo configuration
        orchestrator.config.refresh_rate = 0.5  # Faster refresh for demo
        orchestrator.start()
        
        logger.info("🎭 Demo running... Press Ctrl+C to stop")
        
        # Run for 30 seconds or until interrupted
        start_time = time.time()
        while time.time() - start_time < 30:
            time.sleep(1)
        
        orchestrator.stop()
        logger.success("🎭 Demo completed!")
        
    except KeyboardInterrupt:
        logger.info("🎭 Demo interrupted by user")
        if 'orchestrator' in locals():
            orchestrator.stop()
    except Exception as e:
        logger.error(f"🎭 Demo failed: {e}")


def show_system_status():
    """Show system status"""
    print("=== DGT System Status ===")
    
    try:
        # Test imports
        from src.dgt_core.engines.space import create_space_engine_runner
        from src.dgt_core.engines.shells import create_shell_engine
        from src.dgt_core.view.cli.dashboard import create_commander_dashboard
        from src.dgt_core.kernel.universal_registry import create_universal_registry
        
        print("✅ All core components import successfully")
        
        # Test quick initialization
        space_engine = create_space_engine_runner(fleet_size=1)
        shell_engine = create_shell_engine(party_size=1)
        dashboard = create_commander_dashboard()
        registry = create_universal_registry()
        
        print("✅ All components initialize successfully")
        
        # Show configuration
        print(f"✅ Python version: {sys.version}")
        print(f"✅ Platform: {sys.platform}")
        
        print("=== System Ready ===")
        
    except Exception as e:
        print(f"❌ System check failed: {e}")
        return False
    
    return True


def main():
    """Main entry point"""
    args = parse_arguments()
    
    # Configure logging
    from src.dgt_core.view.cli.logger_config import configure_logging
    configure_logging(
        log_level=args.log_level,
        log_file="logs/dgt_launcher.log",
        enable_rich=True
    )
    
    logger.info("🚀 DGT Universal Launcher started")
    
    # Handle special modes
    if args.status:
        success = show_system_status()
        sys.exit(0 if success else 1)
    
    if args.test:
        success = run_system_test()
        sys.exit(0 if success else 1)
    
    if args.demo:
        run_demo_mode()
        sys.exit(0)
    
    # Normal operation
    logger.info(f"🚀 Launching DGT with engine={args.engine}, view={args.view}")
    
    # Create and start orchestrator
    orchestrator = create_orchestrator_from_args(args)
    if not orchestrator:
        logger.error("❌ Failed to create orchestrator")
        sys.exit(1)
    
    try:
        # Start the system
        success = orchestrator.start()
        if not success:
            logger.error("❌ Failed to start orchestrator")
            sys.exit(1)
        
        # Run until interrupted
        logger.info("🚀 DGT running... Press Ctrl+C to stop")
        
        # Keep main thread alive
        while orchestrator._running:
            time.sleep(1)
            
            # Print status periodically
            status = orchestrator.get_status()
            logger.debug(f"🚀 Status: {status['fleet_size']} ships, running={status['running']}")
    
    except KeyboardInterrupt:
        logger.info("🚀 DGT stopped by user")
    except Exception as e:
        logger.error(f"🚀 Unexpected error: {e}")
    finally:
        # Always try to stop gracefully
        if orchestrator:
            orchestrator.stop()
    
    logger.info("🚀 DGT Universal Launcher finished")


if __name__ == "__main__":
    main()
