#!/usr/bin/env python3
import argparse
import yaml
from pathlib import Path

def load_tool_model(tool_name):
    """Load default model for a tool from registry.yaml."""
    with open("tools/registry.yaml", "r") as f:
        tools = yaml.safe_load(f)["tools"]
    for tool in tools:
        if tool["name"] == tool_name:
            return tool["model"]
    return "claude-3.5-sonnet"  # Fallback

def validate_tool_config(tool_path, tool_name):
    """Validate tool configuration (e.g., config.yaml)."""
    model = load_tool_model(tool_name)
    print(f"Using model: {model} for {tool_name}")
    config_path = f"{tool_path}/config.yaml"
    if not Path(config_path).exists():
        print(f"MISSING: {config_path}")
        return False
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    print(f"OK: {config_path} is valid.")
    return True

def validate_tool_docs(tool_path):
    """Validate tool documentation (e.g., index.md)."""
    docs_path = f"{tool_path}/index.md"
    if not Path(docs_path).exists():
        print(f"MISSING: {docs_path}")
        return False
    print(f"OK: {docs_path} is valid.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate tool configurations and docs.")
    parser.add_argument("--tool", required=True, help="Tool name (e.g., 'svg-generator').")
    args = parser.parse_args()
    tool_path = f"tools/{args.tool}/"
    validate_tool_config(tool_path, args.tool)
    validate_tool_docs(tool_path)