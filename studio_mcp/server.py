"""server.py — RFDStudioMCP FastMCP SSE server on port 8025.

Exposes five tools to Claude:
  studio_load_game, studio_call, studio_get_schema,
  studio_get_systems, studio_run_headless

Run with:
  uv run uvicorn studio_mcp.server:asgi_app --host 0.0.0.0 --port 8025
"""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from studio_mcp.tools import (
    studio_call,
    studio_get_schema,
    studio_get_systems,
    studio_load_game,
    studio_run_headless,
)

mcp = FastMCP("RFDStudioMCP")

mcp.tool()(studio_load_game)
mcp.tool()(studio_call)
mcp.tool()(studio_get_schema)
mcp.tool()(studio_get_systems)
mcp.tool()(studio_run_headless)

asgi_app = mcp.sse_app()
