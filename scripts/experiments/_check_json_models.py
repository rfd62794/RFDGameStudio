"""Check OpenRouter models for JSON mode support and speed indicators."""
import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

resp = requests.get(
    "https://openrouter.ai/api/v1/models",
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=30,
)
models = resp.json().get("data", [])

# Check for models that support structured_output / response_format json
# and have good speed characteristics
candidates = []
for m in models:
    mid = m.get("id", "")
    arch = m.get("architecture", {})
    modalities = arch.get("input_modalities", [])

    # Check supported_parameters for json mode
    supported = m.get("supported_parameters", [])
    has_json_mode = any("json" in p.lower() or "response_format" in p.lower() or "structured" in p.lower() for p in supported)

    pricing = m.get("pricing", {})
    prompt_price = float(pricing.get("prompt", 0) or 0)
    completion_price = float(pricing.get("completion", 0) or 0)

    # Only text-capable models (we need text → JSON, not vision)
    if "text" not in modalities:
        continue

    # Focus on known-good model families for structured output
    families = [
        "openai/gpt-4",
        "openai/gpt-4.1",
        "openai/gpt-4o",
        "google/gemini-2.5",
        "google/gemini-2.0",
        "anthropic/claude-3.5",
        "anthropic/claude-3.7",
        "deepseek/deepseek-chat",
        "deepseek/deepseek-v3",
        "meta-llama/llama-4",
        "qwen/qwen3",
        "mistral/",
    ]

    if not any(mid.startswith(f) for f in families):
        continue

    # Skip :batch and :free variants for now (we want reliable speed)
    if ":batch" in mid or ":free" in mid:
        continue

    candidates.append({
        "id": mid,
        "json_mode": has_json_mode,
        "supported_params": supported,
        "prompt_per_m": prompt_price * 1_000_000,
        "completion_per_m": completion_price * 1_000_000,
        "context": m.get("context_length", 0),
    })

# Sort by completion price (cheapest first)
candidates.sort(key=lambda x: x["completion_per_m"])

print(f"Found {len(candidates)} candidate models\n")
print(f"{'Model':<50} {'JSON mode':<10} {'$/M prompt':<12} {'$/M compl':<12} {'Context':<10}")
print("-" * 100)
for c in candidates:
    json_flag = "YES" if c["json_mode"] else "no"
    print(f"{c['id']:<50} {json_flag:<10} ${c['prompt_per_m']:<11.2f} ${c['completion_per_m']:<11.2f} {c['context']:<10}")

print("\n\nModels WITH explicit JSON/structured output support:")
json_models = [c for c in candidates if c["json_mode"]]
for c in json_models:
    print(f"  {c['id']}: params={c['supported_params']}")
