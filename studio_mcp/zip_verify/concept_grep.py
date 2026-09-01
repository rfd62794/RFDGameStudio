"""concept_grep.py — check whether the concept asked for appears in the zip."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DIRECTIVE_DIRS = [REPO_ROOT / "docs" / "directives", REPO_ROOT / "docs" / "gdd"]

_STOP_WORDS = {
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
    "her", "was", "one", "our", "out", "day", "get", "has", "him", "his",
    "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy",
    "did", "its", "let", "put", "say", "she", "too", "use", "will", "with",
    "have", "this", "that", "from", "they", "been", "were", "said", "each",
    "which", "their", "time", "would", "there", "could", "other", "after",
    "first", "never", "these", "think", "where", "being", "every", "great",
    "might", "shall", "while", "should", "those", "while", "would", "could",
}


def _slug_variants(slug: str) -> set[str]:
    return {slug, slug.replace("-", "_"), slug.replace("_", "-")}


def find_source_directive(slug: str) -> dict[str, Any]:
    """Search docs/directives and docs/gdd for a directive matching the slug."""
    variants = _slug_variants(slug)
    for directive_dir in DIRECTIVE_DIRS:
        if not directive_dir.exists():
            continue
        for path in directive_dir.iterdir():
            if not path.is_file() or path.suffix != ".md":
                continue
            name_lower = path.stem.lower()
            if any(v.lower() in name_lower for v in variants):
                return {
                    "found": True,
                    "path": str(path),
                    "text": path.read_text(encoding="utf-8", errors="replace"),
                }
    return {"found": False, "path": None, "text": None}


def _strip_long_backtick_spans(text: str) -> str:
    """Keep short, single-line backtick spans (identifiers, selectors);
    strip only genuine multi-line or long code blocks.
    """
    def _replace(m: re.Match) -> str:
        content = m.group(1)
        if "\n" in content or len(content) > 40:
            return ""  # real code block — strip
        return content  # short identifier/selector — keep, feeds extraction
    return re.sub(r"`([^`]+)`", _replace, text)


_DIRECTIVE_MARKERS = [
    re.compile(r"\*\*Directive:\*\*", re.IGNORECASE),
    re.compile(r"^##?\s*§\d", re.MULTILINE),
]


def _scope_to_directive_section(text: str) -> str:
    """Return the text from the first directive marker onward, if found.
    Falls back to the full text when no marker matches — existing
    fixtures without this shape must not regress.
    """
    earliest = None
    for pattern in _DIRECTIVE_MARKERS:
        m = pattern.search(text)
        if m and (earliest is None or m.start() < earliest):
            earliest = m.start()
    return text[earliest:] if earliest is not None else text


def _extract_concepts(text: str) -> list[str]:
    """Extract plausible directive concepts as lowercase keywords."""
    # Scope to the directive section if a marker is found.
    text = _scope_to_directive_section(text)

    # Strip markdown formatting and code blocks.
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = _strip_long_backtick_spans(text)
    text = re.sub(r"\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"[^A-Za-z0-9_\-\s]", " ", text)

    candidates: list[str] = []
    for token in text.split():
        token = token.strip("_-").lower()
        if len(token) < 5 or token in _STOP_WORDS:
            continue
        if re.match(r"^[0-9]+$", token):
            continue
        candidates.append(token)

    # Deduplicate while preserving order.
    seen: set[str] = set()
    unique: list[str] = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            unique.append(c)
    return unique[:30]


def concept_check(source_dir: Path, slug: str) -> dict[str, Any]:
    """Check whether the directive's concepts appear in the source tree.

    Works for either a zip-extraction scratch directory or a tracked directory.
    """
    directive = find_source_directive(slug)
    if not directive["found"]:
        return {
            "slug": slug,
            "no_source_directive_found": True,
            "directive_path": None,
            "concepts": [],
            "matches": {},
            "concept_coverage": 0.0,
            "suspiciously_clean": False,
        }

    concepts = _extract_concepts(directive["text"])
    if not concepts:
        return {
            "slug": slug,
            "no_source_directive_found": False,
            "directive_path": directive["path"],
            "concepts": [],
            "matches": {},
            "concept_coverage": 0.0,
            "suspiciously_clean": True,
        }

    # Gather all text from source files.
    # .md files are excluded from the match-counting corpus —
    # documentation is never the implementation. Matching against it
    # answers "did someone write about this concept," not "did someone
    # build it." find_source_directive's separate .md search is unaffected.
    all_text_parts: list[str] = []
    for path in source_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in {".py", ".ts", ".tsx", ".js", ".jsx"}:
            continue
        if "node_modules" in path.parts:
            continue
        try:
            all_text_parts.append(path.read_text(encoding="utf-8", errors="replace"))
        except (OSError, UnicodeDecodeError):
            continue

    corpus = "\n".join(all_text_parts).lower()
    matches: dict[str, int] = {}
    for concept in concepts:
        count = corpus.count(concept)
        if count:
            matches[concept] = count

    coverage = len(matches) / len(concepts) if concepts else 0.0
    suspicious = coverage == 0.0 or coverage == 1.0

    unmatched = [c for c in concepts if c not in matches]

    return {
        "slug": slug,
        "no_source_directive_found": False,
        "directive_path": directive["path"],
        "concepts": concepts,
        "matches": matches,
        "unmatched_concepts": unmatched,
        "concept_coverage": round(coverage, 2),
        "suspiciously_clean": suspicious,
    }
