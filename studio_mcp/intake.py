"""intake.py — AI Studio zip intake: hash, version, timeline, rename.

Hashes the extracted contents of a zip (ignoring zip metadata timestamps),
compares against the concept's current known hash, then renames new drops
into a canonical versioned filename and appends an entry to a human-readable
MANIFEST.md.

Version scheme: MAJOR.MINOR.PATCHRrevision
- Default bump: R (revision) only
- Explicit bumps: minor, patch, major cascade as documented

The intake tool never infers semantic meaning from filenames or content diffs.
"""

from __future__ import annotations

import hashlib
import re
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

_VERSION_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)R(\d+)$")


def _slug_to_canonical_pattern(slug: str) -> re.Pattern:
    """Return a regex that matches the canonical versioned filename for this slug."""
    return re.compile(rf"^{re.escape(slug)}_v\d+\.\d+\.\d+R\d+\.zip$")


def content_hash(zip_path: Path) -> str:
    """Hash based on sorted (relative path, file bytes) pairs.

    This ignores zip-internal timestamps and metadata, which can differ
    between two exports of genuinely identical code.
    """
    hasher = hashlib.sha256()
    with zipfile.ZipFile(zip_path) as zf:
        entries = sorted(
            (info.filename, zf.read(info.filename))
            for info in zf.infolist()
            if not info.is_dir()
        )
    for name, data in entries:
        hasher.update(name.encode("utf-8"))
        hasher.update(data)
    return hasher.hexdigest()


def get_file_times(path: Path) -> tuple[str, str]:
    """Return ISO-formatted (created, modified) from the file's own timestamps.

    On Windows, st_ctime is creation time; on Unix it is the last metadata
    change time. This pipeline is intended to run on the Windows host where
    the AI Studio exports are dropped, so st_ctime is treated as creation time.
    """
    stat = path.stat()
    created = datetime.fromtimestamp(stat.st_ctime).replace(microsecond=0).isoformat()
    modified = datetime.fromtimestamp(stat.st_mtime).replace(microsecond=0).isoformat()
    return created, modified


@dataclass
class VersionEntry:
    version: str
    timestamp: str
    hash: str
    source_file: str
    note: str = ""


def _parse_version(version: str) -> tuple[int, int, int, int]:
    match = _VERSION_RE.fullmatch(version)
    if not match:
        raise ValueError(f"Invalid version string: {version!r}")
    return tuple(int(g) for g in match.groups())  # type: ignore[return-value]


def _format_version(major: int, minor: int, patch: int, revision: int) -> str:
    return f"{major}.{minor}.{patch}R{revision}"


_VALID_BUMPS = {"patch", "minor", "major"}


def _validate_bump(bump: str | None) -> None:
    if bump is not None and bump not in _VALID_BUMPS:
        raise ValueError(f"Invalid bump: {bump!r}. Use None, 'patch', 'minor', or 'major'.")


def bump_version(current_version: str | None, bump: str | None) -> str:
    """Compute the next version according to the cascade rules.

    - None:     +R only
    - patch:    +PATCH,  R=1
    - minor:    +MINOR, PATCH=0, R=1
    - major:    +MAJOR, MINOR=0, PATCH=0, R=1

    The very first zip for a concept is always 0.1.0R1, per the version
    scheme. Bumps only apply to subsequent versions.
    """
    _validate_bump(bump)

    if current_version is None:
        return "0.1.0R1"

    major, minor, patch, revision = _parse_version(current_version)

    if bump is None:
        revision += 1
    elif bump == "patch":
        patch += 1
        revision = 1
    elif bump == "minor":
        minor += 1
        patch = 0
        revision = 1
    elif bump == "major":
        major += 1
        minor = 0
        patch = 0
        revision = 1

    return _format_version(major, minor, patch, revision)


def _manifest_path(concept_dir: Path) -> Path:
    return concept_dir / "MANIFEST.md"


def _display_name(slug: str) -> str:
    return slug.replace("-", " ").replace("_", " ").title()


def load_manifest(concept_dir: Path, slug: str) -> tuple[list[VersionEntry], str | None, str]:
    """Parse the concept's MANIFEST.md, or return an empty manifest."""
    manifest_path = _manifest_path(concept_dir)
    if not manifest_path.exists():
        return [], None, "prototyping"

    text = manifest_path.read_text(encoding="utf-8")
    current_version: str | None = None
    status = "prototyping"

    current_match = re.search(r"^Current version:\s*(\d+\.\d+\.\d+R\d+)$", text, re.MULTILINE)
    if current_match:
        current_version = current_match.group(1)

    status_match = re.search(r"^Status:\s*(.+?)$", text, re.MULTILINE)
    if status_match:
        status = status_match.group(1).strip()

    entries: list[VersionEntry] = []
    # Split on header blocks (### version — timestamp)
    parts = re.split(r"^###\s+(.+?)\s+—\s+(.+?)$", text, flags=re.MULTILINE)
    # parts[0] is preamble, then (version, timestamp, body) triples
    for i in range(1, len(parts), 3):
        version = parts[i].strip()
        timestamp = parts[i + 1].strip()
        body = parts[i + 2]

        hash_match = re.search(r"^\s*-\s*Hash:\s*(\S+)", body, re.MULTILINE)
        source_match = re.search(r"^\s*-\s*Source file:\s*(.+?)$", body, re.MULTILINE)
        note_match = re.search(r"^\s*-\s*Note:\s*(.+?)$", body, re.MULTILINE)

        entries.append(
            VersionEntry(
                version=version,
                timestamp=timestamp,
                hash=hash_match.group(1) if hash_match else "",
                source_file=source_match.group(1).strip() if source_match else "",
                note=note_match.group(1).strip() if note_match else "",
            )
        )

    return entries, current_version, status


def write_manifest(concept_dir: Path, slug: str, current_version: str, status: str, entries: list[VersionEntry]) -> None:
    """Write the concept's MANIFEST.md in the standard human-readable format."""
    manifest_path = _manifest_path(concept_dir)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        f"# {_display_name(slug)} — Intake History",
        "",
        f"Current version: {current_version}",
        f"Status: {status}",
        "",
        "## Version History",
        "",
    ]

    for entry in entries:
        lines.append(f"### {entry.version} — {entry.timestamp}")
        lines.append(f"- Hash: {entry.hash}")
        lines.append(f"- Source file: {entry.source_file}")
        if entry.note:
            lines.append(f"- Note: {entry.note}")
        lines.append("")

    manifest_path.write_text("\n".join(lines), encoding="utf-8")


def _ensure_unique_path(path: Path) -> Path:
    """Return a unique path; if the target exists, append an index before the suffix."""
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    for i in range(1, 1000):
        candidate = parent / f"{stem}_{i}{suffix}"
        if not candidate.exists():
            return candidate
    raise FileExistsError(f"Could not find a unique path for {path}")


def _validate_slug(slug: str) -> None:
    if not slug:
        raise ValueError("concept_slug must not be empty")
    if "/" in slug or "\\" in slug or ".." in slug:
        raise ValueError(f"Invalid concept_slug: {slug!r}")


def process_intake(concept_slug: str, bump: str | None = None, note: str | None = None) -> dict:
    """Process any newly-dropped, generically-named zips in intake/{concept_slug}/.

    Default bump is R (revision) — pass bump='minor'/'patch'/'major' only when
    explicitly declaring a semantic change.
    """
    _validate_slug(concept_slug)
    _validate_bump(bump)

    concept_dir = REPO_ROOT / "intake" / concept_slug
    concept_dir.mkdir(parents=True, exist_ok=True)

    entries, current_version, status = load_manifest(concept_dir, concept_slug)
    top_hash = entries[0].hash if entries else None
    pattern = _slug_to_canonical_pattern(concept_slug)

    # Only process zips not already in canonical versioned form.
    raw_zips = [
        p for p in concept_dir.glob("*.zip")
        if not pattern.fullmatch(p.name)
    ]

    # Process newest files first. If bump/note is supplied, it applies to the
    # most recent drop; subsequent files in the same run get R-bumps.
    raw_zips.sort(key=lambda p: p.stat().st_ctime, reverse=True)

    processed: list[dict] = []
    duplicates: list[dict] = []
    errors: list[str] = []
    applied_bump = False
    applied_note = False

    for zip_path in raw_zips:
        try:
            file_hash = content_hash(zip_path)
            created, modified = get_file_times(zip_path)

            if file_hash == top_hash:
                # Duplicate of the current known version.
                duplicate_path = _ensure_unique_path(zip_path.with_name(zip_path.name + ".duplicate"))
                zip_path.rename(duplicate_path)
                duplicates.append(
                    {
                        "original": zip_path.name,
                        "moved_to": duplicate_path.name,
                        "hash": file_hash,
                        "reason": "duplicate of current version",
                    }
                )
                continue

            use_bump = bump if not applied_bump else None
            use_note = note if not applied_note else None
            new_version = bump_version(current_version, use_bump)
            new_name = f"{concept_slug}_v{new_version}.zip"
            target_path = concept_dir / new_name

            if target_path.exists():
                errors.append(
                    f"Refusing to overwrite existing versioned zip: {new_name}"
                )
                continue

            zip_path.rename(target_path)

            entry = VersionEntry(
                version=new_version,
                timestamp=created,
                hash=file_hash,
                source_file=new_name,
                note=use_note or "",
            )
            entries.insert(0, entry)
            current_version = new_version
            top_hash = file_hash

            processed.append(
                {
                    "original": zip_path.name,
                    "version": new_version,
                    "hash": file_hash,
                    "source_file": new_name,
                    "created": created,
                    "modified": modified,
                    "note": use_note,
                }
            )

            applied_bump = True
            if use_note:
                applied_note = True

        except Exception as exc:
            errors.append(f"{zip_path.name}: {exc}")

    if current_version is not None:
        write_manifest(concept_dir, concept_slug, current_version, status, entries)

    return {
        "concept_slug": concept_slug,
        "processed": processed,
        "duplicates": duplicates,
        "errors": errors,
        "current_version": current_version,
        "manifest_path": str(_manifest_path(concept_dir)),
    }
