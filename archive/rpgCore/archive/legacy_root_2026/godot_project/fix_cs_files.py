#!/usr/bin/env python3
"""Fix C# files for Godot 4.6 compatibility."""

import os
import re

def fix_file(filepath):
    """Fix a single C# file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix Python docstrings to C# comments
    content = re.sub(r'^"""', '/*', content, flags=re.MULTILINE)
    content = re.sub(r'^"""$', '*/', content, flags=re.MULTILINE)

    # Fix namespace
    content = content.replace('namespace DgtEngine', 'namespace rpgCore')

    # Add partial keyword to Main and GameEntityRenderer
    if 'Main.cs' in filepath:
        content = re.sub(r'public class Main\s+:', 'public partial class Main :', content)
    if 'GoddotRenderer.cs' in filepath or 'GameEntityRenderer.cs' in filepath:
        content = re.sub(r'public class (\w+Renderer)\s+:', r'public partial class \1 :', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
    else:
        print(f"No changes: {filepath}")

# Fix all CS files
for root, dirs, files in os.walk('.'):
    for filename in files:
        if filename.endswith('.cs'):
            filepath = os.path.join(root, filename)
            fix_file(filepath)

print("\nDone!")
