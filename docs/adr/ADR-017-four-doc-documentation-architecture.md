# ADR-017: Four-Document Documentation Architecture

**Status:** Accepted
**Date:** August 15 2026
**Related:** ADR-006 (four-file game contract), ADR-015 (status board
as arcade page), ADR-016 (verification of dated staleness claims).

## Context

The studio's per-project state lived in monolithic `docs/state/current.md`
files. The main studio file grew to ~9,200 lines across ~123 top-level
sections. Per-project files (Shoal 588 lines, AntSim Redux 241 lines)
followed the same pattern. These files mixed four distinct concerns:

1. **What changed** (changelog entries — completed work, dated, factual)
2. **What's next** (roadmap items — planned work, some completed, some open)
3. **Why decisions were made** (architectural rationale — embedded in
   changelog prose, not separable)
4. **Where things stand now** (current status — buried under months of
   changelog history)

This made it impossible to answer any one of these questions without
reading all four kinds of content. The Status Board (ADR-015) addressed
the "where things stand" question at the studio level, but the
underlying source files remained monolithic.

## Decision

Replace the monolithic `current.md` pattern with four distinct document
types, both studio-wide and per-project:

| Document | Purpose | Mutability |
|---|---|---|
| **CHANGELOG.md** | What changed — dated, factual, full detail | Append-only |
| **ROADMAP.md** | What's next — planned and completed items | Updated as items complete |
| **ADR-NNN-*.md** | Why decisions were made — permanent record | Immutable once accepted |
| **status.md** (studio) / **README.md** (project) | Where things stand now — short, current | Refreshed at checkpoints |

### Studio-wide vs per-project

- **Studio-wide** (`/CHANGELOG.md`, `/ROADMAP.md`, `/docs/adr/`,
  `/docs/status.md`): concise summary pointing to per-project detail.
- **Per-project** (`<project>/CHANGELOG.md`, `<project>/ROADMAP.md`):
  full detail. Projects without active roadmaps omit the ROADMAP.

### CHANGELOG detail level

The studio-wide CHANGELOG is a concise summary — one line per completed
directive, linking to the per-project changelog for full detail.
Per-project CHANGELOGs preserve the full detail that was previously in
`current.md`, including test results, file lists, and investigation
findings.

### ADR scope

ADRs capture decisions that are "locked" — committed to with real
consequences if reversed. Informally-locked decisions (decisions made
and acted on without a formal ADR) are backfilled with ADRs dated to
the decision date where known, or to the current date where the
original date is uncertain.

### Retirement of current.md

All `current.md` files are retired (replaced with a pointer to the new
documents). Source content is preserved in git history and in the new
CHANGELOG files. The `current.md` files are not deleted — they are
replaced with a short redirect note, preserving the path for any
external references.

## Consequences

- **Four files to check instead of one** — but each answers exactly one
  question, so you check only the one you need.
- **Append-only changelog discipline** — CHANGELOG entries are never
  rewritten or deleted. Errors are corrected in a new entry, not by
  editing the old one.
- **ADRs are permanent** — per existing ADR policy, never delete one.
- **Status is ephemeral** — `status.md` / `README.md` are refreshed at
  checkpoints and may be rewritten freely. They are not history.
- **Per-project autonomy** — each project owns its own CHANGELOG and
  ROADMAP. The studio-wide documents are summaries, not authorities.
