#!/usr/bin/env python
"""
Run NEAT Asteroids Evolution Demo

This script starts the Python NEAT game engine and listens for Godot connections.
Start Godot in another terminal to see the visual rendering.
"""

import sys
import time

# Add repo to path
sys.path.insert(0, '.')

from src.game_engine.godot.asteroids_neat_game import AsteroidsNEATGame

def main():
    print("=" * 70)
    print("NEAT ASTEROIDS EVOLUTION DEMO")
    print("=" * 70)
    print()

    print("[Setup]")
    print("  - Creating NEAT game with 5 AI pilots")
    print("  - Each generation runs for 30 seconds")
    print("  - Listening on localhost:9001 for Godot")
    print()

    # Create game
    # Select renderer
    try:
        import pygame
        renderer = 'pygame'
        print("[Renderer: PyGame]")
    except ImportError:
        renderer = 'terminal'
        print("[Renderer: Terminal (PyGame not found)]")

    # Create game
    game = AsteroidsNEATGame(
        population_size=5,
        target_fps=60,  # 60 FPS for PyGame
        godot_host='localhost',
        godot_port=9001,
        max_episode_time=30.0,
        renderer=renderer
    )

    print("[Initializing...]")

    if not game.initialize():
        print("[ERROR] Failed to initialize game")
        print("  - Godot not connected on port 9001")
        return

    print("[SUCCESS] Game initialized!")
    print()
    print("[Configuration]")
    print(f"  Population Size: {game.population_size} pilots")
    print(f"  Target FPS: {game.target_fps}")
    print(f"  Episode Duration: {game.max_episode_time}s")
    print(f"  Renderer: {renderer.upper()}")
    print()

    print("[Instructions]")
    if renderer == 'pygame':
        print("  1. Watch the game window")
        print("  2. Close window to stop")
    else:
        print("  1. Watch the game render below")
        print("  2. Press Ctrl+C to stop")
    print()
    print()

    print("[Running Demo]")
    print("  Press Ctrl+C to stop")
    print()
    print("-" * 70)

    start_time = time.time()
    loop_start = time.time()

    try:
        while (time.time() - start_time) < 300:  # 5 minute demo
            frame_start = time.time()

            # Update game frame
            game._update_frame()

            # Update stats
            game.frame_count += 1
            game.current_time = time.time() - loop_start
            game.stats.time_elapsed = game.current_time
            game.stats.total_frames = game.frame_count

            # Check if generation is over
            if time.time() - game.generation_start_time > game.max_episode_time:
                game._end_generation()
                game._spawn_pilot_population()

            # Frame timing
            frame_duration = time.time() - frame_start
            sleep_time = game.frame_time - frame_duration
            if sleep_time > 0:
                time.sleep(sleep_time)

            # Print status every 1 second
            if game.frame_count % 60 == 0:
                active_pilots = len([p for p in game.active_pilots.values() if p.alive])
                elapsed = time.time() - start_time
                print(f"Frame {game.frame_count:5d} | Gen {game.generation:2d} | Pilots: {active_pilots}/{game.population_size} | Elapsed: {elapsed:.0f}s", flush=True)

        print()
        print("[Demo Completed - Timeout reached]")

    except KeyboardInterrupt:
        print()
        print("[Demo Stopped - User interrupt]")
    except Exception as e:
        print()
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        print()
        print("[Shutting down...]")
        game.shutdown()
        print("[Complete]")

if __name__ == "__main__":
    main()
