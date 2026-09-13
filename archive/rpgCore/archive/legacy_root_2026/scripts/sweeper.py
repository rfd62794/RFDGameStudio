"""
DGT Platform — Sweeper: Import-Linkage Mapper & Dead Code Detector

Run: python scripts/sweeper.py [--src-root src] [--json] [--verbose]

Outputs:
  1. Import graph (who imports whom)
  2. Circular dependency detection
  3. Dead module detection (files never imported by any script/test)
  4. Tier-violation detection (Application→Foundation skipping Engine is OK,
     but Foundation→Application is hazardous)

Designed to produce a machine-readable JSON manifest for AI-assisted refactoring.
"""

from __future__ import annotations

import argparse
import ast
import json
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


# ─── Tier Classification ───────────────────────────────────────────────

TIER_RULES: dict[str, list[str]] = {
    "foundation": [
        "foundation",
        "di",
        "exceptions",
        "common",
        "config",
    ],
    "engine": [
        "engines",
        "logic",
        "models",
        "assets",
        "d20_core",
        "engine",
        "chronos",
        "arbiter_engine",
        "deterministic_arbiter",
        "semantic_engine",
        "narrative_engine",
        "predictive_narrative",
        "chronicler",
        "chronicler_engine",
        "world_ledger",
        "world_factory",
        "character_factory",
        "location_factory",
        "objective_factory",
        "loot_system",
        "quartermaster",
        "game_state",
        "model_factory",
        "factories",
        "scenarios",
        "narrative_bridge",
        "narrator",
        "world_map",
        "sync_engines",
    ],
    "application": [
        "apps",
        "actors",
        "narrative",
        "views",
        "ui",
        "graphics",
        "body",
        "interface",
        "interfaces",
        "tools",
        "main",
        "game_loop",
        "game_loop_refactored",
        "survival_game",
        "survival_game_ppu",
        "survival_game_simple",
        "voyager_agent",
        "voyager_logic",
        "voyager_sync",
        "api",
        "vector_libraries",
        "world",
        "mechanics",
    ],
    "scripts": [
        "benchmark_performance",
        "benchmark_solid_architecture",
        "benchmark_turn_around",
        "validate_deterministic",
        "final_sanity_check",
        "dgt_optimization",
    ],
}

HAZARDOUS_DIRECTIONS: list[tuple[str, str]] = [
    ("foundation", "application"),
    ("foundation", "scripts"),
    ("engine", "application"),
    ("engine", "scripts"),
]


@dataclass
class ModuleInfo:
    """Metadata for a single Python module."""

    path: Path
    rel_path: str
    tier: str
    size_bytes: int
    imports: list[str] = field(default_factory=list)
    imported_by: list[str] = field(default_factory=list)
    line_count: int = 0
    classes: list[str] = field(default_factory=list)
    functions: list[str] = field(default_factory=list)
    parse_error: str | None = None


def classify_tier(rel_path: str) -> str:
    """Classify a relative path into a tier based on its top-level component."""
    parts = Path(rel_path).parts
    if not parts:
        return "unknown"

    top_level = parts[0].replace(".py", "")

    for tier, prefixes in TIER_RULES.items():
        if top_level in prefixes:
            return tier

    return "unknown"


def extract_imports(filepath: Path) -> tuple[list[str], int, list[str], list[str], str | None]:
    """Extract import targets, line count, classes, and functions from a Python file."""
    try:
        source = filepath.read_text(encoding="utf-8", errors="replace")
    except OSError as e:
        return [], 0, [], [], str(e)

    lines = source.splitlines()
    line_count = len(lines)

    try:
        tree = ast.parse(source, filename=str(filepath))
    except SyntaxError as e:
        return [], line_count, [], [], f"SyntaxError: {e}"

    imports: list[str] = []
    classes: list[str] = []
    functions: list[str] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module)
        elif isinstance(node, ast.ClassDef):
            classes.append(node.name)
        elif isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            if not isinstance(getattr(node, "_parent", None), ast.ClassDef):
                functions.append(node.name)

    return imports, line_count, classes, functions, None


def resolve_internal_import(
    import_name: str,
    module_map: dict[str, str],
) -> str | None:
    """Try to resolve an import name to a known internal module."""
    # Direct match
    if import_name in module_map:
        return import_name

    # Try progressively shorter prefixes (handles from pkg.mod import thing)
    parts = import_name.split(".")
    for i in range(len(parts), 0, -1):
        candidate = ".".join(parts[:i])
        if candidate in module_map:
            return candidate

    return None


def detect_cycles(graph: dict[str, set[str]]) -> list[list[str]]:
    """Detect circular dependency cycles using DFS."""
    visited: set[str] = set()
    on_stack: set[str] = set()
    cycles: list[list[str]] = []
    path: list[str] = []

    def dfs(node: str) -> None:
        visited.add(node)
        on_stack.add(node)
        path.append(node)

        for neighbor in graph.get(node, set()):
            if neighbor not in visited:
                dfs(neighbor)
            elif neighbor in on_stack:
                cycle_start = path.index(neighbor)
                cycle = path[cycle_start:] + [neighbor]
                cycles.append(cycle)

        path.pop()
        on_stack.discard(node)

    for node in graph:
        if node not in visited:
            dfs(node)

    return cycles


def scan_repository(src_root: Path) -> dict[str, ModuleInfo]:
    """Scan all Python files under src_root and build module metadata."""
    modules: dict[str, ModuleInfo] = {}

    py_files = sorted(src_root.rglob("*.py"))
    py_files = [f for f in py_files if "__pycache__" not in f.parts]

    for filepath in py_files:
        rel = filepath.relative_to(src_root)
        rel_str = str(rel).replace("\\", "/")

        # Build module name from path
        mod_parts = list(rel.with_suffix("").parts)
        if mod_parts[-1] == "__init__":
            mod_parts.pop()
        module_name = ".".join(mod_parts) if mod_parts else rel_str

        tier = classify_tier(rel_str)
        size = filepath.stat().st_size

        imports, line_count, classes, functions, error = extract_imports(filepath)

        modules[module_name] = ModuleInfo(
            path=filepath,
            rel_path=rel_str,
            tier=tier,
            size_bytes=size,
            imports=imports,
            line_count=line_count,
            classes=classes,
            functions=functions,
            parse_error=error,
        )

    return modules


def build_linkage_report(
    modules: dict[str, ModuleInfo],
) -> dict[str, Any]:
    """Build the full linkage report with all analysis results."""

    # Build a lookup: module_name → rel_path
    module_map: dict[str, str] = {}
    for name, info in modules.items():
        module_map[name] = info.rel_path
        # Also register by dotted-path for resolution
        dot_path = info.rel_path.replace("/", ".").removesuffix(".py")
        module_map[dot_path] = info.rel_path

    # Resolve internal imports and build dependency graph
    dep_graph: dict[str, set[str]] = defaultdict(set)
    tier_violations: list[dict[str, str]] = []

    for mod_name, info in modules.items():
        for raw_import in info.imports:
            resolved = resolve_internal_import(raw_import, module_map)
            if resolved and resolved != mod_name:
                info_target = modules.get(resolved)
                dep_graph[mod_name].add(resolved)

                if info_target:
                    info_target.imported_by.append(mod_name)

                    # Check for tier violations
                    src_tier = info.tier
                    dst_tier = info_target.tier
                    if (src_tier, dst_tier) in HAZARDOUS_DIRECTIONS:
                        tier_violations.append({
                            "source": info.rel_path,
                            "source_tier": src_tier,
                            "target": info_target.rel_path,
                            "target_tier": dst_tier,
                            "import": raw_import,
                            "severity": "HAZARDOUS",
                        })

    # Find dead modules (never imported by anything)
    all_entry_points = {
        name for name, info in modules.items()
        if info.rel_path.startswith(("main", "game_loop", "survival_game"))
        or "__init__" in info.rel_path
        or info.tier == "scripts"
    }

    dead_modules: list[dict[str, str]] = []
    for name, info in modules.items():
        if (
            not info.imported_by
            and name not in all_entry_points
            and "__init__" not in info.rel_path
        ):
            dead_modules.append({
                "module": name,
                "path": info.rel_path,
                "tier": info.tier,
                "size_bytes": info.size_bytes,
                "line_count": info.line_count,
            })

    # Detect circular dependencies
    cycles = detect_cycles(dep_graph)

    # Tier distribution
    tier_counts: dict[str, int] = defaultdict(int)
    tier_size: dict[str, int] = defaultdict(int)
    for info in modules.values():
        tier_counts[info.tier] += 1
        tier_size[info.tier] += info.size_bytes

    # High-risk monoliths (>20KB or >500 lines)
    monoliths: list[dict[str, Any]] = []
    for name, info in modules.items():
        if info.size_bytes > 20_000 or info.line_count > 500:
            monoliths.append({
                "module": name,
                "path": info.rel_path,
                "tier": info.tier,
                "size_kb": round(info.size_bytes / 1024, 1),
                "lines": info.line_count,
                "classes": len(info.classes),
                "functions": len(info.functions),
                "imports_count": len(info.imports),
                "imported_by_count": len(info.imported_by),
            })

    monoliths.sort(key=lambda m: m["size_kb"], reverse=True)

    return {
        "summary": {
            "total_modules": len(modules),
            "tier_distribution": dict(tier_counts),
            "tier_size_kb": {k: round(v / 1024, 1) for k, v in tier_size.items()},
        },
        "tier_violations": tier_violations,
        "circular_dependencies": [
            {"cycle": c, "length": len(c) - 1} for c in cycles
        ],
        "dead_modules": sorted(dead_modules, key=lambda d: d["size_bytes"], reverse=True),
        "monoliths": monoliths,
        "parse_errors": [
            {"module": name, "path": info.rel_path, "error": info.parse_error}
            for name, info in modules.items()
            if info.parse_error
        ],
    }


def print_text_report(report: dict[str, Any]) -> None:
    """Print a human-readable summary to stdout."""
    summary = report["summary"]

    print("=" * 70)
    print("  DGT PLATFORM — SWEEPER REPORT")
    print("=" * 70)
    print()
    print(f"  Total modules scanned: {summary['total_modules']}")
    print()
    print("  Tier Distribution:")
    for tier, count in sorted(summary["tier_distribution"].items()):
        size = summary["tier_size_kb"].get(tier, 0)
        print(f"    {tier:15s}  {count:3d} files  ({size:,.1f} KB)")
    print()

    # Tier violations
    violations = report["tier_violations"]
    if violations:
        print(f"  ⚠  HAZARDOUS IMPORTS: {len(violations)}")
        for v in violations[:20]:
            print(f"    {v['source']} ({v['source_tier']}) → {v['target']} ({v['target_tier']})")
        if len(violations) > 20:
            print(f"    ... and {len(violations) - 20} more")
    else:
        print("  ✓  No hazardous tier violations detected")
    print()

    # Circular deps
    cycles = report["circular_dependencies"]
    if cycles:
        print(f"  ⚠  CIRCULAR DEPENDENCIES: {len(cycles)}")
        for c in cycles[:10]:
            print(f"    {' → '.join(c['cycle'])}")
        if len(cycles) > 10:
            print(f"    ... and {len(cycles) - 10} more")
    else:
        print("  ✓  No circular dependencies detected")
    print()

    # Dead modules
    dead = report["dead_modules"]
    if dead:
        print(f"  ⚠  DEAD MODULES (never imported): {len(dead)}")
        for d in dead[:20]:
            print(f"    {d['path']:50s}  ({d['tier']}, {d['size_bytes']:,} bytes)")
        if len(dead) > 20:
            print(f"    ... and {len(dead) - 20} more")
    else:
        print("  ✓  No dead modules detected")
    print()

    # Monoliths
    monoliths = report["monoliths"]
    if monoliths:
        print(f"  ⚠  MONOLITHIC FILES (>20KB): {len(monoliths)}")
        for m in monoliths[:15]:
            print(
                f"    {m['path']:50s}  {m['size_kb']:6.1f} KB  "
                f"{m['lines']:4d} lines  {m['classes']}C/{m['functions']}F"
            )
    print()

    # Parse errors
    errors = report["parse_errors"]
    if errors:
        print(f"  ✗  PARSE ERRORS: {len(errors)}")
        for e in errors:
            print(f"    {e['path']}: {e['error']}")
    print()
    print("=" * 70)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="DGT Platform Sweeper — Import Linkage Mapper & Dead Code Detector",
    )
    parser.add_argument(
        "--src-root",
        type=Path,
        default=Path("src"),
        help="Root directory to scan (default: src/)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output full report as JSON instead of text",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        default=None,
        help="Write JSON report to file instead of stdout",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Include per-module import lists in JSON output",
    )
    args = parser.parse_args()

    src_root = args.src_root.resolve()
    if not src_root.is_dir():
        print(f"Error: {src_root} is not a directory", file=sys.stderr)
        return 1

    print(f"Scanning {src_root} ...", file=sys.stderr)
    modules = scan_repository(src_root)
    print(f"Found {len(modules)} Python modules.", file=sys.stderr)

    report = build_linkage_report(modules)

    if args.verbose:
        report["module_details"] = {
            name: {
                "path": info.rel_path,
                "tier": info.tier,
                "size_bytes": info.size_bytes,
                "line_count": info.line_count,
                "imports": info.imports,
                "imported_by": info.imported_by,
                "classes": info.classes,
                "functions": info.functions,
            }
            for name, info in modules.items()
        }

    if args.json or args.json_out:
        json_str = json.dumps(report, indent=2, default=str)
        if args.json_out:
            args.json_out.write_text(json_str, encoding="utf-8")
            print(f"JSON report written to {args.json_out}", file=sys.stderr)
        else:
            print(json_str)
    else:
        print_text_report(report)

    return 0


if __name__ == "__main__":
    sys.exit(main())
