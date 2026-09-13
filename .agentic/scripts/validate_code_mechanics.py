#!/usr/bin/env python3
import argparse
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def extract_gdd_requirements(gdd_path):
    """Extract core loop, win/loss conditions from GDD."""
    if not Path(gdd_path).exists():
        return {}
    with open(gdd_path, "r", encoding="utf-8") as f:
        content = f.read()
    core_loop = re.search(r"core_loop:\s*\"(.*?)\"", content)
    win_condition = re.search(r"win_condition:\s*\"(.*?)\"", content)
    loss_condition = re.search(r"loss_condition:\s*\"(.*?)\"", content)
    return {
        "core_loop": core_loop.group(1) if core_loop else "",
        "win_condition": win_condition.group(1) if win_condition else "",
        "loss_condition": loss_condition.group(1) if loss_condition else ""
    }

def extract_mechanics_requirements(mechanics_path):
    """Extract mechanics from mechanics.md."""
    if not Path(mechanics_path).exists():
        return []
    with open(mechanics_path, "r", encoding="utf-8") as f:
        content = f.read()
    mechanics = re.findall(r"-\s\*\*(.*?)\*\*:", content)
    return mechanics

def validate_code(game_id, gdd_path, mechanics_path, code_path):
    """Validate code against GDD and mechanics, accounting for language."""
    gdd_reqs = extract_gdd_requirements(gdd_path)
    mechanics_reqs = extract_mechanics_requirements(mechanics_path)

    # Detect language (Lua, Typescript, or Lua/YAML)
    if Path(f"{code_path}/src/main.lua").exists():
        code_files = list(Path(code_path).rglob("*.lua"))
        language = "lua"
    elif Path(f"{code_path}/src/main.ts").exists():
        code_files = list(Path(code_path).rglob("*.ts"))
        language = "typescript"
    else:
        code_files = list(Path(code_path).rglob("*.lua")) + list(Path(code_path).rglob("*.yaml"))
        language = "lua_yaml"

    report = {
        "game": game_id,
        "language": language,
        "gdd_compliance": {},
        "mechanics_compliance": {}
    }

    # Validate GDD compliance
    for req, desc in gdd_reqs.items():
        found = any(desc.lower() in file.read_text(encoding="utf-8", errors="ignore").lower() for file in code_files) if desc else False
        report["gdd_compliance"][req] = {"implemented": found, "description": desc}

    # Validate mechanics compliance
    for mechanic in mechanics_reqs:
        found = any(mechanic.lower() in file.read_text(encoding="utf-8", errors="ignore").lower() for file in code_files)
        report["mechanics_compliance"][mechanic] = {"implemented": found}

    return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate code against GDDs and mechanics.")
    parser.add_argument("--game", required=True, help="Game ID (e.g., 'voiddrift').")
    args = parser.parse_args()

    gdd_path = f"bible/games/{args.game}/gdd.md"
    mechanics_path = f"bible/games/{args.game}/mechanics.md"
    code_path = f"examples/{args.game}/"

    report = validate_code(args.game, gdd_path, mechanics_path, code_path)
    print(f"# Code-Mechanics Validation Report: {args.game}\n")
    print("## GDD Compliance")
    for req, data in report["gdd_compliance"].items():
        status = "OK" if data["implemented"] else "MISSING"
        print(f"- {status} {req}: {data['description']}")

    print("\n## Mechanics Compliance")
    for mechanic, data in report["mechanics_compliance"].items():
        status = "OK" if data["implemented"] else "MISSING"
        print(f"- {status} {mechanic}")