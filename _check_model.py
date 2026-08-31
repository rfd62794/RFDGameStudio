import os
from pathlib import Path
from studio_mcp.zip_verify.openrouter_client import OpenRouterClient

env_path = Path(".env")
for line in env_path.read_text(encoding="utf-8").splitlines():
    if line.strip() and "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        os.environ[k] = v

client = OpenRouterClient()
resp = client.complete([
    {"role": "user", "content": "Reply with exactly: OK"}
])
print("model:", resp.get("model"))
print("content:", client.get_content(resp))
