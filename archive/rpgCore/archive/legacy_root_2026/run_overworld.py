#!/usr/bin/env python3
"""
Launcher for Slime Clan — Single Window Application
----------------------------------------------------
Execute from the repository root: uv run python run_overworld.py
"""

from loguru import logger

if __name__ == "__main__":
    logger.info("🚀 Launching Slime Clan (Session 030 — Modular Architecture)...")
    from src.apps.slime_clan.app import create_app
    app = create_app()
    app.run("overworld")
