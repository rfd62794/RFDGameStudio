# ADR-012: Port-Then-Conversion Pipeline — Six Stages, One Deliberately Manual

**Status:** Accepted
**Date:** July 2026
**Related:** ADR-001 (three-file contract, what a finished game must be),
ADR-010 (TS-native origin permitted), the existing (untitled) Intake
Pipeline directive (Stage 1), `studio_promote_to_examples` (Stage 2,
already real).

## Context

Two of six real pipeline stages already exist and work: raw zip intake
(hashed, versioned, deduped into `intake/{slug}/`) and faithful
port-and-preview (`studio_promote_to_examples`, extracting into
`examples/{slug}/`, building and deploying to a local preview,
unmodified from the original export). Everything after that —
scaffolding a real target structure, verifying a port actually
finished, and disposing of the staging copy once it has — has been
done by hand, once per game, with no repeatable tool. This ADR names
all six stages and, critically, draws a real boundary: which of them
are mechanical enough to automate, and which one is not.

## Decision

**The pipeline, in order:**

1. **Intake** — automated, exists. Hash/version/dedupe raw exports.
2. **Port** — automated, exists. Extract, build, preview as-is.
3. **Scaffold** — automated, new. Generate the real target skeleton
   (`games/{id}/` and/or `ts/src/games/{id}/`, vite config wrapper,
   standalone entry point) from a ported concept. Surfaces the ADR-010
   TS-native-vs-Lua question as a flagged recommendation, never an
   automatic silent choice.
4. **Convert** — **deliberately not automated.** Real game logic,
   represented correctly in the target structure. This is design
   judgment, not pattern-matching — the same work every directive in
   this project already does. Stays a real, directive-driven pass,
   written and verified with the same rigor as everything else. Robert's
   own words: "we can work on small pieces to smooth out step 4 later"
   — smoothing means better directive scaffolding and tooling support
   for the person doing the conversion, not removing the person.
5. **Verify** — automated, new. Real build, real tests (if Lua-backed),
   real registry-membership check. Reports pass/fail. Does not
   auto-register, does not auto-dispose.
6. **Dispose** — automated, new, gated. Only runs after Stage 5 passes
   *and* is explicitly confirmed per concept — never inferred from
   registry absence alone. A concept missing from `games/registry.ts`
   can mean "incomplete" or "deliberately delisted" (confirmed real
   case: SlimeBreeder), and those require opposite actions.

**The boundary, stated plainly:** stages 1, 2, 3, 5, 6 are pattern-based
and mechanical — they operate on file structure and build/test
success, not on understanding what a game does. Stage 4 is the only
one where correctness depends on actually understanding the prototype.
Automating it away would automate away the part where the project's
actual quality lives.

## Consequences

- Stage 3's scaffolding tool becomes the permanent fix for the
  `entry.tsx` hardcoded-import bug class (found this session,
  currently a real risk to the pending Logic-Layer Modularization
  directive) — every new game gets a glob-based standalone entry from
  day one, not a hand-maintained list that silently rots.
- Stage 6 must never run unattended across multiple concepts in one
  pass. Each disposal is its own explicit confirmation.
- This ADR does not change what a finished game must be (ADR-001) or
  when TS-native origin is permitted (ADR-010) — it governs the
  *process* of getting from a zip to a registered game, not the target
  shape itself.
- Stage 4 tooling improvements are real, future, incremental work —
  named here as explicitly in scope for later, explicitly not scoped
  now.

*Robert Floyd Dugger's direct decision, July 2026 — six stages, five
automated, one kept human on purpose.*
