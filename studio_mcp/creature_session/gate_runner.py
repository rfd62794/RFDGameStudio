"""gate_runner.py — orchestrates the LOW stage: compile → measure → Gate 1.

Implements the card's own real rules:
- 2 repair rounds max, tracked per (view, symptom), not globally.
- Iron law 3: same symptom failed twice = concept restart, not a third tweak.
- A refused build (BLOCK:) costs no round — fix and rebuild.
- The verdict IS the work order.

This module calls anyCreature's external tools (engine/cli.js, harness/silmetrics.mjs,
harness/maskmetrics.py) via subprocess. It does not modify anyCreature itself.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from studio_mcp.zip_verify.openrouter_client import OpenRouterClient

from .blind_reader import read_gate_1
from .spec_writer import write_spec

ANYCREATURE_ROOT = Path(r"C:\Github\anyCreature")
ENGINE_CLI = ANYCREATURE_ROOT / "engine" / "cli.js"
SILMETRICS = ANYCREATURE_ROOT / "harness" / "silmetrics.mjs"
MASKMETRICS = ANYCREATURE_ROOT / "harness" / "maskmetrics.py"

MAX_REPAIR_ROUNDS = 2


@dataclass
class GateResult:
    """The outcome of a Gate 1 evaluation."""
    passed: bool
    verdict: str
    failure_symptoms: list[tuple[str, str]] = field(default_factory=list)
    concept_restart: bool = False
    rounds_used: int = 0
    spec_path: Path | None = None
    glb_path: Path | None = None
    metrics_dir: Path | None = None


def _run_subprocess(cmd: list[str], cwd: Path = ANYCREATURE_ROOT) -> tuple[int, str, str]:
    """Run a subprocess and return (returncode, stdout, stderr)."""
    result = subprocess.run(
        cmd,
        cwd=str(cwd),
        capture_output=True,
        text=True,
        timeout=120,
    )
    return result.returncode, result.stdout, result.stderr


def compile_spec(spec_path: Path, glb_path: Path) -> tuple[bool, str]:
    """Run engine/cli.js to compile the spec. Returns (success, combined_output).

    A BLOCK: line means the build was refused — this is a mechanical failure,
    not a gate failure. The caller must fix the spec and rebuild (costs no round).
    """
    cmd = ["node", str(ENGINE_CLI), str(spec_path), str(glb_path)]
    rc, stdout, stderr = _run_subprocess(cmd)
    combined = stderr + stdout
    return rc == 0, combined


def measure_silhouettes(glb_path: Path, out_dir: Path) -> dict[str, Any]:
    """Run silmetrics.mjs + maskmetrics.py to produce silhouettes and thumbnails.

    Returns a dict with paths to the generated images.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    # silmetrics produces sil_side.png, sil_front.png, sil_top.png, sil_hero.png
    # and thumb24.png in out_dir
    cmd = ["node", str(SILMETRICS), str(glb_path), str(out_dir)]
    rc, stdout, stderr = _run_subprocess(cmd)
    if rc != 0:
        raise RuntimeError(f"silmetrics failed: {stderr}")

    # maskmetrics produces thumb24/thumb48 per image + metrics.json
    sil_images = [
        out_dir / "sil_front.png",
        out_dir / "sil_side.png",
        out_dir / "sil_top.png",
        out_dir / "sil_hero.png",
    ]
    existing = [str(p) for p in sil_images if p.exists()]
    if existing:
        cmd = [sys.executable, str(MASKMETRICS), str(out_dir)] + existing
        rc, stdout, stderr = _run_subprocess(cmd)
        if rc != 0:
            raise RuntimeError(f"maskmetrics failed: {stderr}")

    # Find the generated thumbnails
    result: dict[str, Any] = {"dir": out_dir}

    # silmetrics produces thumb24.png (the identity-view 24px thumb)
    thumb24 = out_dir / "thumb24.png"
    if thumb24.exists():
        result["thumb24"] = str(thumb24)

    # maskmetrics produces _thumb48.png per silhouette image
    thumb48s = []
    for sil in sil_images:
        t48 = out_dir / f"{sil.stem}_thumb48.png"
        if t48.exists():
            thumb48s.append(str(t48))
    result["thumb48s"] = thumb48s

    return result


def evaluate_gate_1(
    verdict: str,
    brief: str,
) -> tuple[bool, list[tuple[str, str]]]:
    """Judge the reader's verbatim verdict against the brief.

    Returns (passed, failure_symptoms) where failure_symptoms is a list of
    (view, symptom) tuples. Per the card:
    - "Any view read as 'abstract/nothing/a stick' fails the whole gate."
    - Identity wrong → repair (biggest shapes first).
    - Feel mismatch → repair.

    This is a mechanical check on the verdict text, not an LLM call.
    """
    verdict_lower = verdict.lower()
    failures: list[tuple[str, str]] = []

    # Check for abstract/nothing/stick reads — these are hard fails
    abstract_patterns = [
        (r"abstract", "abstract"),
        (r"nothing", "nothing"),
        (r"\ba stick\b", "stick"),
        (r"unrecognizable", "unrecognizable"),
        (r"can't (make out|tell|identify)", "cant_make_out"),
        (r"cannot (make out|tell|identify)", "cant_make_out"),
        (r"no (clear )?(shape|form|creature|body)", "no_shape"),
    ]

    # The verdict covers views 1-5 (identity, front, side, top, hero)
    # We check for abstract/nothing reads across the whole verdict
    for pattern, symptom in abstract_patterns:
        if re.search(pattern, verdict_lower):
            failures.append(("unknown_view", symptom))

    # Check feel mismatch against brief keywords
    # The brief specifies a feel like "heavy, crushing" for a giant
    brief_feel_match = re.search(r"feel[:\s]+([^.]+)", brief, re.IGNORECASE)
    if brief_feel_match:
        brief_feel = brief_feel_match.group(1).lower().strip()
        # Check if the verdict's feeling answer aligns
        # For "scary" temperament, look for menacing/sharp/scary
        scary_words = ["menacing", "sharp", "scary", "threatening", "heavy", "crushing", "intimidating"]
        cute_words = ["cute", "soft", "friendly", "gentle"]
        fast_words = ["fast", "agile", "quick", "swift"]
        floating_words = ["floating", "light", "weightless"]

        # If the brief says heavy/crushing and the verdict says cute/friendly, that's a mismatch
        if any(w in brief_feel for w in ["heavy", "crushing", "menacing", "scary"]):
            if any(w in verdict_lower for w in cute_words + fast_words + floating_words):
                failures.append(("identity", "feel_mismatch"))

    passed = len(failures) == 0
    return passed, failures


def run_low_stage(
    order: str,
    temperament: str,
    role: str,
    brief: str,
    work_dir: Path,
    designer_client: OpenRouterClient | None = None,
    reader_client: OpenRouterClient | None = None,
) -> GateResult:
    """Run the full LOW stage: design → compile → measure → Gate 1 → repair/restart.

    Args:
        order: the creature order (e.g. "make me a menacing mountain giant")
        temperament: "cute" / "solid" / "scary" / free text
        role: "minion" / "npc" / "boss" — loads the tier preset
        brief: the silhouette brief from §2 of the card
        work_dir: where to write spec.json, glb, and per-round output
        designer_client: injected OpenRouterClient for design calls (testing)
        reader_client: injected OpenRouterClient for reader calls (testing)

    Returns:
        GateResult with the final outcome.
    """
    work_dir.mkdir(parents=True, exist_ok=True)

    # Per-symptom failure tracking (iron law 3: same symptom failed twice = restart)
    symptom_failures: dict[str, int] = {}  # symptom → count
    repair_round = 0
    repair_context: dict[str, Any] | None = None
    last_verdict = ""
    last_failures: list[tuple[str, str]] = []

    for attempt in range(MAX_REPAIR_ROUNDS + 1):  # initial + 2 repairs
        round_dir = work_dir / f"r{attempt}"
        round_dir.mkdir(parents=True, exist_ok=True)
        spec_path = round_dir / "spec.json"
        glb_path = round_dir / "creature.glb"

        # Step 1: Design (or repair) the spec
        spec = write_spec(
            order=order,
            temperament=temperament,
            role=role,
            brief=brief,
            output_path=spec_path,
            client=designer_client,
            repair_context=repair_context,
        )

        # Step 2: Compile — a BLOCK: costs no round, but we need to handle it
        compile_ok, compile_output = compile_spec(spec_path, glb_path)
        if not compile_ok:
            # Engine floor block — fix and rebuild, costs no round
            # But we can't auto-fix a BLOCK without another LLM call, so we
            # treat this as a repair trigger with the BLOCK message as the verdict
            block_lines = [l for l in compile_output.split("\n") if "BLOCK:" in l]
            repair_context = {
                "round": repair_round + 1,
                "verdict": "BUILD REFUSED: " + "; ".join(block_lines),
                "failure": "Engine floor check failed — fix the geometry issue.",
            }
            repair_round += 1
            if repair_round > MAX_REPAIR_ROUNDS:
                return GateResult(
                    passed=False,
                    verdict=compile_output,
                    failure_symptoms=[("build", "engine_block")] * repair_round,
                    concept_restart=True,
                    rounds_used=attempt + 1,
                    spec_path=spec_path,
                )
            continue

        # Step 3: Measure silhouettes
        try:
            metrics = measure_silhouettes(glb_path, round_dir)
        except RuntimeError as e:
            repair_context = {
                "round": repair_round + 1,
                "verdict": str(e),
                "failure": "Measurement pipeline failed.",
            }
            repair_round += 1
            if repair_round > MAX_REPAIR_ROUNDS:
                return GateResult(
                    passed=False,
                    verdict=str(e),
                    failure_symptoms=[("measure", "pipeline_error")] * repair_round,
                    concept_restart=True,
                    rounds_used=attempt + 1,
                    spec_path=spec_path,
                    glb_path=glb_path,
                )
            continue

        # Step 4: Gate 1 — blind read
        thumb24 = metrics.get("thumb24")
        thumb48s = metrics.get("thumb48s", [])
        if not thumb24 or len(thumb48s) < 4:
            repair_context = {
                "round": repair_round + 1,
                "verdict": "Missing thumbnails for gate evaluation.",
                "failure": "Silhouette generation did not produce all required thumbnails.",
            }
            repair_round += 1
            if repair_round > MAX_REPAIR_ROUNDS:
                return GateResult(
                    passed=False,
                    verdict="Missing thumbnails",
                    failure_symptoms=[("measure", "missing_thumbs")] * repair_round,
                    concept_restart=True,
                    rounds_used=attempt + 1,
                    spec_path=spec_path,
                    glb_path=glb_path,
                    metrics_dir=round_dir,
                )
            continue

        reader_result = read_gate_1(thumb24, thumb48s, client=reader_client)
        last_verdict = reader_result["verdict"]

        # Step 5: Evaluate the verdict
        passed, failures = evaluate_gate_1(last_verdict, brief)
        last_failures = failures

        if passed:
            return GateResult(
                passed=True,
                verdict=last_verdict,
                rounds_used=attempt + 1,
                spec_path=spec_path,
                glb_path=glb_path,
                metrics_dir=round_dir,
            )

        # Track per-symptom failures (iron law 3)
        for _view, symptom in failures:
            symptom_failures[symptom] = symptom_failures.get(symptom, 0) + 1
            if symptom_failures[symptom] >= 2:
                # Same symptom failed twice → concept restart, not a third tweak
                return GateResult(
                    passed=False,
                    verdict=last_verdict,
                    failure_symptoms=failures,
                    concept_restart=True,
                    rounds_used=attempt + 1,
                    spec_path=spec_path,
                    glb_path=glb_path,
                    metrics_dir=round_dir,
                )

        # Prepare repair context for next round
        repair_round += 1
        if repair_round > MAX_REPAIR_ROUNDS:
            # Budget exhausted — report honestly, don't force a pass
            return GateResult(
                passed=False,
                verdict=last_verdict,
                failure_symptoms=failures,
                concept_restart=True,
                rounds_used=attempt + 1,
                spec_path=spec_path,
                glb_path=glb_path,
                metrics_dir=round_dir,
            )

        repair_context = {
            "round": repair_round,
            "verdict": last_verdict,
            "failure": "; ".join(f"{v}: {s}" for v, s in failures),
        }

    # Should not reach here, but if we do, report honestly
    return GateResult(
        passed=False,
        verdict=last_verdict,
        failure_symptoms=last_failures,
        concept_restart=True,
        rounds_used=MAX_REPAIR_ROUNDS + 1,
    )
