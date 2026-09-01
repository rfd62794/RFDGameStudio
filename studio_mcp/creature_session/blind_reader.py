"""blind_reader.py — the isolated reader OpenRouter call for Gate 1.

A FRESH OpenRouterClient instance per call, with no shared state from the
designer call. The reader sees ONLY the silhouette image and the bare
question script from cards/01_LOW.md §4, verbatim — no conversation history,
no knowledge of the order, no knowledge this is a gate check.

This isolation is architectural, not organizational: a new client object is
constructed inside read_gate_1(), carrying no model choice, prompt content,
or response data from any prior call.
"""

from __future__ import annotations

import base64
import mimetypes
from pathlib import Path
from typing import Any

from studio_mcp.zip_verify.openrouter_client import OpenRouterClient

# Vision-capable model confirmed live on OpenRouter (Sept 2026).
# google/gemini-2.5-flash: modalities ['file','image','text','audio','video'],
# $0.30/M prompt, $2.50/M completion. Chosen for reliability and low cost.
READER_MODEL = "google/gemini-2.5-flash"

# The Gate 1 question script, copied VERBATIM from cards/01_LOW.md §4.
# Do not paraphrase — a paraphrased question is a different experiment.
GATE_1_QUESTION = """Look at these images one at a time, answering only from what you SEE.
1) [thumb24 of the identity view] What FEELING does this shape give — heavy/stable, fast/agile, sharp/menacing, floating? One phrase.
2-5) [thumb48 of front / side / top / hero] What is this? What parts can you make out? Does this view read as a real creature, or as an abstract shape/nothing?"""


def _encode_image(path: Path) -> str:
    """Read an image file and return its base64 data URL."""
    mime = mimetypes.guess_type(str(path))[0] or "image/png"
    data = path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:{mime};base64,{b64}"


def read_gate_1(
    thumb24_path: str,
    thumb48_paths: list[str],
    client: OpenRouterClient | None = None,
) -> dict[str, Any]:
    """Run a fresh, isolated Gate 1 blind read.

    Args:
        thumb24_path: path to the 24px identity-view thumbnail.
        thumb48_paths: list of paths to 48px thumbnails [front, side, top, hero].
        client: optional injected client (for testing). If None, a NEW
            OpenRouterClient is constructed with the reader model —
            no shared state from any designer call.

    Returns:
        dict with:
          - 'verdict': the model's verbatim answer text
          - 'prompt_text': the question text sent (for verification)
          - 'images_sent': list of image paths sent
    """
    # Fresh client — no shared state. This is the architectural isolation.
    if client is None:
        client = OpenRouterClient(model=READER_MODEL)

    # Build the message with images. The question text is verbatim from
    # the card — the model sees the images and the question, nothing else.
    content_parts: list[dict[str, Any]] = []

    # thumb24 (identity view) — question 1
    content_parts.append({
        "type": "text",
        "text": GATE_1_QUESTION,
    })
    content_parts.append({
        "type": "image_url",
        "image_url": {"url": _encode_image(Path(thumb24_path))},
    })

    # thumb48s (front, side, top, hero) — questions 2-5
    for img_path in thumb48_paths:
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": _encode_image(Path(img_path))},
        })

    messages = [
        {
            "role": "user",
            "content": content_parts,
        }
    ]

    if client is None:
        # Real call — fresh client with streaming for visibility
        client = OpenRouterClient(model=READER_MODEL)
        token_count = [0]

        def _on_token(token: str) -> None:
            token_count[0] += 1
            if token_count[0] % 20 == 0:
                print(f"[blind_reader] ...{token_count[0]} tokens received", flush=True)

        verdict = client.complete_stream(messages, temperature=0.0, on_token=_on_token)
        print(f"[blind_reader] stream complete, {len(verdict)} chars, ~{token_count[0]} tokens", flush=True)
    else:
        # Injected (mocked) client — use complete()
        response = client.complete(messages, temperature=0.0)
        verdict = client.get_content(response)

    return {
        "verdict": verdict,
        "prompt_text": GATE_1_QUESTION,
        "images_sent": [thumb24_path] + thumb48_paths,
    }
