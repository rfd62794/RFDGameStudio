# RFDGameStudio — Phase: Arcade Core System Hardening

*July 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Verify baseline before touching anything. Confirmed this
> session: `194 passed` (Python), `56 passed` (TypeScript), both exit 0.
> Re-run yourself first.

---

## §0 Context

**What this delivers:** The Arcade shell — game selection, routing, and
loading — currently lives inline in `main.tsx`, the app's bootstrap file,
with almost no test coverage and one confirmed real robustness gap. This
phase extracts it into its own tested module, matching the same
architectural discipline already applied to `hooks/`, `components/`, and
`engine/`, and closes the gaps found by direct testing this session — not
speculative ones.

**Two things verified directly, not assumed, and one correction from the
original diagnosis:**

1. **`navigateTo()` has zero test coverage, unlike its sibling
   `navigateHome()`.** `navigateHome()` has two dedicated tests proving it
   respects the app's actual mount path rather than hardcoding domain root —
   which matters, since the real site deploy serves this at
   `/arcade/rfdgamestudio/`, not root. `navigateTo()` fires on every single
   game-card click and carries the exact same path-portability risk with
   nothing testing it.

2. **The real registry-mismatch bug, precisely as verified, not as
   originally hypothesized.** A bad or nonexistent `?game=` URL already
   fails correctly — `loadGame()` throws `"Unknown game: X"` and the
   existing error UI catches it. That path is fine, don't touch it. The
   actual gap: `findGameOrDefault()` in `games/registry.ts` silently
   returns `GAME_REGISTRY[0]` for any ID not in the registry, and
   `GameLoader` calls it *after* `loadGame()` has already succeeded — so if
   a game's files exist on disk and load correctly but its config was never
   added to `registry.ts` (a real, increasingly likely mistake as more
   games get added), the player sees a completely different game's UI
   rendering against the wrong game's loaded session, with no error at all.

**Explicitly NOT in scope:**
- Visual redesign of the selector (screenshots, filtering, card layout) —
  that's the separate, more subjective Arcade-as-product conversation from
  two turns ago, not hardening
- Deploying to the live site — stays blocked on this phase finishing, and
  on the still-open DEV-games-going-public decision
- Any change to individual games' internals

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `ts/src/arcade/routing.ts` | New | `getGameId`, `navigateTo`, `navigateHome` — moved from `main.tsx` |
| `ts/src/arcade/GameSelector.tsx` | New | Moved from `main.tsx` |
| `ts/src/arcade/GameLoader.tsx` | New | Moved from `main.tsx`, registry-mismatch fix applied |
| `ts/src/arcade/index.ts` | New | Barrel export, matching `hooks/`/`components/` pattern |
| `ts/src/main.tsx` | Modify | Reduced to `Root()` + mount, importing from `./arcade` |
| `ts/src/games/registry.ts` | Modify | `findGameOrDefault` usage reconsidered — see §2 |
| `ts/tests/test_navigation.ts` | Modify | Move into `ts/tests/test_arcade_routing.ts` alongside new tests, or extend in place — agent's call, state which was done |
| `ts/tests/test_arcade.ts` | Read-only | Per-game registry tests already live here; do not duplicate |

---

## §2 Implementation

### `ts/src/arcade/routing.ts`

Move `getGameId`, `navigateTo`, `navigateHome` here verbatim from
`main.tsx` — no behavior change in this step, just relocation, so the
existing `navigateHome` tests keep passing unmodified as the first proof
the extraction didn't break anything.

### The registry-mismatch fix

In `GameLoader`, after `loadGame()` succeeds, replace the
`findGameOrDefault` call with `findGame`:

```typescript
const config = findGame(gameId);
if (!config) {
  setError(`Game "${gameId}" loaded successfully but has no registered
    config in registry.ts — this is a studio configuration error, not a
    player-facing one. Check that the game is added to GAME_REGISTRY.`);
  return;
}
```

> ⚠️ RULE: Word this error distinctly from the "Unknown game" error that
> `loadGame()` itself throws. They are different failure modes — one means
> the game doesn't exist at all, the other means it exists but isn't wired
> up. Conflating them into one generic "Studio Error" message would make
> this exact bug class harder to diagnose next time it happens, which
> defeats the point of fixing it now.

> ⚠️ RULE: Before removing `findGameOrDefault` from `registry.ts` entirely,
> grep for other call sites. If nothing else uses it, remove it — a
> function whose only real behavior is "silently return the wrong thing"
> has no legitimate remaining purpose once its one call site is fixed.
> If something else does use it, leave it, but do not add new callers.

### `ts/src/arcade/GameSelector.tsx` / `GameLoader.tsx`

Move verbatim otherwise. No visual changes this phase — see §0.

---

## §3 Test Anchors

Target: **56 + 8 = 64 TypeScript passing**, 0 failed. (No Python changes —
this phase is TS-only.)

| Test name | Behaviour |
|---|---|
| `test_navigate_to_respects_current_path` | `navigateTo` preserves the mount path, same pattern as the existing `navigateHome` tests — the actual gap this phase exists to close |
| `test_navigate_to_sets_game_query_param` | Confirms the resulting URL actually contains `?game={id}` |
| `test_get_game_id_returns_null_when_absent` | No `?game=` param → `null`, not a crash |
| `test_get_game_id_parses_present_param` | Real extraction check |
| `test_game_selector_renders_all_registry_entries` | Every game in `GAME_REGISTRY` produces a card |
| `test_game_selector_card_click_navigates` | Clicking a card actually calls `navigateTo` with the right ID |
| `test_game_loader_shows_registry_mismatch_error` | Mock a `loadGame` success paired with an ID absent from the registry — confirms the new distinct error message, not a silent wrong-game render |
| `test_game_loader_back_button_returns_clean_url` | Leaving a game and returning to the selector doesn't leave a stale `?game=` param behind |

---

## §4 Completion Criteria

- [ ] `64 passed, 0 failed` (TypeScript) — raw output
- [ ] `194 passed, 0 failed` (Python) — unchanged, confirm nothing broke
      collaterally even though this phase shouldn't touch Python at all
- [ ] Manual proof: navigate to `?game=totally_fake_id` — confirm the
      existing `"Unknown game"` error still shows correctly (regression
      guard, this path was already fine)
- [ ] Manual proof: construct the registry-mismatch scenario deliberately
      (temporarily comment out one game's registry entry, confirm the new
      distinct error appears, then restore it) — paste the real trace
- [ ] `npx tsc --noEmit` — zero new errors
- [ ] `npx vite build` — exits 0
- [ ] Confirm `git diff --stat` shows only files listed in §1 — no
      incidental changes to any individual game's files
- [ ] `docs/state/current.md` updated, headed CERTIFIED when done

---

## §5 Quick Reference

| Item | Value |
|---|---|
| New module | `ts/src/arcade/` |
| Real gap closed | `navigateTo` untested despite identical risk to tested `navigateHome` |
| Real bug closed | Registry/loadGame mismatch → wrong game renders silently |
| Confirmed already-fine, don't touch | Genuinely invalid `?game=` URLs — `loadGame` already throws correctly |
| Explicitly deferred | Visual redesign, site deploy, DEV-games-public decision |

---

*RFDGameStudio — Arcade Hardening Directive*
*RFD IT Services Ltd. | July 2026*
*A page that happens to work and a Core System are different things — this is what closes the gap.*
