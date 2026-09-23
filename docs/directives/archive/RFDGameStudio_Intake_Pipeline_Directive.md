# RFDGameStudio — Directive: AI Studio Intake Pipeline (Hash + Timeline + Versioned Rename)

*Repo: C:\Github\RFDGameStudio. Bounded, mechanical — no design judgment
calls beyond the version-bump policy specified below.*

---

> ⛔ **STOP:** This creates new infrastructure (`intake/`), it does not
> touch `examples/`, `games/`, or `ts/src/games/`. Nothing here changes
> which demos are registered or how the Arcade renders — this is purely
> about organizing raw AI Studio exports before any port decision is made.

---

## §0 Context

AI Studio exports arrive as zips with generic, often-duplicate names
(`brewfield.zip`, `brewfield (1).zip`, Windows' own auto-dedup pattern) —
dropped in whenever, no reliable naming convention, sometimes re-exports of
genuinely unchanged content. The pipeline needs to: detect what's actually
new, tell real content changes apart from accidental re-downloads, and
maintain a real version timeline per concept — all without relying on
filenames, which are untrustworthy by design here.

## §1 Scope Statement

| Item | Action |
|---|---|
| `intake/{concept-slug}/` (new, per concept as they appear) | Storage for versioned zips + `MANIFEST.md` |
| `studio_mcp/intake.py` (new) | Hash, timestamp, version-bump, and rename logic |
| `studio_mcp/tools.py` | Add `studio_process_intake(concept_slug, bump=None)` as a callable MCP tool |
| `.gitignore` | Add `intake/**/*.zip` — the zips themselves don't need git; `MANIFEST.md` does |
| Everything else (`examples/`, `games/`, `ts/`) | Do not touch |

## §2 Version Scheme

`MAJOR.MINOR.PATCHRrevision` — e.g. `1.2.3R4`.

- **Default (no explicit bump argument): increment `R` only.** This is the
  common path — a new export of the same conceptual version, nothing
  semantically declared. Matches "mostly relying on Releases."
- **`bump="minor"`:** MINOR += 1, PATCH → 0, R → 1.
- **`bump="patch"`:** PATCH += 1, R → 1.
- **`bump="major"`:** MAJOR += 1, MINOR → 0, PATCH → 0, R → 1.
- **First zip ever seen for a concept:** starts at `0.1.0R1`.

> ⚠️ RULE: The bump argument is always explicit, passed by Robert when
> running the tool for a specific file — never inferred from content diff
> size, file count, or anything else automatic. A one-line change and a
> total rewrite both default to an R-bump unless told otherwise; that's
> intentional, not a limitation to fix later.

## §3 Change Detection — Hash the Contents, Not the Zip Bytes

```python
import hashlib
import zipfile
from pathlib import Path

def content_hash(zip_path: Path) -> str:
    """Hash based on (relative path, file bytes) pairs, sorted — ignores
    zip-internal timestamps and metadata, which can differ between two
    exports of genuinely identical code."""
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
```

Compare against the hash of the concept's most recent known version
(stored in `MANIFEST.md`, see §5). If identical: this is a duplicate
export of unchanged content — do not create a new version, flag it as a
duplicate and leave the original dropped file alone (or optionally delete
it, see §4's `--on-duplicate` behavior). If different: proceed to §4.

## §4 Timestamp Handling

Use the dropped file's own filesystem timestamps, not "when this script
ran" and not git — these zips aren't tracked in git, and "when Robert
exported it from AI Studio" is what the timeline actually needs to mean.

```python
import os
from datetime import datetime

def get_file_times(path: Path) -> tuple[str, str]:
    stat = path.stat()
    created = datetime.fromtimestamp(stat.st_ctime).isoformat()
    modified = datetime.fromtimestamp(stat.st_mtime).isoformat()
    return created, modified
```

> ⚠️ RULE: On Windows, `st_ctime` is creation time (not "last metadata
> change" as on Unix) — confirm this is running on Windows and behaves as
> expected before trusting it; don't assume cross-platform semantics.

## §5 `MANIFEST.md` Format

One per concept, plain and hand-readable, not just machine output:

```markdown
# Brewfield — Intake History

Current version: 1.1.0R2
Status: ported (see games/brewfield/)

## Version History

### 1.1.0R2 — 2026-07-11T19:15:00
- Hash: a3f5e9...
- Source file: brewfield_v1.1.0R2.zip
- Note: (optional, only if Robert provides one when running the tool)

### 1.1.0R1 — 2026-07-09T14:22:00
- Hash: 7c2b81...
- Source file: brewfield_v1.1.0R1.zip
```

Status field is one of: `prototyping`, `ready-to-port`, `porting`, `ported`
— hand-set, not inferred. Update it manually when a concept's real status
changes; the intake tool never guesses this.

## §6 Rename + File Handling

1. Locate any zip in `intake/{concept-slug}/` not already matching the
   canonical `{slug}_v{version}.zip` pattern — these are freshly-dropped,
   generic-named files.
2. Compute content hash (§3).
3. If it matches the current top-of-manifest hash: flag as duplicate,
   leave file in place with a `.duplicate` suffix appended rather than
   silently deleting anything — Robert reviews and deletes manually.
4. If it's new content: determine the bump (default R, or whatever was
   explicitly passed), compute the new version string, rename the file to
   `{slug}_v{version}.zip`, record the entry in `MANIFEST.md` using the
   real filesystem timestamps from §4.
5. Never overwrite an existing versioned zip — if a naming collision
   somehow occurs, fail loudly rather than silently replace a file.

## §7 Tool Interface

```python
def studio_process_intake(concept_slug: str, bump: str | None = None, note: str | None = None) -> dict:
    """
    Process any newly-dropped, generically-named zips in
    intake/{concept_slug}/. Default bump is R (revision) — pass
    bump='minor'/'patch'/'major' only when explicitly declaring a
    semantic change.
    """
```

Callable via the same MCP surface as `studio_deploy_arcade` and friends —
not a separate standalone script Robert has to remember a different
invocation pattern for.

## §8 Verification

1. Drop two copies of the same test zip (byte-identical or trivially
   re-exported) into a test concept folder — confirm the second is
   flagged as a duplicate, not versioned.
2. Drop a genuinely modified zip — confirm it gets a real new version with
   an R-bump by default.
3. Run with `bump="minor"` explicitly — confirm PATCH and R both reset
   correctly, not just R.
4. Confirm `MANIFEST.md` timestamps match the actual dropped file's real
   filesystem creation time, not the time the script happened to run.
5. Confirm nothing in `examples/`, `games/`, or `ts/src/games/` was
   touched by any of this.

## §9 Completion Criteria

- [ ] Hash comparison based on extracted contents, not raw zip bytes
- [ ] Duplicate exports detected and flagged, not silently versioned or deleted
- [ ] Default bump is R-only; minor/patch/major require explicit argument
- [ ] Cascading reset rule correct (patch resets R; minor resets patch+R; major resets all)
- [ ] Timestamps sourced from the dropped file's real filesystem metadata
- [ ] `MANIFEST.md` is human-readable, not just a machine-parseable log
- [ ] Callable via the existing MCP tool surface
- [ ] Zero changes outside `intake/` and the new `studio_mcp/intake.py`
