"""
convert_to_yaml.py — One-time migration from frontmatter markdown to pure YAML.
Run once to generate .yaml files, then the parser reads those directly.
"""
import yaml
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[4]

CONVERSIONS = {
    "goals":      ("docs/planning/GOALS.md",         "docs/planning/goals.yaml"),
    "milestones": ("docs/planning/MILESTONES.md",    "docs/planning/milestones.yaml"),
    "tasks":      ("docs/planning/TASKS.md",         "docs/planning/tasks.yaml"),
    "journal":    ("docs/journal/PROJECT_JOURNAL.md","docs/journal/journal.yaml"),
}


def extract_blocks(text: str) -> list[dict]:
    blocks = []
    parts = text.split("---")
    for part in parts:
        part = part.strip()
        if not part:
            continue
        try:
            data = yaml.safe_load(part)
            if isinstance(data, dict) and "id" in data:
                blocks.append(data)
        except yaml.YAMLError:
            continue
    return blocks


def convert_file(md_path: Path, yaml_path: Path) -> int:
    if not md_path.exists():
        print(f"SKIP: {md_path.name} not found")
        return 0
    text = md_path.read_text(encoding="utf-8")
    records = extract_blocks(text)
    yaml_path.write_text(
        yaml.dump(records, allow_unicode=True,
                  sort_keys=False, default_flow_style=False),
        encoding="utf-8",
    )
    print(f"OK: {md_path.name} → {yaml_path.name} ({len(records)} records)")
    return len(records)


if __name__ == "__main__":
    total = 0
    for key, (src, dst) in CONVERSIONS.items():
        total += convert_file(
            PROJECT_ROOT / src,
            PROJECT_ROOT / dst,
        )
    print(f"\nTotal records migrated: {total}")
