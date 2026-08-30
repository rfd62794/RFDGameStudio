"""Live smoke test for the zip verifier — reads .env, runs real OpenRouter calls."""

import json
import os
from pathlib import Path

from studio_mcp.zip_verify.openrouter_client import OpenRouterClient
from studio_mcp.zip_verify.report import ZipVerifier

ROOT = Path(__file__).resolve().parent

# Load .env without printing it.
env_path = ROOT / ".env"
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())

client = OpenRouterClient()

def run(slug: str, zip_path: Path) -> dict:
    print(f"\n=== {slug} ===\n")
    verifier = ZipVerifier(zip_path, client=client)
    result = verifier.verify()
    print("VERDICT:", result["verdict"]["verdict"])
    print("REASONING:", result["verdict"]["reasoning"])
    print("RAW RESPONSE:")
    print(json.dumps(result["verdict"]["raw_response"], indent=2))
    report_path = verifier.write_report()
    print("Report written:", report_path)
    return result

run("antsim-redux", ROOT / "intake" / "antsim-redux" / "antsim-redux_v0.1.0R1.zip")
run("corpworld", ROOT / "intake" / "corpworld" / "corpworld_v0.1.0R5.zip")
