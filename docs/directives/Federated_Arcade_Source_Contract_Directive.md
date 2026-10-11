# Federated Arcade source contract

## Why this exists

The approved Office-Blog-Arcade federation needs exact related-game and story destinations on the Arcade. RFDGameStudio is the authoritative source; site-generated data must not be hand-edited and relationships must not be guessed from titles.

## Read first

- `docs/DIRECTION.md`, roadmap M10 and `docs/notes/2026-10-11-federated-identity-handoff.md`.
- `ts/tools/export-arcade-manifest.ts` and its tests.
- Current registry/catalog types and manifest-count tests.
- `ts/tests/test_arcade_manifest.ts`, `ts/tests/test_arcade_manifest_counts.ts`, `ts/tests/test_registry_export.ts` and `ts/tests/test_arcade_devlog.ts` (the existing exporter/manifest tests you extend).

## Site spec is NOT a dependency

This run must not wait for the site's federation specification. The schema is already specified in `docs/notes/2026-10-11-federated-identity-handoff.md`: optional related game ids (validated against the authoritative catalog), an exact Studio story URL, and an exact Blog/devlog URL; absence means no relationship, never a title/slug/tag guess. Build to that note. The site spec, if it lands later, only informs the consumer doc and is not an input to this run; stop for nothing on its absence.

## Scope

0. FIRST, before changing anything: record the real vitest baseline (pass and fail counts, and the names of failing files) in the PR description. Run `cd ts && npx vitest run` once. The Studio suite is known to have pre-existing failures; they must be listed as baseline, not fixed and not blamed on this work. If `ts/node_modules` is absent in the worktree, do not install: write "baseline unverified: no node_modules" in the PR description and in the Status row, and continue with the design and file work.
1. Design the smallest optional source schema for related game ids and exact Studio/Blog story URLs.
2. Write failing validation/export tests.
3. Extend authoritative source types and manifest export.
4. Add deterministic fixture examples for site M12/M13.
5. Document the contract for the site sync consumer in the new file `docs/notes/federated-arcade-site-consumer-contract.md` (field names, validation rules, one example manifest entry, and the statement that absence means no relationship). This is the only new doc; do not put it in the site repo.

## The work

Validate related game ids against the authoritative catalog. Preserve existing ids, play URLs, badges, counts and publication behavior byte-for-byte except for the optional new fields. Missing data emits no relationship rather than a fallback.

## Forbidden Actions

- Do not edit `RFD_IT_Services_Site`, `RFD_Blog_Engine` or deployed output.
- Do not deploy, publish, copy builds or advance pipeline stages.
- Do not infer relationships from titles/tags or add relationships without verified destinations.
- Do not alter gameplay, registry membership, collectible work or existing URLs.

## Required from User

No user action for design/tests. Robert must approve any later publication or site deployment.

## Verification

First record the baseline (Scope step 0). Then run the focused tests, each from the repo root:

```text
cd ts && npx vitest run test_arcade_manifest
cd ts && npx vitest run test_arcade_manifest_counts
cd ts && npx vitest run test_registry_export
cd ts && npx vitest run test_arcade_devlog
```

(The files are `ts/tests/test_arcade_manifest.ts`, `test_arcade_manifest_counts.ts`, `test_registry_export.ts`, `test_arcade_devlog.ts`; `test_arcade_manifest` is a name filter that also matches `test_arcade_manifest_counts`, which is fine.) Then the full suite:

```text
cd ts && npx vitest run
```

Also run any existing manifest contract command already documented in this repo. Record exact output; do not install dependencies. Compare the full-suite result to the recorded baseline: the failing set must be identical or smaller.

## Sandbox needs

- Exec(cd ts && npx vitest run)
- Exec(cd ts && npx vitest run test_arcade_manifest)
- Exec(cd ts && npx vitest run test_arcade_manifest_counts)
- Exec(cd ts && npx vitest run test_registry_export)
- Exec(cd ts && npx vitest run test_arcade_devlog)

## Rules for this run

Non-interactive; use the existing checkout dependencies; branch commit only; no push/merge/deploy; no reads outside the worktree. Do NOT stop for the site contract; build to the handoff note.

## Completion criteria

- Optional relationship schema is documented and source-owned.
- Invalid related ids fail deterministically.
- Exported fixtures contain exact URLs/ids and preserve existing contract fields.
- Full TS tests pass at the real baseline or all pre-existing failures are separated with evidence.
- Baseline recorded in the PR description before any change.
- `docs/notes/federated-arcade-site-consumer-contract.md` exists.

## Report

List schema, validation rules, fixtures, preserved fields, exact test output and the site consumer handoff.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-federated-arcade-source-contract--6b84f0 |
| Base branch | main |
| Base commit | 634b29f013c0f87e79d76171703fd77064248b54 |
| Model | swe-2-high |

**Status log**
- 2026-10-11 · devin-laptop-repoman · none → Draft — source-side handoff for RFD_IT_Services_Site M12/M13; blocked until the site federation contract is committed
- 2026-10-11 19:14 · robert-claude-laptop · Draft → Queued — Reviewed by Sonnet (approve-after-edit); edits merged via RFDGameStudio PR #280; site spec is not a dependency
- 2026-10-11 19:17 · robert-claude-laptop · Queued → Approved
- 2026-10-11 19:17 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-federated-arcade-source-contract--6b84f0; lane=explicit; model=swe-2-high; persona=steady-builder; agent_id=01M4PM325JB01GTE7R75D51SYK
<!-- queue:end -->
