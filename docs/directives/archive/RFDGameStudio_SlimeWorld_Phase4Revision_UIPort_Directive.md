# RFDGameStudio — SlimeWorld Phase 4-Revision: UI Port (not rebuild)

*July 16 2026 (night) | Vehicle: Windsurf/Devin | Supersedes the Phase 3/4 ui.yaml-authoring approach — ports existing working React onto the Lua bridge, following `horse_racing`'s proven pattern exactly*

---

> ⛔ **STOP:** This is a PORT, not new UI construction. The six real
> component files in `examples/slimeworld/src/components/` are the
> source of truth for structure, layout, and interaction — do not
> redesign them. The only thing changing is what powers them
> underneath: direct `gameLogic.ts` calls become `call(session, 'fn',
> ...args)` calls through the Lua bridge, exactly mirroring
> `ts/src/games/horse_racing/App.tsx`, which is the literal template
> for this phase — read it in full before starting, it's short and
> it's the complete pattern.

**Read-only — do not touch:** `logic.lua`, `data.yaml`, `systems.yaml`
(all verified through Phase 3a), `ui.yaml` (kept as intent-spec
documentation, not executed), `examples/slimeworld/` (source to port
FROM, never written to), `ts/src/games/horse_racing/` (reference
only), `ts/src/engine/*` (shell interpreter — not touched this phase).

---

## §0 The Real Template, Confirmed by Direct Read

`horse_racing/App.tsx` structure, in order:
1. `interpretLayout()` renders the shell (header/tabbar/footer) from
   `ui.yaml`'s `layout_tree`/`regions` — this part is free, already works.
2. A `content` slot is left for the game to fill.
3. Hand-written tab components (`StableTab`, `BettingTab`, `BreederTab`)
   render inside that slot.
4. Each handler function (`handleSellHorse`, `handlePurchaseStarter`,
   `handleUnlockSlot`, etc.) calls `call(session, 'lua_function_name',
   ...args)` — real multi-argument calls, no single-parameter limitation.
5. A `luaXToTs()` conversion layer (e.g. `luaHorseToTs`) translates
   raw Lua table returns into typed TS objects for React state.

---

## §1 Scope Statement

| Path | Status | Action |
|---|---|---|
| `ts/src/games/slimeworld/` | Create | New directory, mirrors `ts/src/games/horse_racing/` structure |
| `ts/src/games/slimeworld/App.tsx` | Create | Shell + slot pattern, per §0 |
| `ts/src/games/slimeworld/components/` | Create | Ported versions of the 6 real files |
| `ts/src/games/slimeworld/types.ts` | Create | `luaSlimeToTs`, `luaNodeToTs` conversion layer |
| `examples/slimeworld/src/components/*.tsx` | Read-only | Source of truth, port FROM |

---

## §2 Function Mapping — Every Real Call Site, Verified Against Actual `logic.lua`

Confirmed 1:1 mappings (all functions verified present tonight):

| TS source calls | Lua equivalent | Notes |
|---|---|---|
| Breeding logic (inline in `breedSlimes`) | `initiate_breeding(state, parent_a_id, parent_b_id, ...)` | Already handles Color+Shape+Accent internally — do not call `breed_slimes`/`breed_shape`/`breed_accent` separately |
| `handleForceClaim` | `force_claim_action` | |
| `handleBribeClaim` | `bribe_claim_action` | |
| `handleConvertClaim` | `convert_claim_action` | Now takes `culture_relationship` — pass explicit value or let it default per Phase 3a |
| `handleBuyUpgrade` | `buy_upgrade` | |
| `handleRecycleSlime` | `recycle_slime` | Now exists (Phase 3a) — was a gap, now closed |
| Rename flow | `rename_slime` | Now exists (Phase 3a) — was a gap, now closed |
| `handleToggleWorkerRole` | `toggle_worker_role` | |
| `handleLaunchDispatch` / `handleRetrieveCompletedPod` | `launch_dispatch` / `retrieve_completed_dispatch` | |
| `handleLaunchExploration` | `launch_exploration` | |
| `handleLaunchMediation` | `launch_mediation` | |
| `handleAssignGarrison` / `handleRecallGarrison` | `assign_garrison` / `recall_garrison` | |
| Cycle advance | `advance_cycle` | Now automatically applies worker income + capitol hardening (Phase 3a) — the TS source's separate inline display math for these can become pure preview/estimate, not the authoritative calculation |

**Confirmed gaps, still real, do not invent Lua-side to close them in this phase:**

| TS source calls | Lua status | Action this phase |
|---|---|---|
| `handlePurchaseSeedSlime` | No Lua function exists | Port the UI as-is, wire the call, but it will fail until a Phase 3b closes this — report explicitly, do not stub with fake success |
| Market price calc (`calculateMarketPrice`) | No Lua function exists | `sell_on_market` needs a real `price` argument — same treatment: wire it, flag it, don't fake it |

> ⚠️ RULE: for both confirmed gaps, the correct behavior is to leave
> the button/action visibly present but non-functional with a clear
> console warning or disabled state — NOT to silently succeed with a
> made-up price/result. This preserves the honest-gap discipline from
> every prior phase.

---

## §3 Conversion Layer

Mirror `luaHorseToTs` exactly. New functions needed:

```ts
function luaSlimeToTs(raw: Record<string, unknown>): Slime {
  return {
    id: raw['id'] as string,
    name: raw['name'] as string,
    color: raw['color'] as SlimeColor,
    hue: raw['hue'] as number,
    saturation: raw['saturation'] as number,
    vertex_count: raw['vertex_count'] as number,
    irregularity: raw['irregularity'] as number,
    diffusion_ratio: raw['diffusion_ratio'] as number,
    amplitude: raw['amplitude'] as number,
    accent_hue: raw['accent_hue'] as number,
    // ... remaining fields, cross-check against the real slime schema
    // in data.yaml's `slime.fields` block, not against memory of the
    // old TS types.ts — the two may have drifted (e.g. `pattern` is
    // legacy per Phase 2's compatibility note, `color_saturation` is
    // explicitly marked legacy in the schema).
  };
}
```

> ⚠️ RULE: build this against `data.yaml`'s real `slime.fields` schema,
> not against the old `examples/slimeworld/src/types.ts` blind — they
> are not guaranteed identical after tonight's genetics/accent work.
> Diff them explicitly and report any mismatch found.

A `luaNodeToTs` conversion for `planet_node` is needed too, following
the same pattern — cross-check against `data.yaml`'s real
`planet_node.fields`.

---

## §4 Preview Math — A Real Design Question, Not a Silent Default

The TS source's UI computes live preview numbers before committing
(claim success chance, breeding predictions, worker income) using
inline client-side formulas that duplicate the Lua math. Two honest
options, don't silently pick one:

1. **Keep lightweight client-side preview formulas**, clearly marked
   as estimates, with the actual Lua call as the only authoritative
   result on submit. Real risk: preview math can drift out of sync
   with Lua if either side changes later — worth a code comment
   flagging this explicitly.
2. **Call Lua speculatively for previews** (e.g. call
   `claim_success_chance` directly with draft inputs before the
   player commits). More correct, more calls.

Report which was chosen and why — this is a real tradeoff, not
something to default into without noting it.

---

## §5 Verification

- [ ] Every function call site in all 6 ported components checked
      against real `logic.lua` — paste the full mapping table with
      confirmed/gap status for each, not just the ones listed in §2
- [ ] `luaSlimeToTs`/`luaNodeToTs` built against `data.yaml`'s actual
      schema — paste any drift found between old TS types and the
      real current schema
- [ ] Both confirmed gaps (seed purchase, market price) wired but
      non-functional with explicit warnings, not faked
- [ ] Preview-math approach (§4) stated explicitly with reasoning
- [ ] One real breeding action performed end-to-end through the UI,
      actual resulting slime's Color/Shape/Accent values pasted
- [ ] One real claim action performed end-to-end, actual result pasted
- [ ] `logic.lua`, `data.yaml`, `systems.yaml`, `ui.yaml` confirmed
      unmodified via diff

---

## §6 Completion Criteria

- [ ] `ts/src/games/slimeworld/` created, mirrors `horse_racing`'s
      structure
- [ ] All 6 components ported, calls verified against real Lua
      functions per §2's table
- [ ] Both real gaps (seed purchase, market pricing) wired-but-flagged,
      not stubbed
- [ ] Conversion layer verified against real `data.yaml` schema, drift
      reported if found
- [ ] One real end-to-end breeding and one real end-to-end claim
      demonstrated with actual output pasted

---

## §7 Quick Reference

| Item | Status |
|---|---|
| Template | `horse_racing/App.tsx`, read in full, literal pattern to follow |
| Source of truth for UI structure | `examples/slimeworld/src/components/*.tsx` — port FROM, don't redesign |
| Confirmed 1:1 function mappings | 12 (see §2 table) |
| Confirmed real gaps, not closed this phase | Seed purchase, market pricing |
| New work required | Conversion layer (`luaSlimeToTs`/`luaNodeToTs`), preview-math decision |
| ui.yaml's role going forward | Intent documentation, not executed code |
