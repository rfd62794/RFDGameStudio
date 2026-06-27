"""session_store.py — In-memory session registry.

Sessions are GameSession objects keyed by session_id.
They do not persist between server restarts.
Claude must call studio_load_game at the start of every session.
"""

from __future__ import annotations

import uuid
from typing import Dict, Optional

from studio.runtime import GameSession

_sessions: Dict[str, GameSession] = {}


def create_session(session: GameSession) -> str:
    session_id = str(uuid.uuid4())[:8]
    _sessions[session_id] = session
    return session_id


def get_session(session_id: str) -> Optional[GameSession]:
    return _sessions.get(session_id)


def list_sessions() -> list[str]:
    return list(_sessions.keys())


def destroy_session(session_id: str) -> bool:
    return _sessions.pop(session_id, None) is not None
