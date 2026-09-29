"""naming.py — slug and game id from an AI Studio zip name (spec §2 stage 1)."""
from __future__ import annotations

import re

_COPY_SUFFIX = re.compile(r"\s*\(\d+\)$")
_VERSION_SUFFIX = re.compile(r"_v\d+\.\d+\.\d+R\d+$")


def slug_from_zip(name: str) -> str:
    stem = re.split(r"[\\/]", name)[-1]
    if stem.lower().endswith(".zip"):
        stem = stem[:-4]
    stem = _VERSION_SUFFIX.sub("", _COPY_SUFFIX.sub("", stem.strip()))
    slug = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    if not slug:
        raise ValueError(f"cannot derive a slug from {name!r}; pass --slug")
    return slug


def game_id(slug: str) -> str:
    return slug.replace("-", "_")
