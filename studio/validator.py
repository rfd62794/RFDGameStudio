"""validator.py — Validates a parsed data.yaml against the studio contract.

Studio contract: every data.yaml must have a 'game' section with the four
identity fields. This is the minimum required by the studio — not by any
individual game's schema.
"""

from __future__ import annotations

from typing import Any


class ValidationError(Exception):
    """Raised when a data.yaml fails the studio's structural contract."""


# The four required identity fields under the top-level 'game' key.
_REQUIRED_GAME_FIELDS = ("id", "name", "version", "studio")


def validate_data(data: dict[str, Any]) -> None:
    """Validate a parsed data.yaml dict against the studio contract.

    Required structure::

        game:
          id: <string>
          name: <string>
          version: <string>
          studio: <string>

    Raises :class:`ValidationError` with the name of the missing/malformed
    field if validation fails. Returns ``None`` on success.
    """
    if not isinstance(data, dict):
        raise ValidationError(
            f"data.yaml must be a YAML mapping, got {type(data).__name__}"
        )

    if "game" not in data:
        raise ValidationError("Missing field: game")

    game = data["game"]
    if not isinstance(game, dict):
        raise ValidationError(
            f"'game' must be a mapping, got {type(game).__name__}"
        )

    for field in _REQUIRED_GAME_FIELDS:
        if field not in game:
            raise ValidationError(f"Missing field: game.{field}")
        if not isinstance(game[field], str):
            raise ValidationError(
                f"game.{field} must be a string, got {type(game[field]).__name__}"
            )
