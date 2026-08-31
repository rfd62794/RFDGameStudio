import json
import pathlib
import re

from studio_mcp.zip_verify.source_resolver import SourceType, resolve_source

# Parse registry.ts imports to get the 30 live game configs, then read each
# config.ts for the real gameId. This avoids counting retired/unimported
# configs that happen to still live on disk.
registry_text = pathlib.Path("ts/src/games/registry.ts").read_text(encoding="utf-8")
imports = re.findall(
    r"import\s+\{?\s*([A-Za-z0-9_]+)\s*\}?\s+from\s+['\"]([^'\"]+)['\"]",
    registry_text,
)

config_dir = pathlib.Path("ts/src/games")
slugs: list[str] = []
for var_name, module_path in imports:
    base = config_dir / module_path.lstrip("./")
    config_path = base.parent / (base.name + ".ts")
    if not config_path.exists():
        config_path = base.parent / (base.name + ".tsx")
        if not config_path.exists():
            continue
    text = config_path.read_text(encoding="utf-8")
    m = re.search(r"gameId:\s*['\"]([^'\"]+)['\"]", text)
    if m:
        slugs.append(m.group(1))

results = []
counts = {"zip_source": 0, "tracked_dir_source": 0, "both": 0, "no_source_found": 0}
for slug in slugs:
    r = resolve_source(slug)
    counts[r["source_type"].value] += 1
    results.append(
        {
            "slug": slug,
            "source_type": r["source_type"].value,
            "intake_dir": str(r["intake_dir"]) if r["intake_dir"] else None,
            "examples_dir": str(r["examples_dir"]) if r["examples_dir"] else None,
            "resolved_examples_name": r["resolved_examples_name"],
        }
    )

print(f"Classified {len(results)} registry slugs")
print("Counts:", json.dumps(counts, indent=2))
print("\nPer-slug:")
for row in results:
    print(
        f"  {row['slug']:30} -> {row['source_type']:20} "
        f"(examples={row['resolved_examples_name']}, intake={'yes' if row['intake_dir'] else 'no'})"
    )
