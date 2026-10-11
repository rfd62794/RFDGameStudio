# Federated Arcade source contract

## Why this exists

The approved Office-Blog-Arcade federation needs exact related-game and story destinations on the Arcade. RFDGameStudio is the authoritative source; site-generated data must not be hand-edited and relationships must not be guessed from titles.

## Read first

- `docs/DIRECTION.md`, roadmap M10 and `docs/notes/2026-10-11-federated-identity-handoff.md`.
- `ts/tools/export-arcade-manifest.ts` and its tests.
- Current registry/catalog types and manifest-count tests.
- The committed site federation specification, pasted into this directive before queueing.

## Scope

1. Design the smallest optional source schema for related game ids and exact Studio/Blog story URLs.
2. Write failing validation/export tests.
3. Extend authoritative source types and manifest export.
4. Add deterministic fixture examples for site M12/M13.
5. Document the contract for the site sync consumer.

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

Run the exact focused exporter tests identified during orientation, then:

```text
cd ts && npx vitest run
```

Also run any existing manifest contract command already documented in this repo. Record exact output; do not install dependencies.

## Rules for this run

Non-interactive; use the existing checkout dependencies; branch commit only; no push/merge/deploy; no reads outside the worktree. Stop if the site contract is absent.

## Completion criteria

- Optional relationship schema is documented and source-owned.
- Invalid related ids fail deterministically.
- Exported fixtures contain exact URLs/ids and preserve existing contract fields.
- Full TS tests pass at the real baseline or all pre-existing failures are separated with evidence.

## Report

List schema, validation rules, fixtures, preserved fields, exact test output and the site consumer handoff.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Branch | - |
| Base branch | main |

**Status log**
- 2026-10-11 · devin-laptop-repoman · none → Draft — source-side handoff for RFD_IT_Services_Site M12/M13; blocked until the site federation contract is committed
<!-- queue:end -->
