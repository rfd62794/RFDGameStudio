# RFDGameStudio — Tooling: Auto-Fix Base Path + Config/Registry Generator
*July 13 2026 | Handoff target: Devin (real code edits go through Devin, not direct Claude edits) | Closes two explicitly-queued, previously-deferred gaps*

---

> ⛔ **STOP:** Verify baseline before touching anything — confirmed floor
> tonight: Python 194/0/0+, TypeScript 80/0/0. Re-run yourself first.
> This directive touches `studio_mcp/tools.py`, shared tooling every
> future game promotion depends on — get it right once, not per-game.

---

## §0 Context

**Both gaps were already identified and explicitly deferred, not new
discoveries — this directive is closing debt, not inventing scope.**

**Gap 1, confirmed by hitting it live tonight, third time this pattern's
recurred (CorpWorld R3, R4, R5 all needed the identical manual fix
per project memory):** `studio_promote_to_examples()`, `studio_mcp/tools.py`
around line 933-940, does `zf.extractall(path=str(examples_dir), members=members)`
on every call — this pulls `vite.config.ts` fresh from the intake zip
every time, silently overwriting any manual fix already applied to the
extracted copy. The check right after it (lines 953-968) then correctly
detects the missing/wrong `base` and refuses — but refusing after
silently destroying the only place a human could have fixed it is a real
UX trap: editing `examples/{slug}/vite.config.ts` by hand and re-running
looks like it should work and doesn't, with no indication why.

**Gap 2, named explicitly in project memory as still manual:** creating
`ts/src/games/{slug}/config.ts` plus the corresponding import and
registry entry in `ts/src/games/registry.ts` is done by hand, every
time, for every new external-tier game. No tool touches either file
currently.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `studio_mcp/tools.py` | Modify | Auto-inject `base` instead of refusing (Gap 1); new `studio_generate_registry_entry()` tool (Gap 2) |
| `tests/test_studio_promote_to_examples.py` (or wherever its existing tests live — check first) | Modify | New anchors for both |
| `ts/src/games/registry.ts` | Read-only this directive | The new tool writes to it programmatically; this directive doesn't hand-edit it |
| Any existing game's `config.ts` | Read-only | Templating only for *new* entries, never touches existing ones |

---

## §2 Implementation

### §2.1 — Auto-inject base path (Gap 1)

Replace the refuse-on-missing/mismatched logic (lines ~953-968) with a
fix-and-continue path:

```python
content = vite_config.read_text(encoding="utf-8")
base_match = re.search(r'base\s*:\s*(["\'])(.*?)\1', content)

if base_match is None:
    # No base key at all — inject one right after the opening `return {`
    content = re.sub(
        r'(return\s*\{)',
        rf"\1\n    base: '{expected_base}',",
        content,
        count=1,
    )
    vite_config.write_text(content, encoding="utf-8")
elif base_match.group(2) != expected_base:
    # Wrong base — replace in place, preserving quote style
    content = content[:base_match.start(2)] + expected_base + content[base_match.end(2):]
    vite_config.write_text(content, encoding="utf-8")
```

> ⚠️ RULE: This must run *after* extraction and *before* the build step,
> every single call, regardless of whether the base was already correct
> — idempotent by construction, not a one-time fix. The whole point is
> this never needs a human to notice or intervene again, on this game or
> any future one.

> ⚠️ RULE: Log which case fired (`injected` vs `corrected` vs
> `already-correct`) in the tool's return dict — silent success here is
> exactly the kind of thing that should be visible in the result, not
> just observable by checking the file afterward.

### §2.2 — Config/registry template generator (Gap 2)

```python
def studio_generate_registry_entry(
    slug: str,
    description: str,
    color: str = "#6c8ef7",
) -> dict:
    """Create ts/src/games/{slug}/config.ts and add the corresponding
    import + registry entry to ts/src/games/registry.ts, for a new
    external-tier (embedUrl) game. Does not touch any existing entry."""
```

Real requirements, not left to the agent's judgment:
- `game_id` derives from `slug` the same way `_game_id_from_slug()`
  already does elsewhere in this file — reuse it, don't reimplement
- `status: 'external'` always, matching the locked two-tier architecture
  in `project:rfdgamestudio:architecture` — this tool is for the
  embedUrl tier specifically, not the four-file Lua contract tier
- Refuse (don't silently overwrite) if `ts/src/games/{slug}/config.ts`
  already exists, or if `slug` is already present in `GAME_REGISTRY`
- The registry.ts edit must be a real, minimal insertion — add the
  import line and one array entry, not a full-file rewrite that risks
  reformatting every other game's entry

---

## §3 Test Anchors

Target: current floor + 8 new, 0 failed.

| Test name | Behaviour |
|---|---|
| `test_promote_injects_missing_base` | Zip with no `base` key at all → correctly injected, build proceeds |
| `test_promote_corrects_wrong_base` | Zip with a mismatched `base` (e.g. copied from a different game) → corrected, not just flagged |
| `test_promote_leaves_correct_base_untouched` | Already-correct `base` → byte-identical after the call, not needlessly rewritten |
| `test_promote_reruns_idempotently` | Calling the tool twice in a row on the same intake produces the same result both times |
| `test_generate_registry_entry_creates_config` | Real `config.ts` file, correct `game_id`, correct `status: 'external'` |
| `test_generate_registry_entry_adds_import_and_array_entry` | `registry.ts` diff is minimal — one import line, one array entry, nothing else changed |
| `test_generate_registry_entry_refuses_duplicate_slug` | Second call for the same slug → clean refusal, not a silent overwrite |
| `test_generate_registry_entry_refuses_existing_config_file` | Same, for a pre-existing `config.ts` |

---

## §4 Completion Criteria

- [ ] Full floor passing, raw output pasted
- [ ] Manual proof: re-run tonight's actual SlimeGarden promotion through
      the fixed tool, unpatched intake zip, zero manual vite.config.ts
      editing required — this is the real end-to-end proof, not a
      synthetic test case
- [ ] Manual proof: `studio_generate_registry_entry` run for SlimeGarden,
      real diff of `registry.ts` pasted showing the minimal insertion
- [ ] Confirm no existing game's `config.ts` or `registry.ts` entry
      changed as a side effect

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Gap 1 root cause | `zf.extractall()` overwrites `vite.config.ts` on every call, silently destroying manual fixes |
| Gap 1 fix | Inject/correct `base` programmatically, after extraction, every call, idempotent |
| Gap 2 | New `studio_generate_registry_entry()` tool — external tier only, refuses on any collision |
| Both gaps | Already known, already deferred — this closes debt, doesn't invent new scope |

---

*RFDGameStudio — Tooling Directive | RFD IT Services Ltd. | July 13 2026*
*Third time hitting the same bug is a tooling problem, not a habit problem.*
