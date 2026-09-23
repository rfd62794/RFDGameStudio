# SlimeWorld -- Directive: Publish Push (Website + Itch.io)

*August 4 2026 | Read fully before executing anything. This directive
executes the actual publish, using facts already confirmed across two
prior real sessions tonight -- don't re-derive what's already established
below, but DO re-verify timestamps/state live before acting, since state
changes between sessions.*

---

> STOP: Confirm the real, current test floor before touching anything.
> Confirm current hostname (hostname / $env:COMPUTERNAME) -- this work
> has spanned DuggerLaptop/Nitro this session; don't assume continuity if
> it's different.

---

## Section 0 -- Context: real, already-confirmed facts, don't re-derive

dist-slimeworld is stale, confirmed as of the start of this directive.
Multiple real SlimeWorld source commits landed tonight after the last
manual rebuild (Naming Correction, Fealty wiring, Gate Tabs, Options
Menu/Hard Reset, Random Starting Color Foundation) -- the existing dist
output does not reflect current source. Rebuild is mandatory, not
optional, before any push.

npm run build:slimeworld is a confirmed, real, reproducible bug -- fails
silently, exit code 1, zero captured error output even with explicit
redirection. Confirmed working workaround: npx vite build --config
vite.slimeworld.config.ts (the same underlying command, bypassing the npm
script wrapper) -- real output confirmed clean: 2174 modules, ~5.5s build
time, exit 0. Use the workaround directly. Diagnosing WHY the npm wrapper
fails is real, separate, lower-priority work -- do not get pulled into
that investigation as part of this directive; note it and move on if it
resurfaces.

The automated freshness-check/version-tagging fix
(_is_dist_stale/--userversion in RFD_IT_Publishing/targets/itchio.py) is
STILL not real -- confirmed via fresh grep earlier tonight, zero hits,
matching the original Aug 1 fabrication finding. Do not rely on any
automated safety net for the itch.io push in this directive -- freshness
must be confirmed manually (real timestamp comparison, same method
already used tonight), and the push itself must be a real, explicit
butler push command, not something assumed to be automatically safe.

itch.io page state, confirmed via a real browser check earlier tonight:
SlimeWorld's page exists, status is Draft, no cover image set.

Real, confirmed config: RFD_IT_Publishing/config/games.yaml has a real,
correct slimeworld entry with real itch.io slug and build path --
confirmed accurate as of the Aug 1 investigation, re-confirm it's still
accurate before using it, don't assume it hasn't drifted.

Not in scope, explicitly deferred:
- Diagnosing the npm run build:slimeworld wrapper bug itself -- use the
  workaround, don't fix the wrapper here.
- games.yaml's known antsim/greengap placeholder entries -- not
  blocking, clean up only if the file needs touching for another reason.
- Any further game-design work (Envoy/Garrison, Shape-focus, breeding
  cost, etc.) -- this directive is publish-mechanics only.
- Flipping the itch.io page from Draft to Published -- see Section 2's
  final checkpoint. This directive gets the page fully ready; the actual
  publish flip needs Robert's explicit go-ahead, not an autonomous agent
  action, given it's the real, public launch moment.

---

## Section 1 -- Scope Statement

| Target | Action |
|---|---|
| ts/dist-slimeworld | Rebuild fresh via the confirmed workaround |
| Website/Arcade | Deploy via studio_deploy_arcade |
| itch.io | Real butler push to the confirmed real slug/channel |
| itch.io dashboard | Verify build appears correctly in Distribute tab; report cover-image status, don't invent/generate one without confirming a real asset exists first |

---

## Section 2 -- Implementation

RULE: Rebuild first, verify freshness explicitly (real timestamp
comparison against real current source files -- logic.lua, territory.lua,
naming_reference.lua, App.tsx, tutorial.ts, types.ts -- the newest of
these must predate the new dist-slimeworld build), THEN proceed. Do not
skip the freshness re-check just because a rebuild command completed
with exit 0 -- confirm what it actually produced is genuinely newer than
source, not just that the command succeeded.

RULE: studio_deploy_arcade deploy -- confirmed working mechanism, already
has its own real pre-flight checks (dist must exist, has index.html). Run
it, confirm real HTTP-reachable verification after, matching how this
tool has been confirmed to behave in every prior real use this project.

RULE: For the itch.io push -- construct the real butler push command
explicitly: butler push {fresh_dist_slimeworld_path} {real_slug}:{real_channel}.
Confirm the real slug/channel from games.yaml first, don't hardcode a
guess. Since the automated version tagging doesn't exist, consider
whether to pass --userversion manually using the real current
games/slimeworld/VERSION file content -- this is a real, small extra step
worth doing even without the automation, since it costs nothing and
directly improves what shows on itch.io's own dashboard.

RULE: After the push, verify it actually landed -- check the real
Distribute tab (browser) shows the new build, not just that butler
reported success locally. A local "success" and a confirmed-visible
remote build are different claims; confirm the second, don't assume it
follows from the first.

RULE, the real checkpoint: once the build is verified live in Distribute
and the page's real current state is confirmed (cover image present or
genuinely absent), STOP and report status clearly rather than flipping
Draft->Published autonomously. If no real cover image asset exists
anywhere in this project, say so explicitly rather than generating a
placeholder -- that's a real creative/brand decision, not a mechanical
one, same principle already applied to Fealty's narrative text and the
opening-beat rewrite earlier this week.

---

## Section 3 -- Completion Criteria

- [ ] Real pre-flight floor and hostname confirmed
- [ ] dist-slimeworld rebuilt via the confirmed workaround, freshness
      explicitly re-verified against real current source timestamps
- [ ] Website/Arcade deploy completed, real HTTP verification confirms
      it's live and current
- [ ] itch.io butler push executed with the real, confirmed slug and
      channel, --userversion set from the real VERSION file if reasonable
      to include
- [ ] Real, browser-confirmed check that the new build actually appears
      in the itch.io Distribute tab -- not just a local success message
- [ ] Real, current cover-image status reported explicitly -- present,
      confirmed absent, or unable to check -- no placeholder generated
- [ ] Report clearly: page is ready for Robert's own Draft->Published
      decision, or name exactly what's still blocking that readiness

---

## Section 4 -- Quick Reference

| Fact | Value |
|---|---|
| Build command to use | npx vite build --config vite.slimeworld.config.ts -- NOT the npm wrapper |
| Known broken, don't use | npm run build:slimeworld (silent exit 1) |
| Freshness automation | Confirmed still fake -- verify manually, every time |
| itch.io page state going in | Draft, no cover image, confirmed via real browser check |
| The one thing this directive does NOT do | Flip Draft -> Published -- that's Robert's explicit call |
