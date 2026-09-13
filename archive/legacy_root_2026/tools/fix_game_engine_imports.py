import os
import glob
import re

def fix_imports_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # game_engine fixes
    content = content.replace('from game_engine', 'from src.game_engine')
    content = content.replace('import game_engine', 'import src.game_engine as game_engine')
    
    # Fix instances where src.src might have happened
    content = content.replace('src.src.', 'src.')
    
    # Fix from src.something where they run without pythonpath
    # A lot of tests assumed PYTHONPATH=src
    content = content.replace('from src.game_engine', 'from src.game_engine')
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed imports in {filepath}")
        return True
    return False

def main():
    test_files = glob.glob('tests/unit/**/*.py', recursive=True) + glob.glob('tests/unit/*.py')
    
    # Also fix the actual src files since the traceback in out1.txt showed:
    # src\game_engine\foundation\config_manager.py:9: in <module>
    #     from game_engine.foundation.asset_registry import AssetRegistry
    src_files = glob.glob('src/game_engine/**/*.py', recursive=True)
    
    all_files = test_files + src_files
    
    fixed_count = 0
    for file in all_files:
        if fix_imports_in_file(file):
            fixed_count += 1
    print(f"Fixed {fixed_count} files.")

if __name__ == "__main__":
    main()
