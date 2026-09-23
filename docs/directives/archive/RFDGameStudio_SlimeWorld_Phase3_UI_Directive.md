# RFDGameStudio — SlimeWorld Phase 3: UI Layer (`ui.yaml`)

*July 15 2026 (night) | Vehicle: Windsurf/Devin | Final file of the 4-file port — closes `studio_validate_game`'s only remaining gap*

---

> ⛔ **STOP:** This is the fourth and final file. Standard components
> ONLY this phase — no custom rendering components, no SlimeDex wheel.
> That's real, separate, later work (Phase 4), explicitly deferred per
> tonight's own design discussion. Use `horse_racing/ui.yaml` as the
> literal template — it's the closest working precedent in the repo
> (tabbed layout, card grids, breed selector, action buttons wired to
> real Lua function names), confirmed by direct read tonight.
> `chimera_wilds/ui.yaml` was also checked and is a bare stub — not a
> useful reference, don't use it as a model.

**Read-only — do not touch:** `data.yaml`, `logic.lua`, `systems.yaml`
— all three fully verified tonight. This phase only adds `ui.yaml`.

---

## §0 Context

**What this closes:** `studio_validate_game("slimeworld")` has
reported "only missing `ui.yaml`" consistently, every check tonight —
meaning `data.yaml`, `logic.lua`, and `systems.yaml` are already
structurally sound. This phase is the last piece for a fully validating
native RFDGameStudio game.

**Real precedent, confirmed by direct read tonight:** `horse_racing/ui.yaml`
uses a `layout_tree` (dimensional layout) + `regions` (component type
mapping) + `tabs` (per-tab content) structure. Component vocabulary
already proven working: `label`, `stat_display`, `stat_bar`, `badge`,
`card_grid`/`horse_card_grid`, `action_button`, `breed_selector`,
`breed_preview`. Action buttons bind an `event` name directly to a
real Lua function — e.g., `event: breed_horses` — the exact same
pattern SlimeWorld's `initiate_breeding`, claim actions, etc. need.

**Explicitly deferred to Phase 4, not this phase:** the SlimeDex wheel
(procedural polygon rendering, Turing-pattern texture overlay, custom
`SlimeDexWheel` component referenced the way `horse_racing` references
`component: SVGRacer` for its race track). This phase's Codex tab is a
plain list, not the wheel.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `ui.yaml` | Create | New file, standard components only |
| `data.yaml`, `logic.lua`, `systems.yaml` | Read-only | No changes |

---

## §2 Tab Structure

Four tabs, mirroring `horse_racing`'s proven shape, adapted to
SlimeWorld's actual verified action hooks:

### Lab tab (roster + breeding — direct analog to Stable + Breed)

```yaml
lab:
  content:
    - type: stat_display
      label: "TREASURY"
      field: game_state.credits
      format: currency
    - type: stat_display
      label: "ROSTER"
      field: game_state.slimes
      format: "{value.length} / {game_state.roster_cap}"
    - type: card_grid
      data_source: game_state.slimes
      card_template: slime_card
      empty_state: "No slimes in roster."

  slime_card:
    components:
      - type: label
        field: slime.name
        style: card_title
      - type: badge
        field: slime.color
      - type: badge
        field: slime.generation
        format: "GEN {value}"
      - type: stat_bar
        label: "Hue"
        field: slime.hue
        max: 360
      - type: stat_bar
        label: "Saturation"
        field: slime.saturation
        max: 100
      - type: stat_bar
        label: "Vertex Count"
        field: slime.vertex_count
        max: 22
      - type: stat_bar
        label: "Irregularity"
        field: slime.irregularity
        max: 100
      - type: stat_bar
        label: "Diffusion Ratio"
        field: slime.diffusion_ratio
        max: 100
      - type: stat_bar
        label: "Amplitude"
        field: slime.amplitude
        max: 100
      - type: action_button
        label: "Sell"
        event: sell_on_market
        data: slime.id

  breeding:
    - type: breed_selector
      label: "Select Parent A"
      data_source: game_state.slimes
      selection_event: select_parent_a
    - type: breed_selector
      label: "Select Parent B"
      data_source: game_state.slimes
      selection_event: select_parent_b
    - type: action_button
      label: "Breed"
      event: initiate_breeding
      requires: [parent_a_selected, parent_b_selected, roster_not_full]
```

### Planet tab (claims + exploration + mediation + garrison)

```yaml
planet:
  content:
    - type: card_grid
      data_source: game_state.planet_region.nodes
      card_template: node_card
      empty_state: "No planetary sectors discovered."

  node_card:
    components:
      - type: label
        field: node.name
        style: card_title
      - type: badge
        field: node.owner_color
        values: {null: "Unclaimed"}
      - type: stat_bar
        label: "Strength"
        field: node.strength
        max: 1
      - type: action_button
        label: "Force Claim"
        event: force_claim_action
        data: node.id
      - type: action_button
        label: "Bribe"
        event: bribe_claim_action
        data: node.id
      - type: action_button
        label: "Convert"
        event: convert_claim_action
        data: node.id
      - type: action_button
        label: "Assign Garrison"
        event: assign_garrison
        data: node.id
        requires: [node_owned]
```

> ⚠️ RULE: `force_claim_action`, `bribe_claim_action`,
> `convert_claim_action`, `assign_garrison` all require additional
> parameters beyond `node.id` (party selection, credits amount,
> relationship value) per their real Lua signatures. Confirm the
> actual UI flow for gathering those inputs — a single button binding
> is not sufficient for `bribe_claim_action`, which needs a
> `credits_spent` value. Do not silently drop required parameters to
> make the binding simpler; report back on how this was actually
> resolved.

### Economy tab (contracts, market, upgrades)

```yaml
economy:
  content:
    - type: list
      label: "Active Contracts"
      data_source: game_state.contracts
      item_template: contract_item
      empty_state: "No active contracts."
    - type: action_button
      label: "Upgrade Capacity (150g)"
      event: buy_upgrade
      data: "capacity"
    - type: action_button
      label: "Upgrade Stabilizer (200g)"
      event: buy_upgrade
      data: "stabilizer"
    - type: action_button
      label: "Install Autofeeder (250g)"
      event: buy_upgrade
      data: "autofeeder"
      requires: [not_already_owned]

  contract_item:
    components:
      - type: label
        field: contract.name
      - type: label
        format: "Reward: {contract.credits_reward}g"
      - type: label
        format: "Expires in {contract.cycles_remaining} cycles"
      - type: action_button
        label: "Deliver"
        event: deliver_contract
        data: contract.id
```

### Codex tab (discovered targets — plain list, NOT the wheel)

```yaml
codex:
  content:
    - type: label
      text: "Discovered Color Targets"
      style: section_title
    - type: list
      data_source: game_state.discovered_color_targets
      item_template: codex_entry
    - type: label
      text: "Discovered Shape Targets"
      style: section_title
    - type: list
      data_source: game_state.discovered_shape_targets
      item_template: codex_entry
    - type: label
      text: "Discovered Accent Targets"
      style: section_title
    - type: list
      data_source: game_state.discovered_accent_targets
      item_template: codex_entry

  codex_entry:
    components:
      - type: label
        field: target.name
      - type: label
        field: target.tier
```

> ⚠️ RULE: `game_state.discovered_color_targets` /
> `discovered_shape_targets` / `discovered_accent_targets` — check
> whether this tracking exists anywhere in the current `logic.lua`/
> `data.yaml`. If it doesn't, this tab has nothing real to bind to yet.
> Report this explicitly rather than inventing a tracking mechanism
> as a side effect of a UI directive — that's real logic-layer scope
> creeping into what's supposed to be a UI-only phase.

---

## §3 Verification

- [ ] Paste `studio_validate_game("slimeworld")` full output — should
      now report fully valid, not just "missing ui.yaml"
- [ ] Confirm every `event:` binding in the file names a real,
      existing Lua function — grep-check each one against `logic.lua`,
      paste the list of event names checked and confirm all matched
- [ ] Explicitly report how the multi-parameter claim actions
      (bribe amount, garrison target, etc.) were resolved in the UI
      flow — not just that the button exists
- [ ] Explicitly report whether discovered-target tracking exists;
      if not, the Codex tab's data sources are placeholders — say so
      plainly, don't paper over it
- [ ] Confirm `data.yaml`, `logic.lua`, `systems.yaml` unmodified —
      diff, not description

---

## §4 Completion Criteria

- [ ] `ui.yaml` created, four tabs (Lab, Planet, Economy, Codex)
- [ ] All `event` bindings verified against real Lua functions
- [ ] `studio_validate_game("slimeworld")` reports fully valid
- [ ] No custom rendering components — standard vocabulary only,
      confirmed via review of the file
- [ ] Multi-parameter action gaps explicitly reported, not silently resolved
- [ ] Codex data-source reality explicitly reported

---

## §5 Quick Reference

| Item | Status |
|---|---|
| Template | `horse_racing/ui.yaml` (proven, closest structural match) |
| Do not use as template | `chimera_wilds/ui.yaml` (bare stub) |
| Tabs | Lab, Planet, Economy, Codex |
| Custom components this phase | None — SlimeDex wheel explicitly deferred to Phase 4 |
| Expected `studio_validate_game` result post-phase | Fully valid — closes the 4-file port |
