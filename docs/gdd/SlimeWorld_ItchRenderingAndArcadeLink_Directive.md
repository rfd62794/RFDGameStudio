# SlimeWorld -- Directive: Itch.io Rendering + Back-to-Arcade Link

*August 5 2026 | Read fully before executing anything. This is a
SEPARATE directive from the concurrent Missing-Lua-Files fix -- do not
touch vite.standalone.factory.ts, dist-slimeworld, or anything else in
that directive's scope. Both issues here genuinely require the game to
actually render before they can be properly diagnosed and verified --
confirm the Lua-files directive has landed and the game runs correctly
before starting real work here; if it hasn't landed yet, read this
directive fully and prepare, but don't guess at fixes for a game that
can't run yet.*

---

> STOP: Confirm the real, current test floor. Confirm the concurrent
> Missing-Lua-Files directive's real status -- if it's still in
> progress, coordinate rather than risk file conflicts; if it's landed,
> confirm via a real functional check (per that directive's own
> completion criteria) that the game actually runs before proceeding.

---

## Section 0 -- Context: two real, separate issues, both confirmed via source read

Issue 1: "Back to Arcade" link. Lives in shared GameShell.tsx, calls
navigateHome(mode, arcadeBaseUrl) from ts/src/arcade/routing.ts (also
shared, cross-game code). The function itself, read directly, is
already correct and reasonably well-designed:

```typescript
export function navigateHome(mode: 'arcade' | 'standalone' = 'arcade', arcadeBaseUrl?: string): void {
  if (mode === 'standalone' && arcadeBaseUrl) {
    window.open(arcadeBaseUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.href = window.location.href.split('?')[0];
}
```

In standalone mode, it correctly opens the arcade in a NEW TAB rather
than navigating the player away from itch.io -- the right design. mode
and arcadeBaseUrl are meant to come from real build-time env vars
(VITE_STANDALONE, VITE_ARCADE_BASE_URL), both already defined in the
shared standalone factory.

Real hypothesis, not yet confirmed -- this is the actual investigation
this directive requires: the code reading correctly does not mean it
works correctly in the real, deployed itch.io build. Given the sibling
directive found the standalone build pipeline has a real, confirmed gap
(missing Lua files, same shared factory), it's plausible the env vars
also aren't reliably reaching the actual built/deployed bundle --
meaning mode could silently fall back to its default 'arcade' value even
on itch.io, causing the button to do the wrong thing (reload the
iframe's own URL, not open the arcade). Do not assume this is the cause
-- verify it empirically against the real, running, fixed build once
available. If the env vars ARE reaching the build correctly and the
button still misbehaves, the real cause is something else -- find it via
real evidence, don't force this hypothesis to be true.

Issue 2: Rendering "blown out" specifically on itch.io. Confirmed from
Robert's screenshot: a single, massively oversized shape fills most of
the screen, header text overflows/clips at the left edge. No raw CSS
viewport-unit assumptions (100vh/100vw) found in GameShell.tsx via
direct grep -- likely Tailwind utility classes elsewhere, or the real
cause is something that only shows once real game state actually
renders. Important, already-noted overlap: this may be partially or
fully a downstream symptom of the missing-Lua-files bug (broken/fallback
rendering when game state never initializes) rather than an independent
CSS issue -- confirm this by re-checking whether the visual problem
persists AFTER the Lua fix lands and the game can actually run with real
state. Do not assume it's a separate CSS bug until that's confirmed;
equally, do not assume it's FULLY explained by the Lua fix without
checking -- itch.io's actual embed frame dimensions (640x360 default,
confirmed from the real page HTML) may still expose a real, separate
responsive-layout gap even once the game runs correctly.

Not in scope, explicitly deferred:
- Anything already covered by the concurrent Missing-Lua-Files
  directive -- don't duplicate or interfere with that work.
- Any change to navigateHome's own logic unless real evidence shows
  it's actually wrong -- the function reads correctly; don't rewrite
  working code chasing a hypothesis that turns out false.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| Build/env var propagation (exact file TBD -- investigate whether the gap is in vite.standalone.factory.ts's define block, or something else in how the itch.io build actually gets produced/deployed) | Modify (narrow, once real cause confirmed) | Ensure VITE_STANDALONE/VITE_ARCADE_BASE_URL are reliably present in the real, deployed itch.io build |
| CSS/layout (exact file TBD -- investigate GameShell.tsx and SlimeWorld's own root container styling) | Modify (narrow, once real cause confirmed) | Fix whatever real, confirmed responsive-layout gap remains after the Lua fix, specific to itch.io's actual embed dimensions |

Read-only -- do not touch: navigateHome's own logic, unless real
evidence proves it's actually broken, not just theoretically suspect;
anything in the concurrent Lua-files directive's scope.

---

## Section 2 -- Implementation

RULE: Do not fix either issue speculatively. Both require the game to
actually run to diagnose properly -- get the Lua fix confirmed working
first (or work in parallel with real coordination, not assumption), then
use real browser dev tools against the actual deployed itch.io embed
(not just local dev, which may not reproduce itch.io's specific iframe
context) to confirm the real cause of each issue before writing any fix.

RULE: For the Back-to-Arcade link -- the real, required verification is:
open the actual live itch.io page, open browser dev tools, check
import.meta.env.VITE_STANDALONE and import.meta.env.VITE_ARCADE_BASE_URL
in the running app (or equivalent real check), confirm whether they hold
the expected values. If they're wrong/undefined, that's the real bug --
fix the build/deploy step that should set them. If they're correct and
the button still misbehaves, investigate window.open behavior
specifically inside itch.io's iframe (some sandboxed iframes block
popups without allow-popups -- check the real iframe attributes on the
actual itch.io embed, visible in the page's own HTML).

RULE: For rendering -- test against the real itch.io embed at its real
default dimensions (640x360, confirmed from the actual page HTML) and
also in "maximized" state, since itch.io's frame supports both. Confirm
which state(s) show the problem, don't assume it's present in both
without checking.

---

## Section 3 -- Test Anchors

Given both fixes depend on real, empirical browser-based investigation
rather than pure unit-testable logic, real functional verification is
the primary standard here -- but any real, isolable logic fix (e.g., if
the env-var gap turns out to be a real code path that can be unit
tested) should get a real test anchor per this project's usual standard.
Don't skip anchors just because the diagnosis is empirical -- the fix
itself, once identified, likely can and should be tested normally.

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight floor reported
- [ ] Confirmed Lua-files directive's real status before starting --
      coordinated, not conflicting
- [ ] Real cause of the Back-to-Arcade misbehavior confirmed via actual
      browser inspection of the live itch.io embed, not assumed
- [ ] Real cause of the rendering issue confirmed the same way, and
      explicitly reported whether it was fully, partially, or not at all
      resolved by the Lua fix alone
- [ ] Both fixes verified against the real, live itch.io embed -- not
      just local dev -- since itch.io's specific iframe context is the
      actual environment that matters here
- [ ] git diff --stat confirms only real, necessary files touched
- [ ] Report explicitly: is the itch.io page now genuinely ready for
      Robert's Draft -> Published decision, or what's still blocking it

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| Back-to-Arcade code | Reads correct on inspection -- real bug is likely env-var propagation into the build, not the navigation logic itself |
| Rendering issue | May be partially or fully a Lua-files symptom -- confirm after that fix lands, don't assume either way |
| Real verification standard | Actual live itch.io embed, browser dev tools -- not local dev, not assumption |
| Depends on | The concurrent Missing-Lua-Files directive -- coordinate, don't conflict |

---

## UPDATE, same night -- Issue 2 (Rendering) CONFIRMED ALREADY SOLVED

The concurrent Missing-Lua-Files directive's agent also independently
diagnosed and fixed the rendering problem as a real side effect of their
own investigation -- confirmed via independent verification (real CSS
file size check: index-D0YeMEAM.css is now 125,014 bytes, matching their
claimed ~125KB almost exactly; real .lua file count in dist-slimeworld
confirmed at 21, all previously-missing files present).

REAL ROOT CAUSE, different from this directive's original hypothesis:
NOT env-var propagation, NOT a Lua-state-fallback symptom -- a genuine
Tailwind v4 source-scanning gap. The standalone Vite root
(src/standalone/{gameId}/) never included the real component directories
(src/games/{gameId}/, src/ui/) in Tailwind's scan path, so size utility
classes (w-10, h-16, etc.) were never generated -- SVG slime visuals fell
back to unstyled intrinsic size. Fixed via explicit `@source` directives
added to the shared ts/src/index.css.

DO NOT re-investigate or re-fix Issue 2 -- it's real, confirmed, done.
**Issue 1 (Back-to-Arcade link) is still open and is now this
directive's only remaining real task.**

Also confirmed, real, honest disclosure from the other directive: this
same Tailwind gap affects every standalone game, not just SlimeWorld
(confirmed via spot-check: brewfield/entry.tsx still uses the old,
narrow single-file import pattern). That's a real, separate, future
follow-up item -- not blocking, not this directive's job either.
