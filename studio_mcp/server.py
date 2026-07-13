"""server.py — RFDStudioMCP FastMCP SSE server on port 8025.

Exposes fifteen tools to Claude:
  studio_load_game, studio_call, studio_get_schema,
  studio_get_systems, studio_run_headless, studio_validate_game,
  studio_run_tests, studio_balance_report, studio_get_state,
  studio_screenshot, studio_build,
  studio_write_arcade_index, studio_write_arcade_page, studio_deploy_arcade,
  studio_process_intake, studio_promote_to_examples

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
    studio_balance_report,
    studio_build,
    studio_call,
    studio_get_schema,
    studio_get_state,
    studio_get_systems,
    studio_load_game,
    studio_process_intake,
    studio_promote_to_examples,
    studio_run_headless,
    studio_run_tests,
    studio_screenshot,
    studio_validate_game,
    studio_write_arcade_index,
    studio_write_arcade_page,
    studio_deploy_arcade,
)

mcp = FastMCP("RFDStudioMCP")

mcp.tool()(studio_load_game)
mcp.tool()(studio_call)
mcp.tool()(studio_get_schema)
mcp.tool()(studio_get_systems)
mcp.tool()(studio_run_headless)
mcp.tool()(studio_validate_game)
mcp.tool()(studio_run_tests)
mcp.tool()(studio_balance_report)
mcp.tool()(studio_get_state)
mcp.tool()(studio_screenshot)
mcp.tool()(studio_build)
mcp.tool()(studio_write_arcade_index)
mcp.tool()(studio_write_arcade_page)
mcp.tool()(studio_deploy_arcade)
mcp.tool()(studio_process_intake)
mcp.tool()(studio_promote_to_examples)


async def health(request: Request) -> Response:
    body = json.dumps({"status": "ok", "service": "RFDStudioMCP", "port": 8025})
    return Response(content=body, media_type="application/json")


asgi_app = Starlette(
    routes=[
        Route("/health", health),
        Mount("/", app=mcp.sse_app()),
    ]
)
