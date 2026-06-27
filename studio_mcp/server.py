"""server.py — RFDStudioMCP FastMCP SSE server on port 8025.

Exposes five tools to Claude:
  studio_load_game, studio_call, studio_get_schema,
  studio_get_systems, studio_run_headless

Run with:
  uv run uvicorn studio_mcp.server:asgi_app --host 0.0.0.0 --port 8025
"""

from __future__ import annotations

import json

from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import Response
from starlette.routing import Mount, Route

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


async def health(request: Request) -> Response:
    body = json.dumps({"status": "ok", "service": "RFDStudioMCP", "port": 8025})
    return Response(content=body, media_type="application/json")


asgi_app = Starlette(
    routes=[
        Route("/health", health),
        Mount("/", app=mcp.sse_app()),
    ]
)
