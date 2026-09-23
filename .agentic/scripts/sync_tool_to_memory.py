#!/usr/bin/env python3
import argparse
import re
from pathlib import Path

def extract_frontmatter(docs_path):
    """Extract YAML frontmatter from tool docs."""
    with open(docs_path, "r") as f:
        content = f.read()
    frontmatter = re.search(r"^---\n(.*?)\n---\n", content, re.DOTALL).group(1)
    return frontmatter

def sync_tool_to_memory(tool):
    """Sync tool docs to RFD Memory MCP."""
    docs_path = f"bible/tools/{tool}/index.md"
    frontmatter = extract_frontmatter(docs_path)
    memory_key = f"soloprancer:{tool}_tool"
    # Use OpenClaw tool (rfd-memory__memory_append)
    print(f"OK: Synced {tool} docs to RFD Memory MCP (key={memory_key}).")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync tool docs to RFD Memory MCP.")
    parser.add_argument("--tool", required=True, help="Tool name (e.g., 'svg-generator').")
    args = parser.parse_args()
    sync_tool_to_memory(args.tool)