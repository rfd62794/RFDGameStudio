import json
import sys
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

from studio_mcp.pipeline_audit.floor_claim_diff import diff_floor_claim

# 1. Run floor_claim_diff for pytest
print("--- Pytest Audit ---")
pytest_result = diff_floor_claim(
    cmd="uv run pytest tests/test_wire_rust.py",
    claimed={"passed": 4, "failed": 0, "skipped": 0},
    cwd=ROOT
)
print(json.dumps({k: v for k, v in pytest_result.items() if k != "raw_output"}, indent=2))

# 2. Run floor_claim_diff for vitest
print("\n--- Vitest Audit ---")
vitest_result = diff_floor_claim(
    cmd="npx vitest run tests/test_wire_rust_ui.ts",
    claimed={"passed": 2, "failed": 0, "skipped": 0},
    cwd=ROOT / "ts"
)
print(json.dumps({k: v for k, v in vitest_result.items() if k != "raw_output"}, indent=2))
