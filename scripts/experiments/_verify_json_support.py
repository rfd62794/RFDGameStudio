"""Verify JSON mode support for specific models."""
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

resp = requests.get(
    "https://openrouter.ai/api/v1/models",
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=30,
)
models = {m["id"]: m for m in resp.json()["data"]}

targets = [
    "deepseek/deepseek-v4-flash-0731",
    "deepseek/deepseek-v4-flash",
    "z-ai/glm-5.2:free",
    "qwen/qwen3.7-flash",
    "openai/gpt-4o-mini",
    "openai/gpt-4.1-mini",
    "google/gemini-2.5-flash",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "mistralai/mistral-nemo",
    "meta-llama/llama-3.1-8b-instruct",
]

for tid in targets:
    m = models.get(tid)
    if not m:
        print(f"  NOT FOUND: {tid}")
        continue
    supported = m.get("supported_parameters", [])
    has_rf = "response_format" in supported
    has_so = "structured_outputs" in supported
    pricing = m.get("pricing", {})
    pp = float(pricing.get("prompt", 0) or 0) * 1_000_000
    cp = float(pricing.get("completion", 0) or 0) * 1_000_000
    ctx = m.get("context_length", 0)
    print(f"{tid:<45} rf={has_rf!s:<6} so={has_so!s:<6} ${pp:.2f}/${cp:.2f} per M  ctx={ctx}")
