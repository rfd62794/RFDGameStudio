# RFDGameStudio — Play Loop P0 Directive: Re-point the studio documents

*November 2026 | Docs only. Read fully before executing anything.*

**Read first:** `docs/DIRECTION.md`, `docs/ROADMAP.md`, `/ROADMAP.md`, `docs/status.md`, `docs/adr/ADR-017-four-doc-documentation-architecture.md`.

---

> ⛔ **STOP:** Run `git rev-parse HEAD` and `git status --porcelain` before touching any file. Report both. This directive was written against `82907284933ad18d9aaa93a1e461bebcb501ae2c`. If any of the four documents in the scope table changed since that commit, stop and report the diff; do not merge by guesswork.

---

## 1. Why this exists

Robert approved a change of studio measure on 2026-11-09. The current documents still tell every agent that the measure is demos shipped and that the next actions are five graphics decisions. Until the documents change, the swarm keeps proposing work the direction no longer wants.

## 2. Scope

| File | Status | Action |
|---|---|---|
| `docs/adr/ADR-024-play-loop-is-the-measure.md` | New | Create from Appendix A of this directive, verbatim; set Status to `Accepted` with today's date |
| `docs/DIRECTION.md` | Modify | Add a "Play loop (approved 2026-11-09)" section above "Next steps"; replace the `yaml direction` block with the block in §3 |
| `docs/ROADMAP.md` | Modify | Add one paragraph to "Why these milestones"; append milestones M12–M16 from §3 after M11 |
| `/ROADMAP.md` | Modify | Add a "Play Loop" section as the first section under Now; move the five Graphics & Styles "Now" items to Later under a heading "Graphics decisions (parked 2026-11-09, ADR-024)" |
| `docs/status.md` | Modify | Add one "In flight" row for the play loop; ADR count line to 24 |
| `docs/state/play-sessions.md` | New | Header and empty table from §3 |

**Read-only — do not touch:** everything under `ts/`, `studio/`, `studio_mcp/`, `games/`, `engine/`, every existing ADR, every file in `docs/directives/`, every existing milestone M1–M11 in `docs/ROADMAP.md`.

## 3. The work

**`yaml direction` block** (replaces the existing one; `answered` must name Robert's approval date):

```yaml direction
version: 2
answered: 2026-11-09 robert-claude
purpose: A place where Robert plays a game while agents design, build and fix it; games are disposable cartridges for that loop.
done_when:
- Robert can make a request in the terminal during or after play and later play the cartridge with that change in it
- Robert can switch to a second cartridge of a different genre while a request on the first is being built
- No agent change reaches a play session without passing tuning targets and playtest invariants
do_not:
- Never publish a game that doesn't load, or break one that is already live
- No paid art or asset generation without approval
- Do not build engine features that no play session asked for
audience: Robert first, players second
hours_per_week: 1-3
stakes: medium
```

**Milestones** (same field shape as M1–M11; all `status: pending`; do not invent new status values):

```yaml
- id: M12
  title: The studio documents name the play loop as the measure
  status: pending
  exit:
  - file: docs/adr/ADR-024-play-loop-is-the-measure.md
  - file: docs/state/play-sessions.md
  steps:
  - id: M12.1
    title: Re-point direction, roadmaps and status
    kind: docs
    size: S
    value: 5
    status: pending
    directive: PlayLoop_P0_Repoint_Directive.md
    detail: ADR-024, direction v2, roadmap priority note, graphics decisions parked, session log created. Docs only.
    accept:
    - file: docs/adr/ADR-024-play-loop-is-the-measure.md
- id: M13
  title: A knob change takes effect without reloading the game
  status: pending
  exit:
  - test: cd ts && npx vitest run test_tuning_apply_mode.ts test_tuning_panel_live.tsx
  steps:
  - id: M13.1
    title: Apply modes for knobs and a panel that reloads only when it must
    kind: feature
    size: S
    value: 5
    needs: [M12.1]
    status: pending
    directive: PlayLoop_P1_Live_Apply_Directive.md
    detail: KnobDef gains an optional applies field; the panel reloads only for reload-mode knobs. Scrapcrawl loss_damage is live, player_max_hp is next-run.
    accept:
    - test: cd ts && npx vitest run test_tuning_apply_mode.ts test_tuning_panel_live.tsx
- id: M14
  title: A second cartridge is in the play loop and the cartridge contract is tested
  status: pending
  exit:
  - file: ts/src/games/play-loop-registry.ts
  - test: cd ts && npx vitest run test_play_loop_contract.ts
  steps:
  - id: M14.1
    title: Second cartridge joins; one contract test over every listed cartridge
    kind: feature
    size: M
    value: 5
    needs: [M13.1]
    status: pending
    directive: ''
    detail: Moved ahead of the first session because switching cartridges while an edit builds is the core of the loop. Directive to be written; default second cartridge is chimera_wilds.
    accept:
    - test: cd ts && npx vitest run test_play_loop_contract.ts
- id: M15
  title: A request made in the terminal becomes a queued edit for the current cartridge with game state attached
  status: pending
  exit:
  - file: ts/tools/play/devPlugin.ts
  steps:
  - id: M15.1
    title: Studio side of the play commands - state endpoint, snapshot providers, gate
    kind: feature
    size: M
    value: 5
    needs: [M14.1]
    status: pending
    directive: ''
    detail: The dev server exposes the running cartridge's state so a request filed from the terminal can attach it; the tuning-target and playtest gate runs before an edit is offered back. The play, note and switch commands themselves live in AgentFlow and are tracked on its roadmap. Directive to be written.
    accept:
    - file: ts/tools/play/devPlugin.ts
- id: M16
  title: Session 1 is logged - a request on one cartridge, a switch to another while it builds, a return to check it
  status: pending
  exit:
  - grep:
      path: docs/state/play-sessions.md
      pattern: scrapcrawl
  steps:
  - id: M16.1
    title: Hold and log Session 1
    kind: test
    size: S
    value: 5
    needs: [M15.1]
    status: pending
    directive: ''
    detail: Robert plays; the controller appends the row from real evidence (the queued directives, the gate output, a recording).
    accept:
    - grep:
        path: docs/state/play-sessions.md
        pattern: scrapcrawl
```

**`docs/state/play-sessions.md`:**

```markdown
# Play sessions

The studio's scoreboard under ADR-024. One row per session, appended by the controller from real evidence (notes file, gate output, recording).

| Date | Cartridges played | Minutes | Requests filed | Edits checked in session | Edits still in the queue | Forced restarts | Evidence |
|---|---|---|---|---|---|---|---|
```

> ⚠️ RULE: Do not change the `status` of M1–M11 and do not delete any roadmap item. Parking is done by Robert not approving directives, not by editing history.

> ⚠️ RULE: In `/ROADMAP.md`, move the graphics items intact. Do not reword, shorten or drop any of them.

## 4. What NOT to do

- No code, no test, no build, no deploy.
- Do not edit the engine tooling roadmap spec; ADR-024 supersedes its principle 6 by reference.
- Do not hand-write a Queue block.

## 5. Verification

- `git status` shows exactly 2 new files and 4 modified files, all in the scope table.
- `uv run pytest -q tests/test_children_fresh.py` if that file exists (it guards roadmap freshness); paste the tail. If it does not exist, say so.
- Paste `git diff --stat`.

## 6. Rules for this run

Same as the repo standard: non-interactive, no installs, never commit to main, never push, branch `directive/play-loop-p0-repoint`, Robert merges.

## 7. Completion criteria

- [ ] ADR-024 present, Status Accepted with date
- [ ] Direction v2 block present; old block gone
- [ ] M12–M16 present after M11; M1–M11 byte-identical
- [ ] Five graphics items present under Later, none under Now
- [ ] `docs/state/play-sessions.md` present
- [ ] `docs/status.md` updated (this repo's state file per ADR-017)

## 8. Report

`git diff --stat`, the pytest tail if run, and anything in the four documents that contradicted this directive.

---

## Appendix A — ADR-024 text

Headings are shown two levels down so they nest inside this directive. In the ADR file the title is a level-1 heading and Status, Context, Decision and Consequences are level-2 headings. The wording is verbatim.

### ADR-024: The play loop is the studio's measure

#### Status

Proposed 2026-11-09. Becomes Accepted when Robert merges the P0 directive.

#### Context

The engine tooling roadmap (`docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md`, principle 6) set the studio's measure as "demos shipped per month, not engine features". `docs/DIRECTION.md` names the purpose as a factory that turns ideas into finished, published games.

Evidence gathered 2026-11-09:

- Robert stopped working on the 2D demos on 2026-10-31 and reports that his tastes change too often to keep any one game in development.
- The tuning and bot-playtest modules are built, tested (73 passing across their ten test files at `82907284`) and adopted by two games each out of 43 game folders.
- The `/ROADMAP.md` "Now" section has been five graphics decisions awaiting Robert since September.
- What Robert has rebuilt several times, across projects, is one experience: playing a game while an agent designs, builds and fixes it.

A measure of demos shipped rewards the supply the studio already over-produces and ignores the one activity that has held Robert's attention.

#### Decision

1. The studio's measure is **play sessions in which feedback landed**, logged in `docs/state/play-sessions.md`. A session counts when Robert plays a cartridge, makes at least one request (typed to the Overseer in the terminal, or through a play command), and at least one change from a request reaches a cartridge he then plays.
2. A **cartridge** is a game folder under `ts/src/games/<id>/` that satisfies the play-loop contract: a `tuning.ts` with at least one knob, one target and a `simulate`; a `playtest.ts` adapter; and a state snapshot provider. Games outside the contract stay in the catalog and are unaffected.
3. Cartridges are disposable. Retiring one follows the existing retirement pattern (source preserved, removed from the loop list). Starting one is cheap by design and is not a commitment to finish it.
4. No change from an agent reaches a play session without passing the gate: tuning targets under the proposed values, and the bot-playtest invariants.
5. Requests are made in the terminal. Robert says what he wants in plain language to the Overseer, which files it; the underlying play commands are also callable directly by Robert, the Overseer persona, or an agent. Each request becomes a directive in the AgentFlow queue for the cartridge it concerns, and Robert can switch to another cartridge while it is built.
6. Requests for a cartridge in the loop are pre-authorised for dispatch, limited to that cartridge's own folder (Robert, 2026-11-09).
7. Engine features continue to enter only by extraction (roadmap principle 1). The play loop adds no exception to that rule.

#### Consequences

- Supersedes principle 6 of the engine tooling roadmap. Principles 1–5, 7 and 8 stand.
- Demos shipped, graphics style work and per-demo documentation are no longer priorities by default. They return when a play session asks for them.
- Dev overrides still never ship to players (`?dev=1` gate, tuning spec §e). Requests live in the AgentFlow queue; state snapshots and knob proposals are local files under `.play/`, which is git-ignored; nothing is sent to a backend (roadmap principle 5 stands).
- The Python/Lua Studio MCP is not extended for this. The agent's view of a TS-native game is the playtest adapter and the note snapshot.
- Deferred: fixed-step loop, replay and the debug overlay (roadmap E1/E2) remain unbuilt until a play session shows a need for pause, step or replay.
- This ADR does not change ADR-010, ADR-013, ADR-014 or ADR-017.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-playloop-p0-repoint-directive |
| Base branch | - |
| Base commit | 084671a24151b0c1b16431afb22cb253e0dd29f4 |

**Status log**
- 2026-11-09 21:30 · robert-claude-laptop · none → Queued — Play loop re-point (docs only). Robert 2026-11-09 21:13 and 21:21 ET: approved the play-loop plan and all recommendations.
- 2026-11-09 21:31 · robert-claude-laptop · Queued → Approved — lint override: The two flagged paths (ADR-024 and docs/state/play-sessions.md) are files this directive creates; both are marked New in its scope table. Robert 2026-11-09 21:21 ET: 'I permanently approve all of your recommendations', and asked for these to be added to the queue.
- 2026-11-09 21:42 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-playloop-p0-repoint-directive; lane=default; model=swe-2-high; perm=accept-edits; persona=steady-builder; agent_id=01M71NAWM42VPDPRCY62Q6GES8
<!-- queue:end -->
