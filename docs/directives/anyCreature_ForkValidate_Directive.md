# anyCreature — Fork & Validate as Offline Asset Pipeline

*September 2026 | Read fully before executing anything. This directive
forks and validates a third-party tool, generates exactly one known-safe
smoke-test image, and stops. It does not decide which RFDGameStudio game
this targets — that's Robert's call, made after seeing the real output,
not before.*

---

> ⛔ **STOP:** Confirm `gh` (GitHub CLI) is authenticated as Robert's own
> account before forking anything — `gh auth status`. If not
> authenticated, report that and stop; do not fork anonymously or under
> a different identity. Confirm Node 18+ and Python 3.9+ are available
> on this machine before running `setup.sh`.

---

## §0 Context

**Source, confirmed real but young:** `https://github.com/Ariescar/anyCreature`,
MIT licensed, 2 commits total as of this writing, 1 star — a genuinely
new, single-author project, not an established one. Its actual design
philosophy — blind, context-free quality gates, never self-graded — is
real and independently worth the fit: the tool's own README states
*"the session that designed the creature is the worst possible judge of
whether it reads."*

**What this phase delivers:**
1. A real GitHub fork under Robert's own account (`gh repo fork`, with
   upstream tracking preserved — this is an actively-versioned tool,
   future updates from the original are worth being able to pull).
2. Confirmation the tool actually runs on this machine — `setup.sh`
   must print `calibrate OK` before anything else is trusted.
3. Exactly one generated image: `example/wolf.json` → `hero.png`, the
   repo's own pre-built, known-good fixture. Not a new creature design,
   not anything invented for this phase — the zero-risk smoke test that
   proves the pipeline works end-to-end.
4. A real, honest report of the actual per-creature cost incurred (token
   spend, wall-clock time), since the tool's own author explicitly
   states minion/NPC costs are estimates, not measured data — this
   phase's real number is the first real data point, worth recording
   even though the wolf isn't a minion/NPC/boss tier itself.

**Explicitly NOT in scope:**
- Designing or generating any new creature beyond the pre-built wolf
  example. No "make me a menacing mountain giant" session, no picking a
  real game to target.
- Any integration into RFDGameStudio's own repo, build pipeline, or
  `studio_mcp` tooling. This phase produces a validated, forked,
  standalone tool and one sample image — nothing wired into the studio
  yet.
- Running `harness/publish.mjs` (the Gobkit community-wall publisher).
  Not this phase's decision to make, and not needed to validate the
  tool works.
- Judging whether the output art style actually fits RFDGameStudio's
  needs. This phase reports the real image; a human decides fit.

---

## §1 Scope Statement

| Location | Status | Action |
|---|---|---|
| GitHub fork of `Ariescar/anyCreature` under Robert's account | New | Real fork via `gh repo fork`, upstream preserved |
| Local clone of the fork | New | Wherever Robert's other sibling repos live (matching `RFD_IT_Publishing`'s pattern — a sibling repo, not vendored inside RFDGameStudio) |
| `out/wolf.glb`, generated hero images | New (local, not committed to RFDGameStudio) | Real output of the smoke test |

**Not touched:** anything in `C:\Github\RFDGameStudio` itself. This
phase is entirely self-contained in the new fork's own directory.

---

## §2 Implementation

1. `gh auth status` — confirm authenticated identity before forking.
2. `gh repo fork Ariescar/anyCreature --clone=true` — real fork with
   upstream tracking, cloned locally.
3. `cd` into the clone, `bash setup.sh` — must print `calibrate OK`.
   If it doesn't, stop and report the exact failure — do not proceed
   past a failed calibration.
4. `node engine/cli.js example/wolf.json out/wolf.glb`
5. Run `harness/hero.mjs` against `out/wolf.glb` to produce the real
   `hero.png`/`hero.jpg`.
6. Report the real wall-clock time and, if the tool surfaces any token
   or cost figures during this run, the real number — not an estimate.

> ⚠️ RULE: If any step requires an API key, model access, or credential
> not already configured on this machine, stop and report exactly what's
> needed rather than guessing at a substitute.

---

## §3 Test Anchors

None — this phase validates a third-party tool's own existing
calibration self-check (`setup.sh`'s `calibrate OK`), it does not add
new tests to RFDGameStudio's suite.

---

## §4 Completion Criteria

- [ ] Real GitHub fork exists under Robert's account, upstream tracking
      confirmed (`git remote -v` shows both `origin` and `upstream`)
- [ ] `setup.sh` ran for real, `calibrate OK` printed — raw output
      pasted, not paraphrased
- [ ] `example/wolf.json` compiled to a real `wolf.glb`
- [ ] Real `hero.png` generated and presented — this is the actual
      deliverable Robert needs to see
- [ ] Real cost/time figures reported, whatever they turn out to be
- [ ] No new creature designed, no RFDGameStudio integration attempted,
      no publish step run — confirmed explicitly in the report

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Source repo | `Ariescar/anyCreature`, MIT, 2 commits, 1 star (as of this writing) |
| This phase's only real output | One `hero.png` from the pre-built wolf example |
| Not this phase's decision | Which RFDGameStudio game this targets |
| Not this phase's action | Publishing, integrating, or designing anything new |

---

*RFD Method | anyCreature Fork & Validate | September 2026*
*The cheapest real test before any real decision — one known-good image, not a promise.*
