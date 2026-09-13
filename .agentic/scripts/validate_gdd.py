#!/usr/bin/env python3
import argparse
import json
import re
import yaml
from pathlib import Path
from jsonschema import validate, ValidationError

def load_schema():
    schema_path = Path(__file__).parent.parent / "schemas" / "gdd.schema.json"
    with open(schema_path, "r") as f:
        return json.load(f)

def extract_frontmatter(gdd_path):
    with open(gdd_path, "r") as f:
        content = f.read()
        match = re.search(r'^---\n(.*?)\n---\n', content, re.DOTALL)
        if not match:
            raise ValueError("No frontmatter found in GDD.")
        frontmatter = match.group(1)
        return yaml.safe_load(frontmatter)

def validate_gdd(gdd_path):
    schema = load_schema()
    frontmatter = extract_frontmatter(gdd_path)
    try:
        validate(instance=frontmatter, schema=schema)
        print(f"OK: {gdd_path} is valid.")
        return True
    except ValidationError as e:
        print(f"ERROR: {gdd_path} is invalid: {e.message}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate GDD against schema.")
    parser.add_argument("--game", required=True, help="Game ID (e.g., 'voiddrift').")
    args = parser.parse_args()

    gdd_path = Path(__file__).parent.parent.parent / "bible" / "games" / args.game / "gdd.md"
    validate_gdd(gdd_path)