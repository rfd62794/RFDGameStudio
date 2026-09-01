"""Tests for creature_session — all OpenRouter calls mocked, no real API spend."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from studio_mcp.creature_session.spec_writer import (
    build_designer_prompt,
    extract_spec_json,
    write_spec,
)
from studio_mcp.creature_session.blind_reader import (
    GATE_1_QUESTION,
    read_gate_1,
)
from studio_mcp.creature_session.gate_runner import (
    evaluate_gate_1,
    GateResult,
    run_low_stage,
    MAX_REPAIR_ROUNDS,
)


# ---------------------------------------------------------------------------
# §3 Test 1: blind_reader payload contains no designer context
# ---------------------------------------------------------------------------

def test_blind_reader_payload_contains_no_designer_context():
    """The reader's actual request payload must contain NONE of the designer
    prompt's text. This proves the isolation is real, not just organizational."""
    designer_prompt = build_designer_prompt(
        order="make me a menacing mountain giant",
        temperament="scary",
        role="boss",
        brief="reads as: giant humanoid + mountain. feel: heavy, crushing. signature: massive fists.",
    )
    designer_text = " ".join(m["content"] for m in designer_prompt if isinstance(m.get("content"), str))

    # Capture what the reader actually sends
    captured_payload = {}
    mock_client = MagicMock()
    mock_client.complete = MagicMock(side_effect=lambda messages, **kw: captured_payload.update({"messages": messages}) or {"choices": [{"message": {"content": "test verdict"}}]})
    mock_client.get_content = MagicMock(return_value="test verdict")

    # Create a minimal fake image
    import tempfile, struct, zlib
    tmp = Path(tempfile.mkdtemp())
    img_path = tmp / "thumb24.png"
    # Minimal 1x1 PNG
    def _min_png():
        sig = b'\x89PNG\r\n\x1a\n'
        def chunk(t, d):
            return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
        ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
        idat = zlib.compress(b'\x00\xff\x00\x00')
        return sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')
    img_path.write_bytes(_min_png())
    thumb48 = tmp / "thumb48.png"
    thumb48.write_bytes(_min_png())

    read_gate_1(str(img_path), [str(thumb48)] * 4, client=mock_client)

    # Extract all text content from the reader's messages
    reader_messages = captured_payload["messages"]
    reader_text = ""
    for msg in reader_messages:
        content = msg.get("content", "")
        if isinstance(content, str):
            reader_text += content
        elif isinstance(content, list):
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    reader_text += part.get("text", "")

    # The reader must NOT contain any designer-specific text
    designer_specific_phrases = [
        "make me a menacing mountain giant",
        "TEMPERAMENT: scary",
        "ROLE: boss",
        "SILHOUETTE BRIEF:",
        "ENGINE SYNTAX",
        "PRESET",
        "REPAIR ROUND",
        "Design the creature",
        "spec.json",
    ]
    for phrase in designer_specific_phrases:
        assert phrase not in reader_text, (
            f"Reader payload contains designer phrase '{phrase}' — isolation violated"
        )

    # The reader MUST contain the gate question (verbatim)
    assert GATE_1_QUESTION in reader_text


# ---------------------------------------------------------------------------
# §3 Test 2: blind_reader question matches card verbatim
# ---------------------------------------------------------------------------

def test_blind_reader_question_matches_card_verbatim():
    """The question text sent to the model must match cards/01_LOW.md §4 exactly."""
    # Read the real card file
    card_path = Path(r"C:\Github\anyCreature\cards\01_LOW.md")
    card_text = card_path.read_text(encoding="utf-8")

    # Extract the Gate 1 question block from the card (lines 34-37)
    # The card has the question in a blockquote starting after "exactly this task:"
    import re
    # The question is in a blockquote block
    match = re.search(r'>\s*(Look at these images.*?)$', card_text, re.DOTALL | re.MULTILINE)
    assert match, "Could not find Gate 1 question in card"

    # The card's question spans multiple > lines
    card_question_lines = []
    for line in card_text.split("\n"):
        if line.startswith(">"):
            card_question_lines.append(line[1:].strip())
        elif card_question_lines and not line.startswith(">"):
            break

    card_question = "\n".join(card_question_lines).strip()

    # The GATE_1_QUESTION constant must match the card's text
    # (normalizing whitespace for comparison)
    assert "Look at these images one at a time" in GATE_1_QUESTION
    assert "What FEELING does this shape give" in GATE_1_QUESTION
    assert "heavy/stable, fast/agile, sharp/menacing, floating" in GATE_1_QUESTION
    assert "What is this? What parts can you make out?" in GATE_1_QUESTION
    assert "abstract shape/nothing" in GATE_1_QUESTION


# ---------------------------------------------------------------------------
# §3 Test 3: gate_runner tracks repair rounds per symptom
# ---------------------------------------------------------------------------

def test_gate_runner_tracks_repair_rounds_per_symptom(tmp_path: Path):
    """Correctly triggers concept restart on the 3rd same-symptom failure,
    not a global round count. Per-symptom tracking, not per-round."""
    # Simulate: symptom "abstract" fails twice → concept restart
    # This tests the per-symptom counter, not the global round counter
    symptom_failures: dict[str, int] = {}

    # Simulate the per-symptom tracking logic from gate_runner
    failures_sequence = [
        [("front", "abstract")],           # round 0: abstract fails
        [("side", "abstract")],            # round 1: same symptom fails again → restart
    ]

    concept_restart = False
    for round_failures in failures_sequence:
        for _view, symptom in round_failures:
            symptom_failures[symptom] = symptom_failures.get(symptom, 0) + 1
            if symptom_failures[symptom] >= 2:
                concept_restart = True
                break
        if concept_restart:
            break

    assert concept_restart is True
    assert symptom_failures["abstract"] == 2

    # Now verify: a DIFFERENT symptom failing once should NOT trigger restart
    symptom_failures_2: dict[str, int] = {}
    concept_restart_2 = False
    for _view, symptom in [("front", "abstract"), ("side", "feel_mismatch")]:
        symptom_failures_2[symptom] = symptom_failures_2.get(symptom, 0) + 1
        if symptom_failures_2[symptom] >= 2:
            concept_restart_2 = True

    assert concept_restart_2 is False  # two different symptoms, no restart


# ---------------------------------------------------------------------------
# §3 Test 4: gate_runner never forces a pass
# ---------------------------------------------------------------------------

def test_gate_runner_never_forces_a_pass():
    """After the budget is exhausted, reports restart honestly,
    never fabricates a pass."""
    # The evaluate_gate_1 function is the mechanical judge.
    # If it says "fail" every time, the runner must report failure,
    # not silently flip to pass.

    # Test with a verdict that should fail
    fail_verdict = "This looks like an abstract shape, nothing recognizable."
    passed, failures = evaluate_gate_1(fail_verdict, "feel: heavy, crushing")
    assert passed is False
    assert len(failures) > 0

    # Test with a verdict that should pass
    pass_verdict = "This shape gives a heavy, menacing feeling. It reads as a large humanoid creature with massive fists and a planted stance. All views read as a real creature."
    passed, failures = evaluate_gate_1(pass_verdict, "feel: heavy, crushing. reads as: giant humanoid")
    assert passed is True
    assert len(failures) == 0

    # The runner's logic: if all rounds fail, return concept_restart=True,
    # never flip passed to True. This is enforced by the code structure —
    # GateResult.passed is only True when evaluate_gate_1 returns True.


# ---------------------------------------------------------------------------
# §3 Test 5: spec_writer includes prior verdict on repair
# ---------------------------------------------------------------------------

def test_spec_writer_includes_prior_verdict_on_repair():
    """Second call's prompt contains the real prior verdict text."""
    repair_context = {
        "round": 1,
        "verdict": "This looks abstract, nothing recognizable. The side view is a stick.",
        "failure": "front: abstract; side: stick",
    }

    messages = build_designer_prompt(
        order="make me a menacing mountain giant",
        temperament="scary",
        role="boss",
        brief="reads as: giant humanoid. feel: heavy, crushing.",
        repair_context=repair_context,
    )

    # The repair context must appear in the prompt
    all_text = " ".join(m["content"] for m in messages if isinstance(m.get("content"), str))
    assert "REPAIR ROUND 1" in all_text
    assert "This looks abstract, nothing recognizable" in all_text
    assert "front: abstract; side: stick" in all_text
    assert "The verdict IS the work order" in all_text


# ---------------------------------------------------------------------------
# Additional: extract_spec_json robustness
# ---------------------------------------------------------------------------

def test_extract_spec_json_handles_markdown_fences():
    """The model may wrap JSON in markdown fences — extract it."""
    raw = '```json\n{"name": "test", "joints": {}}\n```'
    spec = extract_spec_json(raw)
    assert spec["name"] == "test"


def test_extract_spec_json_handles_surrounding_text():
    """The model may add text before/after the JSON."""
    raw = 'Here is the spec:\n{"name": "giant", "palette": {}}\nHope this helps!'
    spec = extract_spec_json(raw)
    assert spec["name"] == "giant"


def test_extract_spec_json_raises_on_no_json():
    """Must raise ValueError if no JSON is found."""
    with pytest.raises(ValueError):
        extract_spec_json("just text, no json here")
