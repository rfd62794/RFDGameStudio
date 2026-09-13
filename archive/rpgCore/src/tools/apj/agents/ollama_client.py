"""
ollama_client.py — APJ Agent Ollama Connection

Single responsibility: configure and return a pydantic_ai OpenAIModel
pointed at the local Ollama OpenAI-compatible endpoint.

Connection pattern (mirrors dgt_engine/game_engine/model_factory.py):
  - Base URL: http://localhost:11434/v1
  - Auth:     OPENAI_API_KEY = "ollama" (dummy)
  - Keep-alive: -1 (Iron Frame — model stays loaded)

Model resolution (Fix 2 + 3):
  - Queries /api/tags to discover available models
  - Walks MODEL_PREFERENCE_CHAIN, picks first hit
  - Auto-pulls if preferred model is unavailable (ensure_model)
  - Falls back to last-resort "llama3.2:1b" if all else fails
"""

import os
import subprocess
import requests
from typing import Dict

import httpx
from loguru import logger
from pydantic_ai.models.openai import OpenAIChatModel as OpenAI
from pydantic_ai.settings import ModelSettings

OLLAMA_BASE_URL = "http://localhost:11434"

# Preference chain — ordered: quality → compatibility → speed
MODEL_PREFERENCE_CHAIN = [
    "llama3.2:3b",
    "llama3.2:1b",        # fallback if 3b fails memory check
    "qwen2.5:0.5b",       # last resort
]

_LAST_RESORT = "llama3.2:1b"


def _get_available_models(base_url: str = OLLAMA_BASE_URL) -> list[str]:
    """
    Query Ollama /api/tags for currently available model names.
    Returns an empty list if Ollama is unreachable.
    """
    try:
        response = httpx.get(f"{base_url}/api/tags", timeout=5)
        response.raise_for_status()
        models = response.json().get("models", [])
        return [m["name"] for m in models]
    except Exception as exc:
        logger.warning(f"OllamaClient: could not reach {base_url}/api/tags ({exc})")
        return []


def ensure_model(model_name: str, base_url: str = OLLAMA_BASE_URL) -> bool:
    """
    Ensure a model is available locally, pulling it via `ollama pull` if not.

    Args:
        model_name: The Ollama model tag to ensure (e.g. "llama3.2:3b").
        base_url:   Ollama base URL (used for availability check before pull).

    Returns:
        True if the model is available after the call, False if pull failed.
    """
    available = _get_available_models(base_url)
    if any(model_name in a for a in available):
        logger.debug(f"OllamaClient: {model_name} already available — no pull needed")
        return True

    logger.info(f"OllamaClient: {model_name} not found — pulling via `ollama pull`...")
    try:
        result = subprocess.run(
            ["ollama", "pull", model_name],
            capture_output=True,
            text=True,
            timeout=300,  # 5 min max for large models
        )
        if result.returncode == 0:
            logger.info(f"OllamaClient: {model_name} pulled successfully")
            return True
        else:
            logger.warning(
                f"OllamaClient: pull failed for {model_name} "
                f"(exit {result.returncode}): {result.stderr.strip()}"
            )
            return False
    except FileNotFoundError:
        logger.warning("OllamaClient: `ollama` CLI not found in PATH — cannot pull models")
        return False
    except subprocess.TimeoutExpired:
        logger.warning(f"OllamaClient: pull timed out for {model_name}")
        return False


async def warm_model(
    model_name: str,
    base_url: str = OLLAMA_BASE_URL,
    keep_alive: int = -1,
) -> bool:
    """
    Pre-load a model into VRAM via Ollama's /api/generate keep_alive mechanism.

    Sends a minimal "ready" prompt with keep_alive=-1 so the model stays loaded
    in VRAM for subsequent calls (the Iron Frame). First warm takes ~5s;
    all subsequent calls in the session are instant.

    Args:
        model_name: Ollama model tag to warm (e.g. "llama3.2:3b").
        base_url:   Ollama base URL.
        keep_alive: Seconds to keep model loaded. -1 = indefinitely.

    Returns:
        True if warm succeeded, False if Ollama unreachable (non-fatal).
    """
    import asyncio as _asyncio
    logger.info(f"OllamaClient: warming {model_name} (keep_alive={keep_alive})...")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{base_url}/api/generate",
                json={
                    "model": model_name,
                    "prompt": "ready",
                    "keep_alive": keep_alive,
                    "stream": False,
                },
            )
            resp.raise_for_status()
            logger.info(f"OllamaClient: {model_name} warm — VRAM loaded, ready for inference")
            return True
    except Exception as exc:
        logger.warning(f"OllamaClient: warm failed for {model_name} ({exc}) — proceeding cold")
        return False


def warm_model_sync(
    model_name: str,
    base_url: str = OLLAMA_BASE_URL,
    keep_alive: int = -1,
) -> str:
    """
    Synchronous wrapper around warm_model() for use in non-async CLI entry points.
    
    If the requested model fails with a memory error (Ollama 500), automatically
    tries the next model in MODEL_PREFERENCE_CHAIN and returns whichever warmed.
    
    Returns:
        The model name that successfully warmed (may differ from model_name).
    """
    import asyncio as _asyncio

    # Build chain: requested model first, then rest of preference chain
    chain = [model_name] + [
        m for m in MODEL_PREFERENCE_CHAIN if m != model_name
    ]

    for candidate in chain:
        try:
            result = _asyncio.run(warm_model(candidate, base_url, keep_alive))
            if result:
                if candidate != model_name:
                    logger.warning(
                        f"OllamaClient: downgraded {model_name} → {candidate} "
                        f"(memory constraint)"
                    )
                return candidate
        except Exception as exc:
            err = str(exc).lower()
            if any(k in err for k in ("memory", "insufficient", "500")):
                logger.warning(
                    f"OllamaClient: {candidate} memory error — "
                    f"trying next in chain"
                )
                continue
            # Non-memory error — proceed cold with original model
            logger.warning(f"OllamaClient: warm_model_sync failed ({exc})")
            return model_name

    # All candidates failed — fall back cold to last in chain
    logger.warning("OllamaClient: all warm attempts failed — proceeding cold")
    return chain[-1]


def verify_models() -> Dict[str, bool]:
    """Verify all models in preference chain are installed"""
    results = {}
    
    # Check if Ollama is running
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code != 200:
            print("❌ Ollama not running")
            return results
    except Exception as e:
        print(f"❌ Cannot reach Ollama: {e}")
        return results
    
    # Parse available models
    try:
        data = response.json()
        installed = set()
        for m in data.get("models", []):
            installed.add(m["name"])
    except Exception as e:
        print(f"❌ Error parsing Ollama models: {e}")
        return results
    
    # Check each model in preference chain
    for model in MODEL_PREFERENCE_CHAIN:
        present = model in installed
        results[model] = present
        if not present:
            print(f"⚠️  {model} not installed. Installing...")
            _pull_model(model)
    
    return results


def _pull_model(model: str) -> None:
    """Pull a model from registry"""
    try:
        print(f"  Pulling {model}...")
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/pull",
            json={"name": model},
            timeout=300  # 5 min timeout
        )
        if response.status_code == 200:
            print(f"  ✅ {model} ready")
        else:
            print(f"  ❌ Failed to pull {model}")
    except Exception as e:
        print(f"  ❌ Error: {e}")


def resolve_model(base_url: str = OLLAMA_BASE_URL) -> str:
    """
    Walk MODEL_PREFERENCE_CHAIN, return the first model available in Ollama.
    If Ollama is unreachable or no preference matches, returns _LAST_RESORT.

    Args:
        base_url: Ollama base URL.

    Returns:
        Model name string ready for use with get_ollama_model().
    """
    available = _get_available_models(base_url)

    if not available:
        logger.warning(
            f"OllamaClient: no models found or Ollama offline — "
            f"defaulting to {_LAST_RESORT}"
        )
        return _LAST_RESORT

    for preferred in MODEL_PREFERENCE_CHAIN:
        if any(preferred in a for a in available):
            logger.info(f"OllamaClient: model resolved → {preferred}")
            return preferred

    logger.warning(
        f"OllamaClient: no preference chain match in {available} — "
        f"defaulting to {_LAST_RESORT}"
    )
    return _LAST_RESORT


def get_ollama_model(
    model_name: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 2048,
    timeout: float = 60.0,
) -> OpenAI:
    """
    Configure and return an OpenAIModel backed by local Ollama.

    If model_name is None, resolve_model() walks the preference chain
    and auto-pulls if the best available model isn't local yet.

    Args:
        model_name:  Ollama model tag. None = resolve automatically.
        temperature: Sampling temperature. 0.3 = analytical, 0.8 = creative.
        max_tokens:  Max response tokens.
        timeout:     Request timeout in seconds.

    Returns:
        Configured OpenAI model instance ready for pydantic_ai Agent use.
    """
    base_url = os.environ.get("OLLAMA_BASE_URL", OLLAMA_BASE_URL)

    # Resolve model if not provided
    if model_name is None:
        model_name = resolve_model(base_url)
    else:
        # Strip "ollama:" prefix if caller passed full tag style
        model_name = model_name.replace("ollama:", "")

    # Ensure the resolved model is pulled and available
    ensure_model(model_name, base_url)

    # Wire pydantic_ai to use Ollama's OpenAI-compat endpoint
    os.environ.setdefault("OLLAMA_BASE_URL", base_url)
    os.environ["OPENAI_BASE_URL"] = f"{base_url}/v1"
    os.environ["OPENAI_API_KEY"] = "ollama"

    settings = ModelSettings(
        temperature=temperature,
        max_tokens=max_tokens,
        extra_body={"keep_alive": -1},  # Iron Frame — keep model loaded
        timeout=timeout,
    )

    logger.info(
        f"OllamaClient: using model={model_name}, "
        f"base_url={base_url}, temp={temperature}"
    )

    return OpenAI(model_name, settings=settings)
