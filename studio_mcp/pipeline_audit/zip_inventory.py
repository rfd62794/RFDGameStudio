"""zip_inventory.py — list AI Studio zip exports and cross-reference the registry."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
INTAKE_DIR = REPO_ROOT / "intake"
_VERSIONED_ZIP_RE = re.compile(r"^(?P<slug>.+)_v(?P<version>\d+\.\d+\.\d+R\d+)\.zip$")


@dataclass
class ZipExport:
    path: Path
    slug: str
    version: str
    created: str
    modified: str
    imported: bool = False
    game_id: str | None = None
    warnings: list[str] = field(default_factory=list)


def _slug_to_game_id(slug: str) -> str:
    """Map a kebab-case intake folder slug to the arcade game id (underscore)."""
    return slug.replace("-", "_")


def list_zip_exports(intake_dir: Path = INTAKE_DIR) -> list[ZipExport]:
    """Return every versioned zip in the intake directory with metadata."""
    exports: list[ZipExport] = []
    if not intake_dir.exists():
        return exports

    for concept_dir in intake_dir.iterdir():
        if not concept_dir.is_dir():
            continue
        for zip_path in concept_dir.iterdir():
            if not zip_path.is_file() or zip_path.suffix != ".zip":
                continue
            match = _VERSIONED_ZIP_RE.match(zip_path.name)
            if not match:
                continue
            slug = match.group("slug")
            version = match.group("version")
            stat = zip_path.stat()
            created = datetime.fromtimestamp(stat.st_ctime).replace(microsecond=0).isoformat()
            modified = datetime.fromtimestamp(stat.st_mtime).replace(microsecond=0).isoformat()
            exports.append(
                ZipExport(
                    path=zip_path,
                    slug=slug,
                    version=version,
                    created=created,
                    modified=modified,
                )
            )

    exports.sort(key=lambda e: (e.slug, e.version))
    return exports


def cross_reference_registry(
    exports: list[ZipExport],
    registry_game_ids: set[str],
) -> list[ZipExport]:
    """Annotate each export with whether its game_id is present in the registry."""
    for export in exports:
        game_id = _slug_to_game_id(export.slug)
        export.game_id = game_id
        export.imported = game_id in registry_game_ids
    return exports


def read_zip_inventory(
    intake_dir: Path = INTAKE_DIR,
    registry_game_ids: set[str] | None = None,
) -> dict:
    """Return a structured inventory of AI Studio zip exports vs. registry entries."""
    exports = list_zip_exports(intake_dir)
    if registry_game_ids is not None:
        exports = cross_reference_registry(exports, registry_game_ids)

    imported = [e for e in exports if e.imported]
    pending = [e for e in exports if not e.imported]

    return {
        "intake_dir": str(intake_dir),
        "total_exports": len(exports),
        "imported": len(imported),
        "pending": len(pending),
        "exports": [export_to_dict(e) for e in exports],
        "pending_exports": [export_to_dict(e) for e in pending],
    }


def export_to_dict(export: ZipExport) -> dict:
    return {
        "path": str(export.path),
        "slug": export.slug,
        "version": export.version,
        "created": export.created,
        "modified": export.modified,
        "game_id": export.game_id,
        "imported": export.imported,
        "warnings": export.warnings,
    }
