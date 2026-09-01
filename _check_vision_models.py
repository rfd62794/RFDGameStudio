"""Check specific known vision models for availability."""
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

# Look for specific known-good vision models
targets = [
    "google/gemini-2.5-flash",
    "google/gemini-2.5-flash-lite",
    "google/gemini-2.0-flash",
    "google/gemini-flash-1.5",
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "openai/gpt-4.1-mini",
    "openai/gpt-4.1",
    "openai/gpt-4.1-nano",
    "meta-llama/llama-4-scout",
    "qwen/qwen3.7-flash",
    "qwen/qwen-2.5-vl",
]

model_map = {m["id"]: m for m in models}

for target in targets:
    m = model_map.get(target)
    if m:
        arch = m.get("architecture", {})
        modalities = arch.get("input_modalities", [])
        pricing = m.get("pricing", {})
        prompt_price = pricing.get("prompt", "?")
        completion_price = pricing.get("completion", "?")
        print(f"  FOUND: {target}")
        print(f"    modalities: {modalities}")
        print(f"    prompt: ${prompt_price}, completion: ${completion_price}")
    else:
        print(f"  NOT FOUND: {target}")
