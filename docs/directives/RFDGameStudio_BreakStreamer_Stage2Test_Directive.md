# RFDGameStudio — Stage 2 Real-World Test: Break Streamer Dual Verification

*August 31 2026 | Read `docs/directives/RFDGameStudio_ZipVerifier_Phase2_Directive.md`
in full before this one. This is not a new capability — it's the first
real test of certified Stage 2 (`studio_mcp/zip_verify/`) against a real
prompt and two real, independently-built deliverables, neither of which
is an RFDGameStudio game. Nothing here gets imported, promoted, or
committed as a real game. This is a verification exercise only.*

---

> ⛔ **STOP:** Confirm both source files exist before writing anything:
> `C:\Users\cheat\Downloads\break-streamer.zip` (AI Studio build) and
> `C:\Users\cheat\Downloads\break-streamer-mvp.zip` (Manus build). These
> are real files on the local machine, outside this repo — read-only,
> never modify or move the originals. Confirm the real Stage 1+2+2b+
> import_fixer suite floor (87/0 as of the last certified run) before
> touching anything.

---

## §0 Context

**What this phase tests:** whether Stage 2's `ZipVerifier` — built and
certified against controlled RFDGameStudio fixtures (`antsim-redux`,
`corpworld`) — produces a sound, independent verdict against something
messier: two different AI platforms' real output for the same real
prompt, neither one a native RFDGameStudio import. This is the first
time Stage 2 has been pointed at anything from outside the studio's own
pipeline.

**The real, confirmed source directive — exact text, nothing more:**

```
**Current State of Play:** Ready to code the Break Streamer MVP UI and Loop. We are utilizing the 'Divert' (Slot Selling) mechanic for maximum economic realism.

**Directive:** You are the Lead Engine Architect.
1. Write the HTML/CSS scaffolding that contains BOTH the `div#off-stream-ui` and `div#on-stream-ui`. Include the CSS classes required to toggle them (`.hidden { display: none; }`).
2. Write the TS/JS controller logic that handles the FSM transition: clicking "GO LIVE" hides the back office, starts the 60-second timer, and reveals the stream overlay.
3. Write the exact CSS required to composite a card: A relative container `div`, an absolute `img` for the Base Creature (Layer 1), and an absolute `img` for the Variant Frame (Layer 2) stacked exactly on top of each other.
```

> ⚠️ RULE: Use only this text as the source directive. Do not add the
> surrounding ADR-016 context (the 100-creature count, the `logic.lua`
> architectural rule) even though it exists in the fuller conversation —
> confirmed directly that neither agent received that context, only the
> block above. Testing against a larger spec than either agent actually
> saw would produce a false, unfair verdict.

**Why this needs a real, on-disk directive file, and why that's a real
tension worth naming rather than quietly resolving:** `concept_grep.py`'s
`find_source_directive()` only searches `docs/directives/` and
`docs/gdd/` in this repo — there's no parameter to point it elsewhere.
Placing a directive file there for something that isn't a real,
committed RFDGameStudio game is new territory for this convention. Two
real filenames are needed (`ZipVerifier` derives a slug per zip from its
filename, so `break-streamer.zip` and `break-streamer-mvp.zip` produce
two different slugs) — both files hold identical content, there are not
two different specs. Whether these stay in `docs/directives/`
permanently, move to a clearly-marked test-fixtures location, or get
deleted after this phase is a real, open decision for Robert — flag it
explicitly in the completion report, do not decide it silently.

**Explicitly NOT in scope:**
- Importing, promoting, or registering either build as a real
  RFDGameStudio game
- Any modification to `zip_verify/` itself — this phase only calls the
  existing, certified `ZipVerifier`
- Deleting or moving the real files in `Downloads/` — read-only
- Deciding, on this phase's own authority, whether the two temporary
  directive files should be kept or removed afterward

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `docs/directives/break-streamer_Directive.md` | New (temporary) | Exact source-directive text above, verbatim |
| `docs/directives/break-streamer-mvp_Directive.md` | New (temporary) | Identical content, second filename to match the second zip's slug |
| `docs/state/ZipVerifyReport_break-streamer.md` | New | Real output of `ZipVerifier` run 1 |
| `docs/state/ZipVerifyReport_break-streamer-mvp.md` | New | Real output of `ZipVerifier` run 2 |

**Read-only:** everything in `studio_mcp/zip_verify/`, both real zip
files in `Downloads/`.

---

## §2 Implementation

No new code. Run the existing, certified pipeline exactly as built:

```python
from studio_mcp.zip_verify.openrouter_client import OpenRouterClient
from studio_mcp.zip_verify.report import ZipVerifier

client = OpenRouterClient(api_key=<loaded from .env, never printed>)

v1 = ZipVerifier(r"C:\Users\cheat\Downloads\break-streamer.zip", client=client)
result1 = v1.verify()

v2 = ZipVerifier(r"C:\Users\cheat\Downloads\break-streamer-mvp.zip", client=client)
result2 = v2.verify()
```

> ⚠️ RULE: Load the OpenRouter key the same way established earlier
> tonight — read `.env`, extract the value into a local variable, never
> print it, never log it. Confirm the current live model slug before
> assuming `deepseek/deepseek-v4-flash-0731` is still correct.

Write both real reports via `v1.write_report()` / `v2.write_report()`.

---

## §3 Test Anchors

None — this phase runs existing, already-tested code against new real
data. There is nothing new to unit test. The "test" is the real verdict
output itself, reviewed by a human against what independent manual
review already found.

---

## §4 Completion Criteria

- [ ] Real pre-flight floor confirmed (87/0) before anything else
- [ ] Both zips confirmed to exist and be read from `Downloads/`
      directly — not copied into the repo
- [ ] Both directive files created with the exact text above, verbatim
      — confirmed via diff that no ADR-016 context was added
- [ ] Both `ZipVerifier.verify()` calls run for real, both raw
      OpenRouter responses pasted in full — not summarized
- [ ] Both real reports written to `docs/state/`, full content pasted in
      the completion report
- [ ] Open question flagged explicitly, not resolved: should the two
      temporary directive files be kept, relocated, or deleted
- [ ] No claim in the completion report that either build was
      "imported," "promoted," or "registered" — this phase verifies, it
      does not adopt

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Real zip 1 | `C:\Users\cheat\Downloads\break-streamer.zip` (AI Studio) |
| Real zip 2 | `C:\Users\cheat\Downloads\break-streamer-mvp.zip` (Manus) |
| Source directive | The narrow 3-point block only — confirmed real, confirmed complete |
| New code this phase | None — pure application of certified Stage 2 |
| Decides whether either build gets adopted | Not this phase |
| Open question this phase must surface, not answer | Fate of the two temporary directive files |

---

*RFD Method | Stage 2 Real-World Test | RFDGameStudio | August 2026*
*Director → Pipeline → Agent. The first time this tool has been pointed at anything from outside its own pipeline.*
