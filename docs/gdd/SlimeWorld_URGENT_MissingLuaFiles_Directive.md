# SlimeWorld -- URGENT Directive: Fix Missing Lua Files in Standalone Build

*August 5 2026 | Read fully before executing anything. SlimeWorld is
CURRENTLY LIVE on itch.io (Draft status, but publicly reachable via
secret URL and the embedded frame) and is confirmed non-functional. This
is not a polish item -- it's a real, live, broken deployment.*

---

> STOP: Do not flip the itch.io page to Published under any
> circumstances until this is fixed AND re-verified with a real,
> functional in-browser check -- not just HTTP 200, not just correct
> asset filenames. Confirm the real, current test floor before touching
> anything else.

---

## Section 0 -- Context: real, confirmed root cause

Confirmed via direct browser console output, provided by Robert: every
Lua file the game needs fails to load at runtime -- all six shared
engine primitives (entity.lua, resolution.lua, consequence.lua,
movement.lua, physics.lua, lifecycle.lua) plus SlimeWorld's own
favors.lua and regionlock.lua. The visibly broken rendering (a single
oversized, malformed shape filling the screen, text overflowing its
container) is almost certainly a broken fallback state caused by this,
not a separate CSS bug -- don't treat these as two problems.

Confirmed via direct source read this session -- the real cause:
ts/dist-slimeworld (the actual build that was rebuilt and pushed earlier
tonight) contains ZERO .lua files anywhere. The build's own config,
vite.slimeworld.config.ts, delegates entirely to a shared factory
(vite.standalone.factory.ts, used by makeStandaloneConfig -- confirmed
shared across every game's standalone build, not SlimeWorld-specific
code). That factory handles React, Tailwind, output directory, and
standalone env vars -- it has no mechanism whatsoever for copying game
Lua files into the build. No public/ folder exists at
ts/src/standalone/slimeworld/ (Vite's standard convention for static
files that should be copied verbatim) -- confirmed empty via direct
check.

This is very likely a systemic gap, not a SlimeWorld-specific bug. Since
the factory is shared, every other game that has gone through this same
standalone build path (used for itch.io publishing specifically,
distinct from the main arcade lobby build which is confirmed working)
may have the identical problem. A real, required part of this directive
is checking whether this is unique to SlimeWorld or affects every game
using makeStandaloneConfig.

Real clue worth investigating, not yet confirmed: the main arcade lobby
(rfditservices.com/arcade/rfdgamestudio/) is confirmed working and does
serve games with their Lua files correctly -- there's likely already a
real, working mechanism there (in studio_deploy_arcade or elsewhere) for
how Lua files get delivered to a running game. Find and understand that
real, working mechanism first -- the standalone build path should very
likely replicate it, not invent a different one.

Not in scope, but flag clearly if found: any other games with this same
gap should be reported explicitly, not silently fixed as a side effect
-- Robert needs to know the real scope before deciding how broadly to
remediate.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| ts/vite.standalone.factory.ts | Modify | Add a real mechanism to copy the relevant game's .lua files (and any other required runtime data files -- confirm the full real list, likely matching required_files already used elsewhere: data.yaml, logic.lua, ui.yaml, systems.yaml, plus every split .lua file) into the build output |
| ts/dist-slimeworld | Rebuild | Once the factory is fixed, rebuild for real and confirm Lua files are actually present in the output this time |
| itch.io / studio_deploy_arcade | Re-deploy | Push the corrected build to both real destinations once the fix is confirmed working locally |

Read-only -- do not touch: the actual Lua game logic itself; the main
arcade lobby's existing, working delivery mechanism (investigate it,
don't modify it as part of this fix).

---

## Section 2 -- Implementation

RULE: Before writing any fix, find and understand the real,
currently-working mechanism the main arcade lobby uses to deliver Lua
files to a running game -- confirm via source read, don't assume it
works the same way you'd guess. Replicate that real, proven pattern in
the standalone factory rather than inventing a new one.

RULE: Confirm the complete, real list of files a standalone build
actually needs at runtime -- not just the .lua files mentioned in the
console error, the full set (likely data.yaml, ui.yaml, systems.yaml
too, given studio_mcp/tools.py's own required_files list already names
these as load-bearing). Missing one of these silently would just produce
the same class of bug again with a different missing file.

RULE: Once fixed, check whether this same gap affects other games that
use makeStandaloneConfig -- pick at least one other real, already-built
standalone game and confirm whether it has the same problem. Report this
explicitly, don't silently fix only SlimeWorld and leave the scope of
the bug unknown.

RULE, the real verification standard this time: HTTP 200 and correct
asset filenames are NOT sufficient -- that's exactly what let this ship
broken. Required: load the actual built game in a real browser (or
equivalent real functional check), confirm the console shows zero "file
not found" errors, and confirm the game actually renders and responds to
input correctly, not just that the page loads.

---

## Section 3 -- Completion Criteria

- [ ] Real, working mechanism from the main arcade lobby found and
      understood, confirmed via source read
- [ ] Fix implemented in the shared standalone factory
- [ ] Fresh dist-slimeworld build confirmed to actually contain every
      required file -- .lua files, data.yaml, ui.yaml, systems.yaml --
      not just the JS/CSS bundle
- [ ] Real, functional in-browser check performed -- zero console
      errors, game actually renders and plays correctly, not just "page
      loads"
- [ ] Real check performed on at least one other standalone game to
      determine whether this bug is systemic -- reported explicitly
      either way
- [ ] Corrected build re-deployed to both website and itch.io,
      re-verified functionally on itch.io specifically (the actual
      embed, not just the direct dist output)
- [ ] Explicit confirmation: itch.io page is now genuinely safe to flip
      to Published -- or explicit statement of what's still blocking that

---

## Section 4 -- Quick Reference

| Fact | Value |
|---|---|
| Current real state | SlimeWorld is live (Draft, but publicly reachable) and confirmed non-functional |
| Root cause, confirmed | Zero .lua files anywhere in the standalone build output |
| Why | Shared vite.standalone.factory.ts has no file-copying mechanism at all; no public/ folder exists |
| Likely scope | Systemic -- affects every game using this shared factory, not just SlimeWorld |
| What NOT to trust as sufficient verification | HTTP 200, correct asset filenames -- exactly what missed this bug the first time |
| Hard rule | Do not flip Draft -> Published until this is fixed and functionally re-verified |
