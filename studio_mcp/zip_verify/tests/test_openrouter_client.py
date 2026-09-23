"""Tests for openrouter_client.py."""

import json

import pytest

from studio_mcp.zip_verify.openrouter_client import (
    BASE_URL,
    DEFAULT_MODEL,
    OpenRouterClient,
)


class FakeResponse:
    """Stand-in for the object urllib.request.urlopen returns."""

    def __init__(self, body: bytes = b"", lines: list | None = None):
        self._body = body
        self._lines = lines or []

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self) -> bytes:
        return self._body

    def __iter__(self):
        return iter(self._lines)


def _capture_urlopen(monkeypatch, response: FakeResponse) -> list:
    """Patch urllib.request.urlopen; return a list collecting (request, timeout)."""
    seen = []

    def fake_urlopen(request, timeout=None):
        seen.append((request, timeout))
        return response

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
    return seen


def _request_payload(request) -> dict:
    return json.loads(request.data.decode("utf-8"))


def test_init_explicit_key_beats_env(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "env-key")
    client = OpenRouterClient(api_key="explicit-key")
    assert client.api_key == "explicit-key"


def test_init_falls_back_to_env_key(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "env-key")
    client = OpenRouterClient()
    assert client.api_key == "env-key"


def test_init_defaults_model_and_base_url():
    client = OpenRouterClient(api_key="k")
    assert client.model == DEFAULT_MODEL
    assert client.base_url == BASE_URL


def test_complete_raises_without_api_key(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    client = OpenRouterClient()
    with pytest.raises(RuntimeError, match="API key"):
        client.complete([{"role": "user", "content": "hi"}])


def test_complete_posts_payload_and_parses_response(monkeypatch):
    body = json.dumps({"choices": [{"message": {"content": "hello"}}]}).encode("utf-8")
    seen = _capture_urlopen(monkeypatch, FakeResponse(body=body))

    client = OpenRouterClient(api_key="test-key", model="m/test-model")
    result = client.complete([{"role": "user", "content": "hi"}], temperature=0.5)

    assert result == {"choices": [{"message": {"content": "hello"}}]}
    request, timeout = seen[0]
    assert timeout == 120
    assert request.full_url == BASE_URL
    assert request.get_method() == "POST"
    assert request.get_header("Authorization") == "Bearer test-key"
    payload = _request_payload(request)
    assert payload["model"] == "m/test-model"
    assert payload["messages"] == [{"role": "user", "content": "hi"}]
    assert payload["temperature"] == 0.5
    assert "response_format" not in payload
    assert "stream" not in payload


def test_complete_json_mode_adds_response_format(monkeypatch):
    seen = _capture_urlopen(monkeypatch, FakeResponse(body=b"{}"))
    OpenRouterClient(api_key="k").complete([], json_mode=True)
    payload = _request_payload(seen[0][0])
    assert payload["response_format"] == {"type": "json_object"}


def test_complete_stream_raises_without_api_key(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="API key"):
        OpenRouterClient().complete_stream([])


def test_complete_stream_assembles_content_and_calls_on_token(monkeypatch):
    lines = [
        b"",
        b": keep-alive-comment",
        b"data: " + json.dumps({"choices": [{"delta": {"content": "Hello"}}]}).encode("utf-8"),
        b"data: {not valid json",
        b"data: " + json.dumps({"choices": [{"delta": {"content": ", world"}}]}).encode("utf-8"),
        b"data: [DONE]",
        b"data: " + json.dumps({"choices": [{"delta": {"content": "late"}}]}).encode("utf-8"),
    ]
    seen = _capture_urlopen(monkeypatch, FakeResponse(lines=lines))

    tokens = []
    result = OpenRouterClient(api_key="k").complete_stream(
        [{"role": "user", "content": "hi"}], on_token=tokens.append
    )

    assert result == "Hello, world"
    assert tokens == ["Hello", ", world"]
    request, timeout = seen[0]
    assert timeout == 300
    payload = _request_payload(request)
    assert payload["stream"] is True


def test_complete_stream_skips_empty_choices_and_missing_content(monkeypatch):
    lines = [
        b"data: " + json.dumps({"choices": []}).encode("utf-8"),
        b"data: " + json.dumps({"choices": [{"delta": {}}]}).encode("utf-8"),
        b"data: " + json.dumps({"choices": [{"delta": {"role": "assistant"}}]}).encode("utf-8"),
        b"data: " + json.dumps({"choices": [{"delta": {"content": "ok"}}]}).encode("utf-8"),
        b"data: [DONE]",
    ]
    _capture_urlopen(monkeypatch, FakeResponse(lines=lines))
    assert OpenRouterClient(api_key="k").complete_stream([]) == "ok"


def test_complete_stream_json_mode_adds_response_format(monkeypatch):
    seen = _capture_urlopen(monkeypatch, FakeResponse(lines=[b"data: [DONE]"]))
    OpenRouterClient(api_key="k").complete_stream([], json_mode=True)
    payload = _request_payload(seen[0][0])
    assert payload["response_format"] == {"type": "json_object"}


def test_get_content_returns_first_choice_content():
    client = OpenRouterClient(api_key="k")
    response = {"choices": [{"message": {"content": "answer"}}]}
    assert client.get_content(response) == "answer"


def test_get_content_empty_choices_returns_empty_string():
    client = OpenRouterClient(api_key="k")
    assert client.get_content({}) == ""
    assert client.get_content({"choices": []}) == ""


def test_get_content_missing_message_or_content_returns_empty_string():
    client = OpenRouterClient(api_key="k")
    assert client.get_content({"choices": [{}]}) == ""
    assert client.get_content({"choices": [{"message": {}}]}) == ""
