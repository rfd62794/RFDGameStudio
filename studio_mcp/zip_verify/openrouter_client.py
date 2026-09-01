"""openrouter_client.py — thin, injectable OpenRouter chat-completions wrapper."""

from __future__ import annotations

import json
import os
import urllib.request
from typing import Any, Generator

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

    def complete_stream(
        self,
        messages: list[dict[str, Any]],
        temperature: float = 0.1,
        on_token: Any | None = None,
    ) -> str:
        """Send a streaming chat-completions request, yielding tokens as they arrive.

        Uses SSE (Server-Sent Events) with stream=true. The model generates at
        the same rate — streaming doesn't make it faster, but it makes progress
        visible instead of blocking silently until the full response arrives.

        Args:
            messages: the chat messages (same format as complete()).
            temperature: sampling temperature.
            on_token: optional callback called with each content chunk as it
                arrives. Useful for printing progress dots or partial output.

        Returns:
            The full assembled content string (same as get_content(complete())).
        """
        if not self.api_key:
            raise RuntimeError("OpenRouter API key not configured")

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "stream": True,
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

        full_content: list[str] = []
        with urllib.request.urlopen(request, timeout=300) as response:
            for raw_line in response:
                line = raw_line.decode("utf-8").strip()
                if not line or not line.startswith("data: "):
                    continue
                data_str = line[6:]  # strip "data: " prefix
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                except json.JSONDecodeError:
                    continue
                choices = chunk.get("choices", [])
                if not choices:
                    continue
                delta = choices[0].get("delta", {})
                token = delta.get("content", "")
                if token:
                    full_content.append(token)
                    if on_token is not None:
                        on_token(token)

        return "".join(full_content)

    def get_content(self, response: dict[str, Any]) -> str:
        """Extract the assistant message content from an OpenRouter response."""
        choices = response.get("choices", [])
        if not choices:
            return ""
        message = choices[0].get("message", {})
        return message.get("content", "")
