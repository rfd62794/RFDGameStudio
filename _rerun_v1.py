"""Re-run corrected ZipVerifier — Run 1 only (AI Studio build)."""

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

print("=== Run 1: break-streamer.zip (AI Studio build) ===", flush=True)
v1 = ZipVerifier(r"C:\Users\cheat\Downloads\break-streamer.zip", client=client)
print("ZipVerifier constructed, calling verify()...", flush=True)
result1 = v1.verify()
f1 = result1["findings"]
v1_verdict = result1["verdict"]
print(f"Slug: {f1['slug']}", flush=True)
print(f"Verdict: {v1_verdict['verdict']}", flush=True)
print(f"Model: {v1_verdict.get('model', 'unknown')}", flush=True)
print(flush=True)
cg1 = f1.get("concept_grep", {})
print(f"Concept coverage: {cg1.get('concept_coverage')}", flush=True)
print(f"Concepts ({len(cg1.get('concepts', []))}): {cg1.get('concepts', [])}", flush=True)
print(f"Unmatched ({len(cg1.get('unmatched_concepts', []))}): {cg1.get('unmatched_concepts', [])}", flush=True)
print(flush=True)
print("=== Verdict reasoning ===", flush=True)
print(v1_verdict.get("reasoning", ""), flush=True)
print(flush=True)
print("=== Prompt sent to model ===", flush=True)
print(v1_verdict.get("prompt", ""), flush=True)
print(flush=True)
print("=== Done Run 1 ===", flush=True)
