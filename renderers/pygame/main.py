#!/usr/bin/env python3
"""
RFDGameStudio PyGame Renderer — entry point.

Usage:
  uv run python renderers/pygame/main.py                  # horse_racing (default)
  uv run python renderers/pygame/main.py horse_racing
"""
import sys


AVAILABLE_GAMES = {
    'horse_racing': 'renderers.pygame.games.horse_racing.renderer.HorseRacingRenderer',
}


def main() -> None:
    game_id = sys.argv[1] if len(sys.argv) > 1 else 'horse_racing'

    if game_id not in AVAILABLE_GAMES:
        print(f"Unknown game: '{game_id}'")
        print(f"Available: {', '.join(AVAILABLE_GAMES)}")
        sys.exit(1)

    module_path, class_name = AVAILABLE_GAMES[game_id].rsplit('.', 1)
    import importlib
    module = importlib.import_module(module_path)
    RendererClass = getattr(module, class_name)

    renderer = RendererClass()
    renderer.run()


if __name__ == '__main__':
    main()
