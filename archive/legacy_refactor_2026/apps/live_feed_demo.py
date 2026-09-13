#!/usr/bin/env python3
"""
Live Feed Demo - Local-First Microservice Bridge
Demonstrates ADR 123: Sim (Server) and UI (Client) running in separate processes
"""

import sys
import time
import argparse
import multiprocessing
from pathlib import Path
from signal import signal

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger

def run_simulation_server(queue: multiprocessing.Queue):
    """Run simulation server in separate process"""
    try:
        from dgt_core.server import SimulationServer, SimulationConfig
        
        config = SimulationConfig(
            target_fps=60,
            max_entities=50,
            enable_physics=True,
            enable_genetics=True,
            enable_d20=True,
            log_to_file=False  # Reduce log noise for demo
        )
        
        server = SimulationServer(config)
        
        # Override queue for inter-process communication
        server.state_queue = queue
        
        print("🧠 Simulation Server Process Started")
        print("=" * 50)
        print("Generating simulation data...")
        print("Close PPU window to see server continue running")
        print()
        
        server.start()
        
        try:
            # Keep server running
            while True:
                time.sleep(1)
                
                # Print server stats every 5 seconds
                if server.frame_count % 300 == 0:
                    stats = server.get_performance_stats()
                    print(f"📊 Server: FPS: {stats['current_fps']:.1f}, Entities: {stats['entities_count']}, Frame: {stats['frame_count']}")
                
                # Log interesting events
                if server.frame_count % 1800 == 0:  # Every 30 seconds
                    print(f"🎯 Random D20 Event occurred!")
                    print(f"🐢 Turtle genetics simulation running...")
        
        except KeyboardInterrupt:
            pass
        finally:
            server.cleanup()
            print("🧠 Simulation Server Process Stopped")
    
    except Exception as e:
        logger.error(f"❌ Simulation server process failed: {e}")
        print(f"❌ Simulation server process failed: {e}")

def run_ppu_client(queue: multiprocessing.Queue):
    """Run PPU client in separate process"""
    try:
        from dgt_core.client import UIClient, ClientConfig, DisplayMode
        
        config = ClientConfig(
            display_mode=DisplayMode.PPU,
            update_rate_hz=60,
            max_queue_size=10,
            local_mode=True
        )
        
        client = UIClient(config)
        
        # Connect to local simulation via queue
        client.connect_to_local_server(queue)
        
        print("🎮 PPU Client Process Started")
        print("=" * 50)
        print("Rendering simulation data...")
        print("Close window to stop PPU (server continues)")
        print()
        
        if not client.start():
            print("❌ Failed to start PPU client")
            return
        
        try:
            # Keep client running
            while client.running:
                time.sleep(1)
                
                # Print client stats every 5 seconds
                if client.frame_count % 300 == 0:
                    stats = client.get_performance_stats()
                    print(f"📊 PPU Client: FPS: {stats['current_fps']:.1f}, Frames: {stats['frame_count']}")
        
        except KeyboardInterrupt:
            pass
        finally:
            client.cleanup()
            print("🎮 PPU Client Process Stopped")
    
    except Exception as e:
        logger.error(f"❌ PPU client process failed: {e}")
        print(f"❌ PPU client process failed: {e}")

def run_terminal_client(queue: multiprocessing.Queue):
    """Run terminal client in separate process"""
    try:
        from dgt_core.client import UIClient, ClientConfig, DisplayMode
        
        config = ClientConfig(
            display_mode=DisplayMode.TERMINAL,
            update_rate_hz=10,  # Lower rate for terminal
            max_queue_size=5,
            local_mode=True
        )
        
        client = UIClient(config)
        
        # Connect to local simulation via queue
        client.connect_to_local_server(queue)
        
        print("🖥️ Terminal Client Process Started")
        print("=" * 50)
        print("Monitoring simulation data...")
        print("Press Ctrl+C to stop")
        print()
        
        if not client.start():
            print("❌ Failed to start terminal client")
            return
        
        try:
            # Keep client running
            while client.running:
                time.sleep(2)
                
                # Print client stats every 10 seconds
                if client.frame_count % 50 == 0:
                    stats = client.get_performance_stats()
                    print(f"📊 Terminal Client: FPS: {stats['current_fps']:.1f}, Frames: {stats['frame_count']}")
        
        except KeyboardInterrupt:
            pass
        finally:
            client.cleanup()
            print("🖥️ Terminal Client Process Stopped")
    
    except Exception as e:
        logger.error(f"❌ Terminal client process failed: {e}")
        print(f"❌ Terminal client process failed: {e}")

def main():
    """Main entry point for live feed demo"""
    parser = argparse.ArgumentParser(
        description='DGT Live Feed Demo - Local-First Microservice Bridge',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Demonstrates ADR 123: Local-First Microservice Bridge

Examples:
  python live_feed_demo.py                    # Server + PPU + Terminal
  python live_feed_demo.py --ppu-only        # Server + PPU only
  python live_feed_demo.py --terminal-only   # Server + Terminal only
  python live_feed_demo.py --server-only     # Server only
        """
    )
    
    parser.add_argument('--ppu-only', action='store_true',
                       help='Run only PPU client with server')
    parser.add_argument('--terminal-only', action='store_true',
                       help='Run only terminal client with server')
    parser.add_argument('--server-only', action='store_true',
                       help='Run only simulation server')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    else:
        logger.remove()
        logger.add(sys.stderr, level="WARNING")
    
    print("🌐 DGT Live Feed Demo")
    print("ADR 123: Local-First Microservice Bridge")
    print("=" * 60)
    print("Demonstrating Server-Client separation")
    print()
    
    # Create inter-process communication queue
    queue = multiprocessing.Queue(maxsize=100)
    
    processes = []
    
    # Start simulation server
    server_process = multiprocessing.Process(
        target=run_simulation_server,
        args=(queue,)
    )
    server_process.start()
    processes.append(server_process)
    
    # Give server time to start
    time.sleep(1)
    
    # Start clients based on arguments
    if args.server_only:
        print("🧠 Running simulation server only...")
        print("   Server will continue running independently")
    else:
        if args.ppu_only:
            # PPU only
            ppu_process = multiprocessing.Process(
                target=run_ppu_client,
                args=(queue,)
            )
            ppu_process.start()
            processes.append(ppu_process)
            print("🎮 Running server + PPU client...")
        elif args.terminal_only:
            # Terminal only
            terminal_process = multiprocessing.Process(
                target=run_terminal_client,
                args=(queue,)
            )
            terminal_process.start()
            processes.append(terminal_process)
            print("🖥️ Running server + terminal client...")
        else:
            # Both clients
            ppu_process = multiprocessing.Process(
                target=run_ppu_client,
                args=(queue,)
            )
            ppu_process.start()
            processes.append(ppu_process)
            
            terminal_process = multiprocessing.Process(
                target=run_terminal_client,
                args=(queue,)
            )
            terminal_process.start()
            processes.append(terminal_process)
            
            print("🎮🖥️ Running server + PPU + terminal clients...")
        
        print("   Close PPU window - server continues running")
        print("   Stop terminal with Ctrl+C - server continues running")
    
    print()
    print("🎯 Live Feed Demo Running")
    print("   Press Ctrl+C to stop all processes")
    print()
    
    try:
        # Wait for processes to finish
        for process in processes:
            process.join()
    
    except KeyboardInterrupt:
        print("\n🛑 Stopping all processes...")
        for process in processes:
            if process.is_alive():
                process.terminate()
                process.join(timeout=2)
        print("✅ All processes stopped")
    
    finally:
        # Ensure all processes are stopped
        for process in processes:
            if process.is_alive():
                process.terminate()
                process.join(timeout=1)
    
    print("✅ Live Feed Demo completed")

if __name__ == "__main__":
    main()
