import json
import sys
sys.path.insert(0, r"C:\Github\RFDGameStudio")
from studio_mcp.tools import studio_deploy_arcade

result = studio_deploy_arcade()
print(json.dumps(result, indent=2))
