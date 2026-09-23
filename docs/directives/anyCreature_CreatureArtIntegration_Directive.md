# RFDGameStudio — anyCreature Integration: The `creatureArt` Seam

*September 2026 | Read `docs/directives/anyCreature_ForkValidate_Directive.md`
in full before this one — the fork is real, validated, and the wolf
smoke test already produced a real `hero.png`. This directive wires it
in as a genuine third art option, matching the existing `artGen`
generic-seam pattern (ADR-005/ADR-014) rather than inventing a new
architecture.*

---

> ⛔ **STOP:** Run the real current test suite before touching anything
> (Python `uv run pytest -m "not slow"`, TS `cd ts && npx vitest run`
> from repo root — do not trust any number from a prior session, confirm
> live). Also confirm the real wolf assets still exist and match their
> recorded sizes: `C:\Github\anyCreature\out\hero.png` (347,341 bytes),
> `out\hero.jpg` (40,920 bytes). If either is missing or a different
> size, the fork's local state has changed since the last phase —
> report that before proceeding, don't regenerate silently.

---

## §0 Context

**The real, structural difference this directive has to respect, not
paper over:** `ts/src/engine/artGen/` generates SVG shapes *live, in the
browser, at runtime* — `ArtGenConfig<TEntity>` maps a game's entities to
colors/shapes, and the module draws them on demand. anyCreature cannot
do that. Its compile step is Node, its render step is headless Chromium
via Playwright — neither can run inside a game's own browser session.
This means `creatureArt` (this phase's new module) is parallel to
`artGen` in what a game gets to use — a per-entity visual — but
different in mechanism: it references pre-generated static PNGs, it
never generates anything at runtime. Do not build anything that tries to
run the anyCreature pipeline inside a game's own execution context —
that's not just out of scope, it's not technically possible with the
tool as built.

**What this phase delivers, in two real, separate pieces:**

1. **An offline export script, living in the `anyCreature` fork itself**
   (`C:\Github\anyCreature`), not in RFDGameStudio — keeps the heavy
   Node+Python+Playwright dependency chain isolated from RFDGameStudio's
   own, the same way `RFD_IT_Publishing` stays a separate sibling repo
   rather than folding its own dependencies into the studio. Given a
   spec path and a target output path, it runs compile + hero-render and
   writes the final PNG directly to that target path — which may point
   into `RFDGameStudio`'s own tree, since these are sibling repos on the
   same machine.

2. **A generic seam on the RFDGameStudio side**,
   `ts/src/engine/creatureArt/`, mirroring `artGen`'s real shape (a
   `types.ts` defining `CreatureArtConfig<TEntity>`, a loader function) —
   but much thinner than `artGen`, since there's no live drawing logic
   here, only asset-path resolution. Per ADR-005/ADR-014 convention:
   this module carries no vocabulary tied to any specific game; a
   per-game config maps that game's entities to pre-generated asset
   paths, same pattern `dissonance`/`shoal`/`slimeworld` already follow
   for `artGen`.

**The wolf becomes the first real, wired-up fixture** — not a new design
decision, the same zero-risk asset already generated and verified in the
prior phase. This proves the seam loads and resolves a real asset
correctly end-to-end. It does not mean any real game is adopting wolf
art; it's a test fixture, exactly like `example/` fixtures elsewhere in
this studio.

**Explicitly NOT in scope:**
- Choosing which real RFDGameStudio game adopts `creatureArt` for real
  content. That's a content decision for Robert, not resolved by this
  directive building the plumbing.
- Designing any new creature. The wolf fixture is the only asset this
  phase touches.
- Any attempt to run compile/render inside a browser or at game runtime
  — see §0, this is not a mechanism gap to work around, it's how the
  tool is built.
- Model/cost testing for real creature-design sessions ("free model
  testing," per Robert's own framing) — deliberately deferred, a
  separate, later phase once the plumbing exists to test against.

---

## §1 Scope Statement

| Location | Repo | Status | Action |
|---|---|---|---|
| `scripts/rfdgamestudio_export.js` | `C:\Github\anyCreature` | New | Wraps `engine/cli.js` + `harness/hero.mjs`, takes spec path + target output path, writes final PNG there |
| `ts/src/engine/creatureArt/types.ts` | `RFDGameStudio` | New | `CreatureArtConfig<TEntity>` interface, mirroring `artGen/types.ts`'s shape |
| `ts/src/engine/creatureArt/loader.ts` | `RFDGameStudio` | New | Resolves an entity to its pre-generated asset path via the config; no drawing logic |
| `ts/src/engine/creatureArt/index.ts` | `RFDGameStudio` | New | Re-exports, matching `artGen/index.ts`'s pattern |
| `ts/src/engine/creatureArt/fixtures/wolf.png` | `RFDGameStudio` | New | Copy of the already-generated, already-verified `hero.png` — the real fixture, not a placeholder |
| `ts/src/engine/creatureArt/tests/*.ts` | `RFDGameStudio` | New | Per §3 |

**Read-only:** `ts/src/engine/artGen/` (reference the pattern, do not
modify it), everything else in `anyCreature` beyond the one new script.

> ⚠️ RULE: `scripts/rfdgamestudio_export.js` writes into a sibling repo's
> tree by design — confirm the target path argument is always required
> and explicit, never defaulted or inferred. A script that silently
> guesses where to write into another repo is exactly the kind of
> implicit decision this whole studio's directives have refused to allow
> all night.

---

## §2 Implementation

### `scripts/rfdgamestudio_export.js` (in `anyCreature`)

```
node scripts/rfdgamestudio_export.js <spec.json> <target-png-path>
```

Runs `engine/cli.js <spec.json> <tmp>.glb`, then `harness/hero.mjs
<tmp>.glb <tmp-dir>`, then copies the resulting `hero.png` to the
explicit `<target-png-path>` argument. No default target. No inference
of which RFDGameStudio game it belongs to.

### `ts/src/engine/creatureArt/types.ts`

```typescript
/**
 * Generic seam for pre-generated 3D-compiled creature art.
 *
 * Unlike artGen, this module draws nothing live. anyCreature's compile
 * and render steps run offline, in the anyCreature sibling repo, and
 * produce static PNGs. This module only resolves an entity to its
 * pre-generated asset path — the same way any other sprite reference
 * works. Per ADR-005/ADR-014, this module carries no vocabulary tied to
 * any specific game.
 */
export interface CreatureArtConfig<TEntity> {
  assetPathFor: (entity: TEntity) => string;
  fallbackPathFor?: (entity: TEntity) => string;
}
```

### `ts/src/engine/creatureArt/loader.ts`

```typescript
export function resolveCreatureArt<TEntity>(
  entity: TEntity,
  config: CreatureArtConfig<TEntity>
): string {
  const path = config.assetPathFor(entity);
  // Real existence check left to the caller's own asset-loading
  // convention (matches how other sprite references work in this
  // studio) -- this function resolves the path, it does not assume
  // how a given renderer confirms the file exists.
  return path;
}
```

> ⚠️ RULE: Do not add a fallback-resolution default inside
> `resolveCreatureArt` itself unless a real caller actually needs it —
> `fallbackPathFor` exists in the type for future use, wiring fallback
> logic in now with no real caller is exactly the premature-scope
> pattern this studio has stayed away from all night.

---

## §3 Test Anchors

| Test name | Fixture | Behaviour |
|---|---|---|
| `test_resolve_creature_art_returns_real_path` | Synthetic `CreatureArtConfig` pointing at the real `wolf.png` fixture | Returns the exact configured path |
| `test_creature_art_config_carries_no_game_vocabulary` | Static check on `types.ts` | Confirms no game-specific identifiers appear in the module itself (matches `artGen`'s own discipline) |
| `test_wolf_fixture_is_real_generated_asset` | `fixtures/wolf.png` | File exists, byte size matches the recorded 347,341 bytes from the fork-validate phase — confirms it's the real generated image, not a placeholder someone drew |

Target: X passing, 0 failing, 0 skipped, real count.

**Live demonstration required at completion:** run
`scripts/rfdgamestudio_export.js` for real against the wolf spec, target
output pointing into `ts/src/engine/creatureArt/fixtures/wolf.png`,
paste the real command output — confirming the cross-repo write
actually works end-to-end, not just that the two pieces exist
separately.

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed for both Python and TypeScript
      suites before any change
- [ ] Real wolf asset byte sizes confirmed unchanged from the
      fork-validate phase before proceeding
- [ ] `scripts/rfdgamestudio_export.js` implemented in the `anyCreature`
      fork, requires an explicit target path, no default/inference
- [ ] `creatureArt` module implemented in RFDGameStudio, mirrors
      `artGen`'s shape, carries no game-specific vocabulary
- [ ] All §3 test anchors present and passing
- [ ] Live demonstration run for real: the export script actually
      writes into RFDGameStudio's tree, real output pasted
- [ ] `artGen/` confirmed untouched — diff shows zero changes there
- [ ] No real game wired to use `creatureArt` for actual content — this
      phase builds the seam and proves it with the wolf fixture only
- [ ] Final full test floor (both repos) reported, real count

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Mechanism difference from `artGen` | Static, pre-generated assets — never live runtime generation |
| Where the heavy dependency chain lives | `anyCreature` fork only, never RFDGameStudio itself |
| First real fixture | The wolf `hero.png`, already generated and verified — not a new design |
| Not this phase's decision | Which real game adopts this for content |
| Not this phase's job | Model/cost testing for real creature-design sessions |

---

*RFD Method | anyCreature Integration | RFDGameStudio | September 2026*
*A third option that's real without pretending it works the same way the other two do.*
