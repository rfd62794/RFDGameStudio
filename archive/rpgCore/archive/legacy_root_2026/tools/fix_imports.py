import os
import glob

def fix_imports_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    content = content.replace('from foundation', 'from src.dgt_engine.foundation')
    content = content.replace('import foundation', 'import src.dgt_engine.foundation as foundation')
    content = content.replace('from engines', 'from src.dgt_engine.engines')
    content = content.replace('import engines', 'import src.dgt_engine.engines as engines')
    
    # pathlib replacements
    content = content.replace('src_path / "foundation"', 'src_path / "dgt_engine" / "foundation"')
    content = content.replace('src_path / "engines"', 'src_path / "dgt_engine" / "engines"')
    
    # Re-normalize if already pointing to dgt_engine properly in some test files
    content = content.replace('src.dgt_engine.foundation', 'dgt_engine.foundation')
    content = content.replace('src.dgt_engine.engines', 'dgt_engine.engines')


    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed imports in {filepath}")
        return True
    return False

def main():
    test_files = glob.glob('tests/**/*.py', recursive=True) + glob.glob('tests/*.py') + glob.glob('tests/unit/**/*.py', recursive=True) + glob.glob('tests/unit/*.py')
    fixed_count = 0
    for file in test_files:
        if fix_imports_in_file(file):
            fixed_count += 1
    print(f"Fixed {fixed_count} files.")

if __name__ == "__main__":
    main()
