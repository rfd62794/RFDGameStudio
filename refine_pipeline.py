#!/usr/bin/env python3
import subprocess
from pathlib import Path

# Real games documented in bible/games/. Generic genre pages live in
# bible/templates/ and are intentionally not validated or synced as games.
GAMES = [
    "voiddrift", "trinity-siege", "shoal", "slimeworld", "7-days-to-fry",
    "planetofgreed", "mutant-battle-ball", "slime-coin", "rogue-slither",
    "ant-colony", "slime-breeder", "voidrift-redux",
]

def validate_all_gdds():
    """Validate all GDDs in the Project Bible."""
    for game in GAMES:
        subprocess.run(["python", ".agentic/scripts/validate_gdd.py", "--game", game])

def sync_all_gdds_to_memory():
    """Sync all GDDs to RFD Memory MCP."""
    for game in GAMES:
        subprocess.run(["python", ".agentic/scripts/sync_gdd_to_memory.py", "--game", game])

def validate_all_code_mechanics():
    """Validate code vs. GDDs/mechanics for all games."""
    report_path = "reports/code_mechanics_validation.md"
    Path("reports").mkdir(exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Code-Mechanics Validation Report\n\n")
        for game in GAMES:
            f.write(f"## {game}\n")
            subprocess.run([
                "python", ".agentic/scripts/validate_code_mechanics.py", "--game", game
            ], stdout=f)
    print(f"OK: Code-mechanics validation report generated: {report_path}")

import yaml
from datetime import datetime

def load_tool_registry():
    """Load tools from registry.yaml."""
    with open("tools/registry.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)["tools"]

def validate_all_tools():
    """Validate tools using registry.yaml."""
    tools = load_tool_registry()
    report_path = "reports/tool_validation.md"
    Path("reports").mkdir(exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Tool Validation Report\n\n")
        for tool in tools:
            f.write(f"## {tool['name']}\n")
            subprocess.run([
                "python", ".agentic/scripts/validate_tool.py", "--tool", tool["name"]
            ], stdout=f, text=True, bufsize=1, encoding="utf-8", errors="replace")
            subprocess.run([
                "python", ".agentic/scripts/sync_tool_to_memory.py", "--tool", tool["name"]
            ], stdout=f, text=True, bufsize=1, encoding="utf-8", errors="replace")
    print(f"OK: Tool validation report generated: {report_path}")

def append_report_to_memory():
    """Append validation summaries to memory."""
    date_str = datetime.now().strftime("%Y-%m-%d")
    target_file = Path(f"memory/{date_str}.md")
    if not target_file.exists():
        target_file.write_text(f"# Daily Log - {date_str}\n", encoding="utf-8")
    tool_count = len(load_tool_registry())
    with open(target_file, "a", encoding="utf-8") as f:
        f.write(f"\n\n### ✅ Validation Reports ({date_str})\n")
        f.write("- **Code-Mechanics Report**: `reports/code_mechanics_validation.md`.\n")
        f.write("- **Tool Validation Report**: `reports/tool_validation.md`.\n")
        f.write(f"- **Coverage**: All {len(GAMES)} games + {tool_count} tools.\n")
        f.write(f"<!-- project: path:{Path(__file__).resolve().parent} -->\n")

if __name__ == "__main__":
    print("-> Starting nightly pipeline...")
    validate_all_gdds()
    sync_all_gdds_to_memory()
    validate_all_code_mechanics()
    validate_all_tools()
    append_report_to_memory()
    print("OK: Nightly pipeline complete.")
