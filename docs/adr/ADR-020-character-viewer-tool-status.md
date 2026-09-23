# ADR-020: Character Viewer as Non-Competitive Tool Status

**Status:** Accepted
**Date:** August 2026
**Related:** ADR-019 (Paper Doll shared composition layer).

## Context

The Character Viewer is a dev-only tool for iterating on the Paper
Doll module's shapes at real size, side by side, with live controls.
It was built as a standalone surface at
`ts/src/standalone/character_viewer/` — reachable only via a direct
dev-server URL, not through the arcade UI.

A directive asked to promote it to a real, reachable arcade entry.
The existing `GameStatus` values (`'stable'`, `'beta'`, `'dev'`,
`'external'`) did not honestly describe a non-competitive sandbox tool:

- `stable`/`beta`/`dev` imply competitive games in progress
- `external` is for itch.io embeds (VoidRift's precedent)

Forcing the Character Viewer into a "game" shape it doesn't fit would
mislead users clicking through the arcade.

## Decision

Add a new `'tool'` status to `GameStatus` for non-competitive
sandbox/design tools. The Character Viewer is registered with
`status: 'tool'`, presented honestly as a sandbox tool, not a game.

### Presentation

- **Label:** "Character Viewer"
- **Description:** "Assemble and preview creature designs — live
  shape controls, side-by-side comparison, and exportable configs.
  A sandbox tool, not a competitive game."
- **Status badge:** `TOOL` (yellow, visually distinct from all game
  statuses)
- **Detail string:** "Sandbox tool - TS-native"
- **No `externalUrl` or `embedUrl`** — it's a real TS-native component

### Both paths preserved

The original dev-only path
(`ts/src/standalone/character_viewer/index.html`) remains intact and
byte-unchanged. The arcade path goes through a thin wrapper
(`ts/src/games/character_viewer/App.tsx`) that imports the real
`CharacterViewer` from the standalone surface. Both paths reach the
same real tool.

### Production code unmodified

The Paper Doll module's production source files (`composer.ts`,
`attachmentGraph.ts`, both body plans, `PaperDoll.tsx`) are all
byte-unchanged — confirmed via git diff. The viewer is a consumer, not
a modifier.

## Consequences

- **The `'tool'` status is now available** for future non-competitive
  studio tools (level editors, balance tuners, asset previewers).
- **The arcade grid is honest** — users see a `TOOL` badge and a
  non-competitive description, not a misleading game label.
- **The dev-only path is not broken** — both paths work, both reach
  the same tool.
- **The Paper Doll module has a real iteration surface** — shape
  changes can be previewed at production scale without modifying
  production code.
