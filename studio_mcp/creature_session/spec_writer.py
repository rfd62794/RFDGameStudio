"""spec_writer.py — the designer OpenRouter call for anyCreature's LOW stage.

Builds a prompt from the order + silhouette brief + SYNTAX.md's engine syntax,
calls OpenRouter, extracts the returned JSON spec, and writes it to spec.json.
On repair rounds, includes the prior round's reader verdict and the specific
gate failure — matching the card's instruction that "the verdict IS the work order."
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from studio_mcp.zip_verify.openrouter_client import OpenRouterClient

# Path to the anyCreature fork's cards directory.
ANYCREATURE_ROOT = Path(r"C:\Github\anyCreature")
SYNTAX_PATH = ANYCREATURE_ROOT / "cards" / "SYNTAX.md"
PRESETS_PATH = ANYCREATURE_ROOT / "harness" / "presets"

DEFAULT_DESIGNER_MODEL = "deepseek/deepseek-v4-flash-0731"


def _load_syntax() -> str:
    """Load the real SYNTAX.md content to include in the designer prompt."""
    return SYNTAX_PATH.read_text(encoding="utf-8")


def _load_preset(role: str) -> dict[str, Any]:
    """Load the tier preset (boss.json, minion.json, npc.json)."""
    return json.loads((PRESETS_PATH / f"{role}.json").read_text(encoding="utf-8"))


def build_designer_prompt(
    order: str,
    temperament: str,
    role: str,
    brief: str,
    repair_context: dict[str, Any] | None = None,
) -> list[dict[str, str]]:
    """Build the messages list for the designer OpenRouter call.

    On a repair round, repair_context contains:
      - round: the repair round number (1 or 2)
      - verdict: the prior reader verdict text (verbatim)
      - failure: the specific gate failure description
    """
    syntax = _load_syntax()
    preset = _load_preset(role)

    system = (
        "You are a creature design engine. You receive an order, a silhouette brief, "
        "and the engine syntax reference. You output a valid spec.json that the "
        "anyCreature engine (engine/cli.js) can compile. Output ONLY the JSON spec, "
        "no explanation, no markdown fences. The spec must be a single valid JSON object."
    )

    user_parts = [
        f"ORDER: {order}",
        f"TEMPERAMENT: {temperament}",
        f"ROLE: {role}",
        f"PRESET (tier budget + animation requirements):\n{json.dumps(preset, indent=2)}",
        f"SILHOUETTE BRIEF:\n{brief}",
        f"ENGINE SYNTAX (cards/SYNTAX.md):\n{syntax}",
        "",
        "Design the creature as a real spec.json. Follow the syntax exactly.",
        "Key rules from the cards:",
        "- Anatomically independent masses get their OWN volumes, overlapping neighbours.",
        "- The bind pose IS the pose — plant the weight, never T-pose.",
        "- Materials are named per PART (skin_torso, fur_leg, eye, tusk...).",
        "- The signature part gets real geometry at LOW (fists → fingers, knuckles, planted pose).",
        "- Budget follows 6:3:1 — the 6-level element gets 6-level geometry.",
        '- Output ONLY the JSON. No markdown, no ```json fences, no explanation.',
    ]

    if repair_context:
        user_parts.extend([
            "",
            f"=== REPAIR ROUND {repair_context['round']} ===",
            "The prior spec FAILED Gate 1. The blind reader's verbatim verdict:",
            f"VERDICT: {repair_context['verdict']}",
            f"FAILURE: {repair_context['failure']}",
            "",
            "The verdict IS the work order. Fix the specific issues the reader identified.",
            "Output a NEW complete spec.json with the fixes applied.",
        ])

    user = "\n".join(user_parts)

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def extract_spec_json(raw_response: str) -> dict[str, Any]:
    """Extract a JSON object from the model's response.

    Handles markdown fences and surrounding text. Raises ValueError if no
    valid JSON object can be found.
    """
    # Strip markdown code fences if present
    text = raw_response.strip()
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find the first { ... } block (greedy outermost)
    start = text.find("{")
    if start == -1:
        raise ValueError(f"No JSON object found in response: {text[:200]}...")

    # Walk to matching close brace
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start : i + 1]
                return json.loads(candidate)

    raise ValueError(f"Unbalanced JSON in response: {text[:200]}...")


def write_spec(
    order: str,
    temperament: str,
    role: str,
    brief: str,
    output_path: Path,
    client: OpenRouterClient | None = None,
    repair_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run the designer call and write the spec to output_path.

    Returns the parsed spec dict. Uses the provided client or creates a
    new one with the default designer model.
    """
    if client is None:
        client = OpenRouterClient(model=DEFAULT_DESIGNER_MODEL)

    messages = build_designer_prompt(
        order, temperament, role, brief, repair_context
    )
    response = client.complete(messages, temperature=0.4)
    content = client.get_content(response)
    spec = extract_spec_json(content)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(spec, indent=2), encoding="utf-8")
    return spec
