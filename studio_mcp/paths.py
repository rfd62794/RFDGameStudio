"""paths.py — locations of sibling repositories this studio talks to.

Defaults assume sibling repos are checked out next to RFDGameStudio (for
example SlimeBreeder beside RFDGameStudio in the same folder). Override the
shared parent folder with RFD_REPOS_ROOT, or a single repository with its own
environment variable where one exists (SITE_REPO_PATH, ANYCREATURE_ROOT).
"""

from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
REPOS_ROOT = Path(os.environ.get("RFD_REPOS_ROOT", str(REPO_ROOT.parent)))


def sibling_repo(name: str, env_var: str | None = None) -> Path:
    """Path to a sibling repository: $env_var when set, else REPOS_ROOT / name."""
    if env_var and os.environ.get(env_var):
        return Path(os.environ[env_var])
    return REPOS_ROOT / name
