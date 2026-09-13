"""
openrouter_client.py — OpenRouter Director Client

The Director is the Generalist — called SPARINGLY at decision gates
the local swarm cannot handle. Every call requires human approval.

Approval modes:
  STRICT    — explicit approval required every single call (default)
  MODERATE  — approval required for novel task types
  OFF       — Director disabled, local swarm only

Cost awareness:
  - Always log estimated token cost before calling
  - Always log actual token cost after calling
  - Session budget tracked in docs/agents/session_logs/director_usage.log
"""

from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path

from loguru import logger

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parents[4]
_USAGE_LOG = _PROJECT_ROOT / "docs" / "agents" / "session_logs" / "director_usage.log"

# ---------------------------------------------------------------------------
# Approval modes
# ---------------------------------------------------------------------------
APPROVAL_STRICT   = "STRICT"
APPROVAL_MODERATE = "MODERATE"
APPROVAL_OFF      = "OFF"

# ---------------------------------------------------------------------------
# Model registry — prefer free tier
# ---------------------------------------------------------------------------
FREE_MODELS = [
    "deepseek/deepseek-r1",                   # strong reasoning, free tier
    "meta-llama/llama-3.1-70b-instruct",      # strong generalist, free tier
    "google/gemini-flash-1.5",                # large context, free tier
    "mistralai/mistral-7b-instruct",          # fast fallback, free tier
]

_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


# ---------------------------------------------------------------------------
# Configuration helpers
# ---------------------------------------------------------------------------

def get_approval_mode() -> str:
    """Return the current approval mode (STRICT / MODERATE / OFF)."""
    return os.getenv("DIRECTOR_APPROVAL_MODE", APPROVAL_STRICT).upper()


def is_director_enabled() -> bool:
    """
    Return True if the Director can be called.

    Checks:
    1. DIRECTOR_APPROVAL_MODE != OFF
    2. A real OPENROUTER_API_KEY is present in the environment

    Safe to call at any point — never raises.
    """
    mode = get_approval_mode()
    if mode == APPROVAL_OFF:
        logger.info("Director: DISABLED (DIRECTOR_APPROVAL_MODE=OFF)")
        return False

    key = os.getenv("OPENROUTER_API_KEY", "")
    if not key or key == "your_key_here":
        logger.warning("Director: no API key found — Director unavailable")
        return False

    return True


# ---------------------------------------------------------------------------
# Approval gate
# ---------------------------------------------------------------------------

def request_approval(
    reason: str,
    task_summary: str,
    estimated_tokens: int,
) -> bool:
    """
    Prompt the human for explicit approval before calling the Director.

    In STRICT mode: always ask.
    In MODERATE mode: ask for novel tasks only (not yet implemented — behaves as STRICT).
    In OFF mode: always deny.

    Args:
        reason:           Why the Director is being requested.
        task_summary:     Short description of the task (~60 chars).
        estimated_tokens: Rough token estimate for cost transparency.

    Returns:
        True if approved, False if denied or mode is OFF.
    """
    mode = get_approval_mode()
    if mode == APPROVAL_OFF:
        logger.info("Director: approval skipped — mode is OFF")
        return False

    model = os.getenv("OPENROUTER_MODEL", FREE_MODELS[0])

    print("\n" + "=" * 60)
    print("  DIRECTOR APPROVAL REQUIRED")
    print("=" * 60)
    print(f"  Reason:    {reason}")
    print(f"  Task:      {task_summary}")
    print(f"  Est. cost: ~{estimated_tokens} tokens (free tier if available)")
    print(f"  Model:     {model}")
    print("=" * 60)

    try:
        response = input("  Approve? [y/N]: ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        # Non-interactive context (e.g. test runner) — default deny
        response = "n"

    approved = response == "y"
    logger.info(
        f"Director approval {'GRANTED' if approved else 'DENIED'}: "
        f"{task_summary[:60]}"
    )
    return approved


# ---------------------------------------------------------------------------
# Model factory
# ---------------------------------------------------------------------------

def get_openrouter_model(model: str | None = None):
    """Return a pydantic_ai OpenAIChatModel pointed at OpenRouter.

    ALWAYS call is_director_enabled() and request_approval() before this.
    This function does NOT enforce the gate — callers are responsible.

    Returns:
        Configured OpenAIChatModel ready for pydantic_ai Agent use.
    """
    from pydantic_ai.models.openai import OpenAIChatModel

    api_key = os.getenv("OPENROUTER_API_KEY", "")
    model_name = model or os.getenv("OPENROUTER_MODEL", FREE_MODELS[0])

    # pydantic_ai 1.22+ has a built-in 'openrouter' provider.
    # It reads OPENROUTER_API_KEY from env automatically.
    os.environ["OPENROUTER_API_KEY"] = api_key   # ensure it's set for the provider
    logger.info(f"Director: connecting via OpenRouter -> {model_name}")

    return OpenAIChatModel(model_name, provider="openrouter")


def switch_model(model_name: str) -> None:
    """Switch to different model"""
    if model_name not in FREE_MODELS:
        raise ValueError(f"Unknown model: {model_name}. Available: {', '.join(FREE_MODELS)}")
    
    os.environ["OPENROUTER_MODEL"] = model_name
    print(f"✅ Switched to: {model_name}")


# Add to FREE_MODELS if not already present
if "claude-sonnet" not in FREE_MODELS:
    FREE_MODELS.append("claude-sonnet")


# ---------------------------------------------------------------------------
# Usage logging
# ---------------------------------------------------------------------------

def get_metrics() -> Dict:
    """Get current session metrics"""
    # Simple metrics tracking (would need to be enhanced for real tracking)
    try:
        with open(_USAGE_LOG, 'r') as f:
            lines = f.readlines()
        
        total_requests = len(lines)
        total_cost = 0.0
        tokens_used = 0
        models_used = set()
        successful = 0
        
        for line in lines:
            parts = line.strip().split('|')
            if len(parts) >= 4:
                try:
                    tokens_in = int(parts[2].strip().split('=')[1])
                    tokens_out = int(parts[3].strip().split('=')[1])
                    model = parts[1].strip().split('=')[1]
                    
                    tokens_used += tokens_in + tokens_out
                    models_used.add(model)
                    successful += 1
                    
                    # Rough cost estimation
                    if "deepseek" in model.lower():
                        total_cost += (tokens_in * 0.00055 + tokens_out * 0.00219) / 1000
                    elif "claude" in model.lower():
                        total_cost += (tokens_in * 3.0 + tokens_out * 15.0) / 1000
                except:
                    pass
        
        return {
            "total_requests": total_requests,
            "total_cost": total_cost,
            "tokens_used": tokens_used,
            "models_used": list(models_used),
            "success_rate": (successful / total_requests * 100) if total_requests > 0 else 0,
            "budget_remaining": 10.0 - total_cost,  # Default budget
            "wallet_status": "OK" if total_cost < 10.0 else "EXCEEDED"
        }
    except FileNotFoundError:
        return {
            "total_requests": 0,
            "total_cost": 0.0,
            "tokens_used": 0,
            "models_used": [],
            "success_rate": 0.0,
            "budget_remaining": 10.0,
            "wallet_status": "OK"
        }

def print_metrics() -> None:
    """Print metrics summary"""
    metrics = get_metrics()
    print(f"""
💼 WALLET: ${metrics['budget_remaining']:.2f} / $10.00
📊 REQUESTS: {metrics['total_requests']} total
💰 COST: ${metrics['total_cost']:.2f}
📈 TOKENS: {metrics['tokens_used']:,}
🤖 MODELS: {', '.join(metrics['models_used'])}
✅ SUCCESS: {metrics['success_rate']:.1f}%""")

def log_usage(
    task: str,
    tokens_in: int,
    tokens_out: int,
    model: str | None = None,
) -> None:
    """
    Append a usage record to director_usage.log for budget tracking.

    Args:
        task:       Short task description (truncated to 80 chars).
        tokens_in: Input token count from API response.
        tokens_out: Output token count from API response.
        model:      Model used (defaults to OPENROUTER_MODEL env var).
    """
    if model is None:
        model = os.getenv("OPENROUTER_MODEL", FREE_MODELS[0])

    _USAGE_LOG.parent.mkdir(parents=True, exist_ok=True)
    entry = (
        f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | "
        f"model={model} | in={tokens_in} | out={tokens_out} | "
        f"task={task[:80]}\n"
    )
    with open(_USAGE_LOG, "a", encoding="utf-8") as f:
        f.write(entry)
    logger.info(f"Director usage logged: {tokens_in}in + {tokens_out}out tokens")
