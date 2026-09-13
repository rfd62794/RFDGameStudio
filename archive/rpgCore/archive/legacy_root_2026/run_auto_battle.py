#!/usr/bin/env python3
"""
Launcher for Session 013 - Auto-Battle Scene
--------------------------------------------
Execute this file from the repository root to start the Slime Clan Auto-Battler.
"""
from src.apps.slime_clan.auto_battle import AutoBattleScene

if __name__ == "__main__":
    app = AutoBattleScene()
    app.run()
