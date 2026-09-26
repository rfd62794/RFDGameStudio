"""Scratch demo for Stage 2 Correction 2 — before/after concept_check on real zips.

'before' = pre-fix corpus (suffix allowlist includes .md, commit 4d7725a8^).
'after'  = current committed concept_check (.md excluded).
"""

import tempfile
from pathlib import Path
from zipfile import ZipFile

from studio_mcp.zip_verify.concept_grep import (
    _extract_concepts,
    concept_check,
    find_source_directive,
)

PRE_FIX_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".jsx", ".md"}


def corpus_pre_fix(source_dir: Path) -> str:
    parts = []
    for path in source_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in PRE_FIX_SUFFIXES:
            continue
        if "node_modules" in path.parts:
            continue
        try:
            parts.append(path.read_text(encoding="utf-8", errors="replace"))
        except (OSError, UnicodeDecodeError):
            continue
    return "\n".join(parts).lower()


def md_files(source_dir: Path) -> list[str]:
    return sorted(
        str(p.relative_to(source_dir))
        for p in source_dir.rglob("*.md")
        if "node_modules" not in p.parts
    )


def main() -> None:
    cases = [
        ("AI Studio", Path(r"C:\Users\cheat\Downloads\break-streamer.zip"), "break-streamer"),
        ("Manus", Path(r"C:\Users\cheat\Downloads\break-streamer-mvp.zip"), "break-streamer-mvp"),
    ]
    for label, zip_path, slug in cases:
        with tempfile.TemporaryDirectory() as td:
            ZipFile(zip_path).extractall(td)
            root = Path(td)

            directive = find_source_directive(slug)
            concepts = _extract_concepts(directive["text"])

            before_corpus = corpus_pre_fix(root)
            before_matches = {c: before_corpus.count(c) for c in concepts}
            before_matches = {c: n for c, n in before_matches.items() if n}
            before_cov = round(len(before_matches) / len(concepts), 2)
            before_unmatched = [c for c in concepts if c not in before_matches]

            after = concept_check(root, slug)

            print(f"=== {label} ({zip_path.name}) slug={slug} ===")
            print(f"directive resolved: {directive['path']}")
            print(f"concepts ({len(concepts)}): {concepts}")
            print(f".md files present: {md_files(root)}")
            print(f"BEFORE coverage: {before_cov}  matched={len(before_matches)}/{len(concepts)}")
            print(f"BEFORE unmatched: {before_unmatched}")
            print(f"AFTER  coverage: {after['concept_coverage']}  matched={len(after['matches'])}/{len(concepts)}")
            print(f"AFTER  unmatched: {after['unmatched_concepts']}")
            moved = [c for c in before_matches if c not in after["matches"]]
            print(f"moved matched->unmatched: {moved}")
            for c in ("composite", "relative"):
                print(f"  {c}: before={before_matches.get(c, 0)} after={after['matches'].get(c, 0)}")
            print()


if __name__ == "__main__":
    main()
