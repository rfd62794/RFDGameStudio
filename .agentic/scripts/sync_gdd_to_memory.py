#!/usr/bin/env python3
import argparse
import re
import sys
import yaml
import requests
from pathlib import Path

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8")

MEMORY_API_URL = "http://localhost:8007/api/memories"
SOURCE_TAG = "openclaw-rfdgamestudio-bible"


def extract_frontmatter(gdd_path):
    with open(gdd_path, "r", encoding="utf-8") as f:
        content = f.read()
        match = re.search(r'^---\n(.*?)\n---\n', content, re.DOTALL)
        if not match:
            raise ValueError("No frontmatter found in GDD.")
        frontmatter = match.group(1)
        return yaml.safe_load(frontmatter)


def sync_gdd_to_memory(game):
    gdd_path = Path(__file__).parent.parent.parent / "bible" / "games" / game / "gdd.md"
    frontmatter = extract_frontmatter(gdd_path)
    content = (
        f"{frontmatter['title']}: {frontmatter.get('theme', '')}. "
        f"Core loop: {frontmatter['core_loop']}. "
        f"Win: {frontmatter['win_condition']}. "
        f"Loss: {frontmatter['loss_condition']}."
    )

    try:
        response = requests.post(
            MEMORY_API_URL,
            json={
                "key": f"rfdgamestudio:{game}_gdd",
                "content": content,
                "layer": "project",
                "source": SOURCE_TAG,
            },
            timeout=10,
        )
        response.raise_for_status()
        print(f"OK: Synced {game} GDD to RFD Memory MCP (source={SOURCE_TAG}).")
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to sync {game} GDD: {e}")
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync GDD to RFD Memory MCP.")
    parser.add_argument("--game", required=True, help="Game ID (e.g., 'voiddrift-redux-core-loop').")
    args = parser.parse_args()
    sync_gdd_to_memory(args.game)