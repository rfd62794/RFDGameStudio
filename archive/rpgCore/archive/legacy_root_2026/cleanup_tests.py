import os
import shutil
import subprocess
from pathlib import Path

archive_dir = Path("archive/dead_tests_2026")
archive_dir.mkdir(parents=True, exist_ok=True)

readme_content = """# Dead Tests Archive 2026

These tests have been archived because they reference modules that no longer exist in the codebase.
This includes old systems like `world_ledger`, `dgt_core`, `rpg_core`, `semantic_engine`, and various other deprecated architectural stubs.

They are kept here for historical reference and should not be run by pytest.
"""
(archive_dir / "README.md").write_text(readme_content, encoding="utf-8")

dead_keywords = [
    "world_ledger", "dgt_core", "rpg_core", "semantic_engine", "narrative_bridge", 
    "quartermaster", "apps.tycoon", "actors", "body.dispatcher", "core.simulator", 
    "tools.design_lab", "ui.render_passes", "ui.pixel_renderer", "ui.sprite_factory", 
    "assets.starter_loader", "assets.raw_loader", "assets.sovereign_schema", "src.tools", 
    "src.logic", "src.config", "src.models", "src.graphics", "src.assets", 
    "src.game_engine.godot", "src.game_engine.foundation.asset_registry", 
    "game_engine.foundation.asset_registry", "game_engine.engines.godot_bridge", 
    "d20_core", "dgt_engine.engines"
]

explicit_files = [
    Path("tests/unit/test_territorial_grid.py"),
    Path("tests/unit/configuration_test.py"),
    Path("tests/unit/foundation_assets_test.py")
]

def git_mv(src, dest):
    try:
        subprocess.run(["git", "mv", str(src), str(dest)], check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError:
        shutil.move(src, dest)
        return False

tests_dir = Path("tests")
moved_count = 0

for file in tests_dir.rglob("*.py"):
    if file in explicit_files:
        continue
    
    try:
        content = file.read_text(encoding="utf-8")
        needs_move = False
        
        for line in content.splitlines():
            line = line.strip()
            if line.startswith("import ") or line.startswith("from "):
                for kw in dead_keywords:
                    # We look for the exact module substring in the import line
                    if kw in line:
                        needs_move = True
                        break
            if needs_move:
                break
                
        if needs_move:
            dest = archive_dir / file.name
            if dest.exists():
                dest = archive_dir / f"{file.parent.name}_{file.name}"
            git_mv(file, dest)
            moved_count += 1
            print(f"Archived {file} (Keyword match)")
    except Exception as e:
        print(f"Error processing {file}: {e}")

for file in explicit_files:
    if file.exists():
        dest = archive_dir / file.name
        if dest.exists():
            dest = archive_dir / f"{file.parent.name}_{file.name}"
        git_mv(file, dest)
        moved_count += 1
        print(f"Archived {file} (Explicit)")

print(f"Total files archived: {moved_count}")
