"""Write reports for both corrected runs."""

import os
from pathlib import Path

from dotenv import load_dotenv

from studio_mcp.zip_verify.openrouter_client import OpenRouterClient
from studio_mcp.zip_verify.report import ZipVerifier

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")
client = OpenRouterClient(api_key=api_key)

v1 = ZipVerifier(r"C:\Users\cheat\Downloads\break-streamer.zip", client=client)
path1 = v1.write_report()
print(f"Report 1: {path1}", flush=True)

v2 = ZipVerifier(r"C:\Users\cheat\Downloads\break-streamer-mvp.zip", client=client)
path2 = v2.write_report()
print(f"Report 2: {path2}", flush=True)
