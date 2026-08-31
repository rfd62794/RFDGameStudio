"""Re-run corrected ZipVerifier against both real Break Streamer zips.

This is the deferred step from the Stage 2 Correction phase — the tool
is now fixed (selective backtick handling, section-scoped extraction,
unmatched concepts in the prompt). Running against the same two real
zips to see whether the corrected tool differentiates between the two
builds the way the directive predicted, or doesn't.
"""

import json
import os
from pathlib import Path

from dotenv import load_dotenv

from studio_mcp.zip_verify.openrouter_client import OpenRouterClient
from studio_mcp.zip_verify.report import ZipVerifier

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise RuntimeError("OPENROUTER_API_KEY not found in .env")

client = OpenRouterClient(api_key=api_key)

# === Run 1: AI Studio build ===
print("=== Run 1: break-streamer.zip (AI Studio build) ===")
v1 = ZipVerifier(r"C:\Users\cheat\Downloads\break-streamer.zip", client=client)
result1 = v1.verify()
f1 = result1["findings"]
v1_verdict = result1["verdict"]
print(f"Slug: {f1['slug']}")
print(f"Verdict: {v1_verdict['verdict']}")
print(f"Model: {v1_verdict.get('model', 'unknown')}")
print()
cg1 = f1.get("concept_grep", {})
print(f"Concept coverage: {cg1.get('concept_coverage')}")
print(f"Concepts ({len(cg1.get('concepts', []))}): {cg1.get('concepts', [])}")
print(f"Matches: {cg1.get('matches', {})}")
print(f"Unmatched ({len(cg1.get('unmatched_concepts', []))}): {cg1.get('unmatched_concepts', [])}")
print()
print("=== Verdict reasoning (Run 1) ===")
print(v1_verdict.get("reasoning", ""))
print()
print("=== Prompt sent to model (Run 1) ===")
print(v1_verdict.get("prompt", ""))
print()

# Write report 1
path1 = v1.write_report()
print(f"Report 1 written to: {path1}")
print()

# === Run 2: Manus build ===
print("=== Run 2: break-streamer-mvp.zip (Manus build) ===")
v2 = ZipVerifier(r"C:\Users\cheat\Downloads\break-streamer-mvp.zip", client=client)
result2 = v2.verify()
f2 = result2["findings"]
v2_verdict = result2["verdict"]
print(f"Slug: {f2['slug']}")
print(f"Verdict: {v2_verdict['verdict']}")
print(f"Model: {v2_verdict.get('model', 'unknown')}")
print()
cg2 = f2.get("concept_grep", {})
print(f"Concept coverage: {cg2.get('concept_coverage')}")
print(f"Concepts ({len(cg2.get('concepts', []))}): {cg2.get('concepts', [])}")
print(f"Matches: {cg2.get('matches', {})}")
print(f"Unmatched ({len(cg2.get('unmatched_concepts', []))}): {cg2.get('unmatched_concepts', [])}")
print()
print("=== Verdict reasoning (Run 2) ===")
print(v2_verdict.get("reasoning", ""))
print()
print("=== Prompt sent to model (Run 2) ===")
print(v2_verdict.get("prompt", ""))
print()

# Write report 2
path2 = v2.write_report()
print(f"Report 2 written to: {path2}")
print()

print("=== Both runs complete ===")
