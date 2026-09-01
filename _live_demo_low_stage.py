"""Live demo: run the real LOW-stage pipeline against the fixed test order.

This makes REAL OpenRouter calls (designer + reader) and REAL anyCreature
tool calls (compile + measure). It produces the actual new data point:
generative design cost (tokens + time).
"""

import json
import time
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from studio_mcp.creature_session.gate_runner import run_low_stage

ORDER = "make me a menacing mountain giant"
TEMPERAMENT = "scary"
ROLE = "boss"

# Silhouette brief per card 01_LOW.md §2 format
BRIEF = (
    "reads as: giant humanoid + mountain proportion. "
    "feel: heavy, crushing, menacing. "
    "signature: massive fists — must survive shrinking. "
    "identity view: front (planted, fists forward)."
)

WORK_DIR = Path(r"C:\Github\RFDGameStudio\_live_demo_low")

print("=" * 68)
print("LIVE DEMO: anyCreature LOW-stage generative pipeline")
print("=" * 68)
print(f"Order: {ORDER}")
print(f"Temperament: {TEMPERAMENT}")
print(f"Role: {ROLE}")
print(f"Brief: {BRIEF}")
print(f"Work dir: {WORK_DIR}")
print()

start_time = time.time()

result = run_low_stage(
    order=ORDER,
    temperament=TEMPERAMENT,
    role=ROLE,
    brief=BRIEF,
    work_dir=WORK_DIR,
)

elapsed = time.time() - start_time

print("=" * 68)
print("RESULT")
print("=" * 68)
print(f"Passed: {result.passed}")
print(f"Concept restart: {result.concept_restart}")
print(f"Rounds used: {result.rounds_used}")
print(f"Wall-clock: {elapsed:.1f}s")
print()
print("VERDICT (verbatim):")
print("-" * 40)
print(result.verdict)
print("-" * 40)
print()
if result.failure_symptoms:
    print(f"Failure symptoms: {result.failure_symptoms}")
if result.spec_path:
    print(f"Spec: {result.spec_path}")
if result.glb_path:
    print(f"GLB: {result.glb_path}")
if result.metrics_dir:
    print(f"Metrics dir: {result.metrics_dir}")

# Print the generated spec if it exists
if result.spec_path and result.spec_path.exists():
    print()
    print("GENERATED SPEC.JSON:")
    print("-" * 40)
    spec = json.loads(result.spec_path.read_text(encoding="utf-8"))
    print(json.dumps(spec, indent=2)[:3000])  # first 3000 chars
    if len(json.dumps(spec)) > 3000:
        print("... (truncated)")
    print("-" * 40)
