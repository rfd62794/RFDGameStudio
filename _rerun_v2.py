"""Re-run corrected ZipVerifier — Run 2 only (Manus build)."""

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

print("=== Run 2: break-streamer-mvp.zip (Manus build) ===", flush=True)
v2 = ZipVerifier(r"C:\Users\cheat\Downloads\break-streamer-mvp.zip", client=client)
print("ZipVerifier constructed, calling verify()...", flush=True)
result2 = v2.verify()
f2 = result2["findings"]
v2_verdict = result2["verdict"]
print(f"Slug: {f2['slug']}", flush=True)
print(f"Verdict: {v2_verdict['verdict']}", flush=True)
print(f"Model: {v2_verdict.get('model', 'unknown')}", flush=True)
print(flush=True)
cg2 = f2.get("concept_grep", {})
print(f"Concept coverage: {cg2.get('concept_coverage')}", flush=True)
print(f"Concepts ({len(cg2.get('concepts', []))}): {cg2.get('concepts', [])}", flush=True)
print(f"Unmatched ({len(cg2.get('unmatched_concepts', []))}): {cg2.get('unmatched_concepts', [])}", flush=True)
print(flush=True)
print("=== Verdict reasoning ===", flush=True)
print(v2_verdict.get("reasoning", ""), flush=True)
print(flush=True)
print("=== Prompt sent to model ===", flush=True)
print(v2_verdict.get("prompt", ""), flush=True)
print(flush=True)
print("=== Done Run 2 ===", flush=True)
