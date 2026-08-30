"""openrouter_client.py — thin, injectable OpenRouter chat-completions wrapper."""

from __future__ import annotations

import json
import os
import urllib.request
from typing import Any

DEFAULT_MODEL = "deepseek/deepseek-v4-flash-0731"
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterClient:
    """Minimal OpenRouter client. The underlying HTTP call is isolated here
    so tests can inject a fake client with the same `complete` signature.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        base_url: str = BASE_URL,
    ):
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY", "")
        self.model = model
        self.base_url = base_url

    def complete(self, messages: list[dict[str, str]], temperature: float = 0.1) -> dict[str, Any]:
        """Send a chat-completions request and return the raw JSON response."""
        if not self.api_key:
            raise RuntimeError("OpenRouter API key not configured")

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            self.base_url,
            data=data,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(request, timeout=120) as response:
            raw = response.read().decode("utf-8")
        return json.loads(raw)

    def get_content(self, response: dict[str, Any]) -> str:
        """Extract the assistant message content from an OpenRouter response."""
        choices = response.get("choices", [])
        if not choices:
            return ""
        message = choices[0].get("message", {})
        return message.get("content", "")
