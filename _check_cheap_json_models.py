"""Find the cheapest models on OpenRouter that support JSON mode."""
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

candidates = []
for m in models:
    mid = m.get("id", "")
    arch = m.get("architecture", {})
    modalities = arch.get("input_modalities", [])

    # Must be text-capable (designer call is text → JSON)
    if "text" not in modalities:
        continue

    # Must support response_format or structured_outputs
    supported = m.get("supported_parameters", [])
    has_json = "response_format" in supported or "structured_outputs" in supported
    if not has_json:
        continue

    pricing = m.get("pricing", {})
    prompt_price = float(pricing.get("prompt", 0) or 0)
    completion_price = float(pricing.get("completion", 0) or 0)

    # Skip :batch variants (not real-time)
    if ":batch" in mid:
        continue

    # Total cost per million tokens (prompt + completion, assuming ~1:1 ratio)
    total_per_m = prompt_price * 1_000_000 + completion_price * 1_000_000

    candidates.append({
        "id": mid,
        "prompt_per_m": prompt_price * 1_000_000,
        "completion_per_m": completion_price * 1_000_000,
        "total_per_m": total_per_m,
        "context": m.get("context_length", 0),
        "has_structured": "structured_outputs" in supported,
        "free": ":free" in mid,
    })

# Sort by completion price (cheapest first) — completion dominates
# since the spec output is much larger than the prompt
candidates.sort(key=lambda x: x["completion_per_m"])

print(f"Found {len(candidates)} JSON-capable text models\n")
print(f"{'Model':<55} {'$/M prompt':<12} {'$/M compl':<12} {'Context':<10} {'Struct':<7} {'Free':<5}")
print("-" * 115)
for c in candidates[:40]:
    struct_flag = "YES" if c["has_structured"] else "no"
    free_flag = "YES" if c["free"] else ""
    print(f"{c['id']:<55} ${c['prompt_per_m']:<11.2f} ${c['completion_per_m']:<11.2f} {c['context']:<10} {struct_flag:<7} {free_flag:<5}")
