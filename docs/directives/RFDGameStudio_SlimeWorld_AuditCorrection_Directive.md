# RFDGameStudio — SlimeWorld: Audit Correction + Actual Completion

*July 16 2026 (night) | Vehicle: Windsurf/Devin | Corrects the prior report's wrong-source comparison and inverted findings; requires the real work that was never delivered*

---

> ⛔ **STOP:** The prior pass used the wrong comparison file
> (`intake/slimegarden/slimegarden_v0.1.0R1.zip`, dated July 13 —
> SlimeGarden's PRE-evolution snapshot) instead of the specified
> `C:\Users\cheat\OneDrive\Documents\slimegarden (35).zip`. This has
> been independently verified and corrected below. Read §0 before
> doing anything — it locks in confirmed facts so they don't get
> re-derived incorrectly a third time.

**Read-only — do not touch:** `data.yaml`, `systems.yaml`,
`examples/slimeworld/` (confirmed byte-identical to the real zip,
treat as read-only ground truth, do not "fix" it).

---

## §0 Confirmed Facts — Locked, Do Not Re-Derive

1. **`examples/slimeworld/src/gameLogic.ts` is byte-identical to the
   real zip's `src/gameLogic.ts`** — both 78,704 bytes, independently
   verified. `examples/slimeworld` has NOT diverged from its source.
   The prior report's first finding ("zero differences") was correct;
   everything after it, which compared against the wrong file, was not.

2. **`breedShape` and `breedAccent` do not exist anywhere in the real
   zip's `gameLogic.ts` either** — confirmed by direct grep. This is
   NOT a gap. Shape and Accent genetics were invented fresh THIS
   session, in Lua only, grounded in real research (polygon
   constructibility, Turing reaction-diffusion) that has no TypeScript
   precedent anywhere, in any version of this codebase. **Do not port
   `breed_shape`/`breed_accent` logic into TypeScript. This would fork
   the formula into two disagreeing implementations instead of the UI
   correctly calling Lua as the single source of truth — which is
   already built and already verified working** (the live breeding
   test earlier tonight produced correct Shape/Accent values through
   the Lua bridge). **This line item is closed. Remove it from scope
   entirely — do not re-propose it.**

3. **Two different comparisons were conflated in the prior report and
   must be kept separate this time:**
   - **(A) Hook logic vs. `logic.lua`** — does Lua's game logic
     correctly implement what the real hook describes? Compare against
     `examples/slimeworld/src/hooks/*.ts` (confirmed real, unmodified).
   - **(B) The actual port vs. `logic.lua`** — does
     `ts/src/games/slimeworld/App.tsx` (the real Lua-bridge port, NOT
     the React-only hooks) actually CALL every Lua function that
     exists? These are different questions with different answers —
     Lua can have a function that the hooks never described (fine,
     it's new), and Lua can have a function the PORT never wired up
     (a real gap, different from a hook-logic gap).

---

## §1 Re-Confirm the `useCycleActions.ts` Findings Against the Correct Source

The general shape of the prior finding — `logic.lua`'s `advance_cycle`
is narrower than the real hook — is plausible and consistent with
what was independently confirmed earlier tonight (contract spawning,
dual logging). Re-verify against `examples/slimeworld/src/hooks/useCycleActions.ts`
specifically (already confirmed as the correct, real file) and confirm
each of these, not just restate them:

- [ ] Contract spawning (cap 4, 65% chance, floor of 2) — confirm
      present or absent in current `logic.lua`, with an actual code
      excerpt, not a table cell saying "Matches"
- [ ] Dual logging (deterministic system log + 45%-chance flavor log
      via `getRandomMelancholicLog`) — same, actual code excerpt
- [ ] Dispatch/mediation/exploration resolution folded into cycle
      advance — confirm whether this belongs in `logic.lua`'s
      `advance_cycle` or should stay as separate explicit actions
      (the current Lua architecture keeps these as separate function
      calls — `launch_dispatch`, `retrieve_completed_dispatch`, etc.
      — deliberately.) **Do not fold them into `advance_cycle` without
      confirming that's actually the intended architecture — this may
      be a real design divergence worth flagging, not silently copying.**
- [ ] Planet supply/pressure simulation, stray arrival, wilds unlock
      check — confirm each is real, present in the hook, and genuinely
      absent from Lua before proposing to port it

---

## §2 Verify the Port Layer (Comparison B) — Specifically Check `rename_slime`

`ts/src/games/slimeworld/App.tsx` has `setRenameSlimeId`/
`setNewNameInput` state setters passed down to `LabTab`, but no
confirmed handler that actually calls `call(session, 'rename_slime',
...)`. Check this specifically — it's a real candidate gap in the
PORT (not in Lua, which has the function; not in the hooks, which
have the real UI flow) that was never confirmed either way.

Also re-check `recycle_slime` — the prior report's claim that it's
"missing" appears to be comparing against the wrong reference layer
(the old pure-React hooks, not the actual Lua-bridge port). The real
port's `handleRecycleSlime` already calls `call(session, 'recycle_slime', ...)`
— confirm this directly and correct the prior report's claim if it's
wrong, rather than re-porting something that already works.

---

## §3 Verification — Actually Required This Time

Nothing in the prior report included this. All of it is required now:

- [ ] For every confirmed real gap (post §1/§2 re-verification): the
      actual `logic.lua` diff, before and after
- [ ] Contract spawning: real run output, 10 cycles from an empty
      contract list, actual observed spawn count
- [ ] Logging: actual log entries produced, both the deterministic and
      at least one random flavor log instance
- [ ] `rename_slime` wiring: confirm end-to-end, actual before/after
      slime name from a real UI interaction (or Lua bridge call if UI
      isn't testable directly)
- [ ] `examples/slimeworld`, `data.yaml`, `systems.yaml` confirmed
      unmodified via diff

---

## §4 Completion Criteria

- [ ] §0's three facts acknowledged and NOT re-litigated or reversed
- [ ] `useCycleActions` findings re-confirmed against the correct file,
      each with an actual code excerpt
- [ ] `rename_slime` port status confirmed and fixed if genuinely missing
- [ ] `recycle_slime` claim corrected if the prior report was wrong
- [ ] All verification in §3 delivered with real output, not narrative
- [ ] No `breed_shape`/`breed_accent` TypeScript porting attempted

---

## §5 Quick Reference

| Item | Status |
|---|---|
| `examples/slimeworld` vs. real zip | Confirmed byte-identical, closed |
| `breed_shape`/`breed_accent` "gap" | False alarm from wrong comparison — closed, do not revisit |
| `useCycleActions` findings | Plausible, re-verify against correct file, not yet actually fixed |
| `rename_slime` port wiring | Unconfirmed, real candidate gap, check directly |
| `recycle_slime` port wiring | Likely already correct, prior claim likely wrong, verify |
| Actual `logic.lua` changes delivered so far | None — this phase must produce real diffs |
