import os
import re

dirs_to_search = ['src', 'tests', 'docs', 'archive', 'STRATEGIC_INVENTORY.md', 'SPRITE_SYSTEMS_AUDIT.md', 'PHASE_3_RENDERING_CONTEXT.md', 'COMPREHENSIVE_ENGINE_INVENTORY.md']
base_dir = r"c:\Github\rpgCore"

replacements = {
    re.compile(r'\bMOSS\b'): 'MARSH',
    re.compile(r'\bMoss\b'): 'Marsh',
    re.compile(r'\bmoss\b'): 'marsh',
    re.compile(r'\bCOASTAL\b'): 'TUNDRA',
    re.compile(r'\bCoastal\b'): 'Tundra',
    re.compile(r'\bcoastal\b'): 'tundra',
    re.compile(r'\bMIXED\b'): 'VARIED',
    re.compile(r'\bMixed\b'): 'Varied',
    re.compile(r'\bmixed\b'): 'varied',
}

def process_file(filepath):
    if not filepath.endswith(('.py', '.md')):
        return
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    new_content = content
    for pattern, repl in replacements.items():
        new_content = pattern.sub(repl, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root_item in dirs_to_search:
    full_path = os.path.join(base_dir, root_item)
    if os.path.isfile(full_path):
        process_file(full_path)
    elif os.path.isdir(full_path):
        for root, _, files in os.walk(full_path):
            for file in files:
                process_file(os.path.join(root, file))
