import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from studio_mcp.tools import studio_deploy_arcade

result = studio_deploy_arcade()
print(json.dumps(result, indent=2))
