"""Live demo re-run: same model, fixed compile-error feedback.

Single-variable experiment: the only change from the prior run is that
JS crash errors are now extracted and passed to the repair context.
Same model (deepseek/deepseek-v4-flash-0731), same full SYNTAX.md,
same order, same brief. If this fails with working feedback, that's
decisive evidence the model is the bottleneck.
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

BRIEF = (
    "reads as: giant humanoid + mountain proportion. "
    "feel: heavy, crushing, menacing. "
    "signature: massive fists — must survive shrinking. "
    "identity view: front (planted, fists forward)."
)

WORK_DIR = Path(r"C:\Github\RFDGameStudio\_live_demo_rerun")

print("=" * 68)
print("LIVE DEMO RE-RUN: fixed compile-error feedback, same model")
print("=" * 68)
print(f"Model: deepseek/deepseek-v4-flash-0731 (unchanged)")
print(f"Order: {ORDER}")
print(f"Temperament: {TEMPERAMENT}")
print(f"Role: {ROLE}")
print(f"Brief: {BRIEF}")
print(f"Work dir: {WORK_DIR}")
print(f"Change from prior run: JS crash errors now passed to repair context")
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

print()
print("=" * 68)
print("RESULT")
print("=" * 68)
print(f"Passed: {result.passed}")
print(f"Concept restart: {result.concept_restart}")
print(f"Rounds used: {result.rounds_used}")
print(f"Wall-clock: {elapsed:.1f}s ({elapsed/60:.1f} min)")
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
if result.glb_path and result.glb_path.exists():
    print(f"GLB: {result.glb_path} ({result.glb_path.stat().st_size} bytes)")
if result.metrics_dir:
    print(f"Metrics dir: {result.metrics_dir}")

# Print the generated spec if it exists
if result.spec_path and result.spec_path.exists():
    print()
    print("GENERATED SPEC.JSON (first 2000 chars):")
    print("-" * 40)
    spec_text = result.spec_path.read_text(encoding="utf-8")
    print(spec_text[:2000])
    if len(spec_text) > 2000:
        print("... (truncated)")
    print("-" * 40)
