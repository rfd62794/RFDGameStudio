"""Live demo: run the full import_fixer pipeline against a scratch copy
of PlanetForge's slimeEngine.ts with the bound deliberately reverted to
[0, 10]. The real tracked file is never modified."""

import os
import shutil
import tempfile
from pathlib import Path

# Load .env
env_path = Path(".env")
for line in env_path.read_text(encoding="utf-8").splitlines():
    if line.strip() and "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        os.environ[k] = v

from studio_mcp.import_fixer.bound_manifest import BoundEntry, load_bound_manifest
from studio_mcp.import_fixer.pattern_detector import (
    MatchStatus,
    detect_bound_mismatch,
)
from studio_mcp.import_fixer.fix_generator import generate_fix

REPO_ROOT = Path(".").resolve()
REAL_FILE = REPO_ROOT / "examples" / "planetforge" / "src" / "engine" / "slimeEngine.ts"

# 1. Create a scratch copy with the bound reverted to [0, 10]
scratch_dir = Path(tempfile.gettempdir()) / "import_fixer_demo"
scratch_dir.mkdir(parents=True, exist_ok=True)
scratch_file = scratch_dir / "slimeEngine.ts"

original_text = REAL_FILE.read_text(encoding="utf-8")
reverted_text = original_text.replace(
    "Math.max(0, Math.min(3, Math.trunc(value)))",
    "Math.max(0, Math.min(10, Math.trunc(value)))",
)
scratch_file.write_text(reverted_text, encoding="utf-8")

print(f"=== Scratch file: {scratch_file} ===")
print(f"=== Real file unchanged: {REAL_FILE} ===")
print()

# 2. Detect the bound mismatch
entries = [
    BoundEntry(
        file=str(scratch_file).replace("\\", "/"),
        symbol="clampTier",
        locked_min=0,
        locked_max=3,
        source="docs/directives/PlanetForge_Phase1_TS_Directive.md",
    )
]
result = detect_bound_mismatch(scratch_file, manifest_entries=entries)
print(f"=== Detection ===")
print(f"  status: {result.status.value}")
print(f"  pattern: {result.pattern.value}")
print(f"  symbol: {result.symbol}")
print(f"  line: {result.line}")
print(f"  current_min: {result.current_min}, current_max: {result.current_max}")
print(f"  locked_min: {result.locked_min}, locked_max: {result.locked_max}")
print(f"  reason: {result.reason}")
print()

# 3. Generate the fix via OpenRouter
if result.status == MatchStatus.CLEAN_MATCH:
    fix = generate_fix(result, scratch_dir=scratch_dir / "fix_output")
    print(f"=== Generated Fix ===")
    print(f"  model: {fix.model}")
    print(f"  scratch_path: {fix.scratch_path}")
    print(f"  error: {fix.error}")
    print()
    print(f"=== Diff ===")
    print(fix.diff)
    print()

    # 4. Verify the real file was never touched
    assert REAL_FILE.read_text(encoding="utf-8") == original_text, "REAL FILE WAS MODIFIED!"
    print("=== Verification: real file untouched ===")
    print()

    # 5. Show the fixed content's clamp line
    fixed_text = Path(fix.scratch_path).read_text(encoding="utf-8")
    for line in fixed_text.splitlines():
        if "clampTier" in line or "Math.max" in line:
            print(f"  fixed line: {line.strip()}")
else:
    print(f"=== No clean match — cannot generate fix ===")

# Cleanup
shutil.rmtree(scratch_dir, ignore_errors=True)
print()
print("=== Demo complete ===")
