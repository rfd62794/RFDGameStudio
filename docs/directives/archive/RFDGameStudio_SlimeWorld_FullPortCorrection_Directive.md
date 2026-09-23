# RFDGameStudio — SlimeWorld: Full Port Correction from Canonical Source

*July 16 2026 (night) | Vehicle: Windsurf/Devin | Source: `C:\Users\cheat\OneDrive\Documents\slimegarden (35).zip`*

---

> ⛔ **STOP — READ THIS BEFORE TOUCHING ANYTHING.** Every prior SlimeWorld
> UI directive tonight (Phase 3, Phase 4, Phase 4-Revision) was built by
> reading component files and inferring handler behavior from prop
> names — NOT by reading the actual source logic. That was a real
> mistake, confirmed: the real `useCycleActions.ts` hook (462 lines)
> contains contract-spawning logic and a two-tier logging system that
> exist nowhere in the current `logic.lua`. The zip above is the
> canonical, original AI Studio export — treat it as ground truth for
> this entire pass. Do not treat `examples/slimeworld/` as
> automatically authoritative — its `App.tsx` was modified after
> initial extraction (file timestamps show creation and later
> modification on different days) and may have already diverged from
> the zip. Diff it explicitly per §1, don't assume equivalence.

**Read-only — do not touch:** `data.yaml`, `systems.yaml`
(`logic.lua` IS in scope this time — Phase 3a's certification is
being reopened for cause, see §0).

---

## §0 Root Cause

Every hook file in the real zip (`src/hooks/*.ts`, 1,712 lines total
across 9 files) encapsulates real, specific game logic that was never
read:

| Hook | Lines | Status |
|---|---|---|
| `useBreedingActions.ts` | 321 | Not read this session |
| `useClaimActions.ts` | 277 | Not read this session |
| `useCycleActions.ts` | 462 | **Confirmed gap**: contract spawning + dual logging missing from `logic.lua`'s `advance_cycle` |
| `useDispatchActions.ts` | 120 | Not read this session |
| `useEconomyActions.ts` | 73 | Not read this session |
| `useExplorationActions.ts` | 107 | Not read this session |
| `useGarrisonActions.ts` | 145 | Not read this session |
| `useMediationActions.ts` | 107 | Not read this session |
| `useUpgradeActions.ts` | 100 | Not read this session |

Separately, real UI infrastructure was left behind during the port:
- `src/index.css` (Google Fonts, Tailwind `@theme` block, CRT scanline
  effect, `.glow-{color}` classes, custom scrollbars) — real, exists
  in the zip, never copied into `ts/src/games/slimeworld/`.
- `lucide-react` version mismatch: zip uses `^0.546.0`, the shared
  `ts/` project uses `^0.469.0` — flagged as the leading suspect for
  icons not rendering in the ported UI, not yet confirmed as root cause.

---

## §1 Establish Ground Truth First

- [ ] Extract the zip fully. Diff `examples/slimeworld/src/` against
      the zip's `src/`, file by file. Report every difference found —
      do not silently assume they're equivalent. If `examples/slimeworld`
      has diverged (added, removed, or changed anything relative to the
      zip), state exactly what and where.
- [ ] Confirm whether `examples/slimeworld/src/hooks/` exists at all.
      (It does not appear to as of this session — confirm directly.)
- [ ] Read all 9 hook files in the zip, in full, before writing any
      code. This is not optional — the whole point of this pass is
      stopping the pattern of inferring behavior instead of reading it.

---

## §2 Per-Hook Extraction and Correction

For EACH of the 9 hooks, produce a real audit, not a summary:

1. List every distinct piece of logic/state mutation the hook performs.
2. Cross-reference against the corresponding `logic.lua` function(s)
   already shipped (`initiate_breeding`, `force_claim_action` /
   `bribe_claim_action` / `convert_claim_action`, `advance_cycle`,
   `launch_dispatch` / `retrieve_completed_dispatch`, `buy_upgrade`,
   `launch_mediation`, `launch_exploration`, `assign_garrison` /
   `recall_garrison`, `deliver_contract` / `sell_on_market`).
3. Report each item as one of: **Matches** (already correctly ported),
   **Missing** (real logic in the hook, absent from Lua), or
   **Extra** (Lua does something the hook doesn't — flag, don't
   silently remove without asking).

**`useCycleActions.ts` — known gaps, fix these explicitly:**
- Contract spawning: `updatedContracts.length < 4 && (Math.random() < 0.65 || updatedContracts.length < 2)` — port this exact logic (including the "always spawn if fewer than 2 exist" floor) into `advance_cycle`.
- Dual logging: a deterministic per-cycle system log, plus a 45%-chance
  random flavor log via `getRandomMelancholicLog`. Port both. Confirm
  whether `logic.lua`/`data.yaml` needs a new `logs` field on state and
  a pool of flavor-log text to draw from — check `gameLogic.ts` for
  `getRandomMelancholicLog`'s real implementation and text pool.
- Read past line 70 — dispatch/mediation/exploration resolution logic
  continues for ~390 more lines. Extract all of it.

**All other hooks — same rigor, no shortcuts because they're smaller:**
`useEconomyActions.ts` at 73 lines is the shortest — that does not
mean it's fully covered by what's already shipped. Audit it with the
same care as the 462-line file.

> ⚠️ RULE: for anything found to be genuinely missing from `logic.lua`,
> port the REAL formula/logic from the hook — do not approximate or
> simplify. If a formula involves randomness (`Math.random()`), port
> the exact probability and thresholds, not a rounded guess.

---

## §3 UI Infrastructure Correction

- [ ] Create `ts/src/games/slimeworld/styles.css` from the zip's real
      `src/index.css` content — fonts, `@theme` block, CRT effect,
      glow classes, scrollbars. Import it at the top of
      `ts/src/games/slimeworld/App.tsx`, matching `horse_racing`'s
      pattern (`import './styles.css';` as the first line).
- [ ] Investigate the icon-rendering gap directly — check whether the
      `lucide-react` version mismatch (0.469 vs 0.546) is the actual
      cause by testing a single icon import in isolation, or find the
      real cause if it's something else. Report which it was, don't
      guess.

---

## §4 Verification

- [ ] Full per-hook audit table pasted for all 9 hooks — Matches /
      Missing / Extra, not a narrative summary
- [ ] Contract spawning: hand-computed test — run `advance_cycle` 10
      times from a fresh state with 0 contracts, confirm spawn rate is
      visibly consistent with 65% (not exact due to randomness, but
      report the actual observed count out of 10 runs)
- [ ] Logging: confirm both the deterministic system log and at least
      one instance of a random flavor log firing, paste actual log
      entries produced
- [ ] Screenshot of the running app showing the CRT effect and glow
      styling actually rendering — not just "styles.css created"
- [ ] Confirm whether icons render post-fix; if the version mismatch
      wasn't the cause, report what was
- [ ] For every OTHER hook's audit findings beyond cycle actions: paste
      the actual before/after `logic.lua` diff for anything corrected

---

## §5 Completion Criteria

- [ ] `examples/slimeworld` vs. zip diff reported explicitly
- [ ] All 9 hooks read in full and audited — table pasted, not summarized
- [ ] `advance_cycle` corrected: contract spawning + dual logging added,
      verified with real run output
- [ ] Any other confirmed-missing logic from the remaining 8 hooks
      ported, verified against real formulas
- [ ] `styles.css` created and imported, CRT/glow effects confirmed
      rendering via screenshot
- [ ] Icon-rendering root cause confirmed and fixed
- [ ] `data.yaml`, `systems.yaml` confirmed unmodified; `logic.lua`
      changes fully diffed and listed

---

## §6 Quick Reference

| Item | Status going in | This phase |
|---|---|---|
| Hooks read | 0 of 9 | All 9, full audit |
| `advance_cycle` | "Certified" but incomplete — worker income + capitol hardening only | + contract spawning + dual logging, verified against real source |
| `styles.css` | Does not exist for SlimeWorld | Created from real zip source, imported |
| Icons | Not rendering, cause unconfirmed | Root cause confirmed, fixed |
| Source of truth | `examples/slimeworld` (possibly diverged) | The zip, explicitly diffed against `examples/slimeworld` first |
