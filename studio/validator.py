"""validator.py — Schema validation for data.yaml game definitions."""

from __future__ import annotations

from typing import Any


class ValidationError(Exception):
    """Raised when a data.yaml fails the studio's structural contract."""


# Required top-level sections in every data.yaml
_REQUIRED_TOP_LEVEL = {"meta", "constants", "schemas", "tables"}

# Required sub-keys inside meta
_REQUIRED_META = {"game_id", "version", "description"}

# Required sub-keys inside constants
_REQUIRED_CONSTANTS = {"race", "breeding", "stats", "betting"}


def validate_data(data: dict[str, Any], game_id: str | None = None) -> None:
    """Validate a parsed data.yaml dict against the studio's structural contract.

    Raises :class:`ValidationError` with a descriptive message on any violation.
    Does *not* validate field types — that is the runtime bridge's job.
    """
    label = f"data.yaml for '{game_id}'" if game_id else "data.yaml"

    if not isinstance(data, dict):
        raise ValidationError(f"{label}: root must be a YAML mapping, got {type(data).__name__}")

    missing_top = _REQUIRED_TOP_LEVEL - set(data.keys())
    if missing_top:
        raise ValidationError(
            f"{label}: missing required top-level sections: {sorted(missing_top)}"
        )

    # Validate meta
    meta = data["meta"]
    if not isinstance(meta, dict):
        raise ValidationError(f"{label}: 'meta' must be a mapping")
    missing_meta = _REQUIRED_META - set(meta.keys())
    if missing_meta:
        raise ValidationError(
            f"{label}: 'meta' missing required keys: {sorted(missing_meta)}"
        )

    # game_id consistency check when caller provides expected game_id
    if game_id and meta.get("game_id") != game_id:
        raise ValidationError(
            f"{label}: meta.game_id '{meta.get('game_id')}' does not match "
            f"expected game_id '{game_id}'"
        )

    # Validate constants structure
    constants = data["constants"]
    if not isinstance(constants, dict):
        raise ValidationError(f"{label}: 'constants' must be a mapping")
    missing_const = _REQUIRED_CONSTANTS - set(constants.keys())
    if missing_const:
        raise ValidationError(
            f"{label}: 'constants' missing required sub-sections: {sorted(missing_const)}"
        )

    # Validate schemas is a non-empty mapping
    schemas = data["schemas"]
    if not isinstance(schemas, dict) or not schemas:
        raise ValidationError(
            f"{label}: 'schemas' must be a non-empty mapping of entity definitions"
        )

    for entity_name, entity_def in schemas.items():
        if not isinstance(entity_def, dict):
            raise ValidationError(
                f"{label}: schema '{entity_name}' must be a mapping"
            )
        if "fields" not in entity_def:
            raise ValidationError(
                f"{label}: schema '{entity_name}' is missing required 'fields' key"
            )

    # Validate tables is a non-empty mapping
    tables = data["tables"]
    if not isinstance(tables, dict) or not tables:
        raise ValidationError(
            f"{label}: 'tables' must be a non-empty mapping of lookup tables"
        )
