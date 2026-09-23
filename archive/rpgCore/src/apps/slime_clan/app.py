"""
SlimeClanApp — Thin Launcher (Session 030)
Refactored into modular scenes and pure UI rendering functions.
"""

from loguru import logger
from src.shared.engine.scene_manager import SceneManager
from src.apps.slime_clan.constants import WINDOW_WIDTH, WINDOW_HEIGHT, FPS, NODE_COLORS, NodeType
from src.apps.slime_clan.scenes.overworld_scene import OverworldScene
from src.apps.slime_clan.scenes.battle_field_scene import BattleFieldScene
from src.apps.slime_clan.scenes.auto_battle_scene import AutoBattleScene

def create_app() -> SceneManager:
    """Create and configure the SlimeClanApp with modular scenes."""
    manager = SceneManager(
        width=WINDOW_WIDTH,
        height=WINDOW_HEIGHT,
        title="rpgCore — Slime Clan",
        fps=FPS,
    )
    manager.register("overworld", OverworldScene)
    manager.register("battle_field", BattleFieldScene)
    manager.register("auto_battle", AutoBattleScene)
    return manager

if __name__ == "__main__":
    logger.info("🚀 Launching Slime Clan (Session 030 — God Class Eliminated)...")
    app = create_app()
    app.run("overworld")
