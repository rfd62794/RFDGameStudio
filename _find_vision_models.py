"""Find live vision-capable models on OpenRouter."""
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

vision_models = []
for m in models:
    arch = m.get("architecture", {})
    modality = arch.get("input_modalities", [])
    if "image" in modality:
        mid = m.get("id", "")
        pricing = m.get("pricing", {})
        prompt_price = pricing.get("prompt", "0")
        vision_models.append((mid, prompt_price))

# Sort by price ascending (cheapest first)
vision_models.sort(key=lambda x: float(x[1]) if x[1] else 0)

print(f"Total models: {len(models)}")
print(f"Vision-capable models: {len(vision_models)}")
print()
print("Cheapest 20 vision models:")
for mid, price in vision_models[:20]:
    print(f"  {mid}: ${price}/token prompt")
