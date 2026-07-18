import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { detectLifecycles } from '../tools/framework_gen/lifecycle_detector';
import { crossReferenceManifest, generateLifecycleReport } from '../tools/framework_gen/lifecycle_report';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const LUA_PATH = resolve(REPO_ROOT, 'games/slimeworld/logic.lua');
const MANIFEST_PATH = resolve(REPO_ROOT, 'docs/slimegarden_recovery_manifest.md');
const SOURCE_PATH = resolve(REPO_ROOT, 'intake/slimegarden/extracted/src/gameLogic.ts');

const luaText = readFileSync(LUA_PATH, 'utf8');
const manifestText = readFileSync(MANIFEST_PATH, 'utf8');
const sourceText = readFileSync(SOURCE_PATH, 'utf8');

// Synthetic pre-fix Lua: launch functions set active_X with status="active"
// but NO resolution code exists (no = nil, no status transition).
// This reproduces the exact real bug shape from before tonight's fixes.
const SYNTHETIC_PRE_FIX_LUA = `
function launch_dispatch(state, zone_id, slime_ids)
  state.active_dispatch = { id = "dispatch", zone_id = zone_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_dispatch
end

function launch_exploration(state, node_id, slime_ids)
  state.active_exploration = { id = "exploration", target_node_id = node_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_exploration
end

function launch_mediation(state, node_id, slime_ids)
  state.active_mediation = { id = "mediation", target_node_id = node_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_mediation
end

function advance_cycle(state, color_specs)
  state.cycle = state.cycle + 1
  return state
end
`;

// Synthetic with Pattern A (full clear) only — mimics exploration/mediation
const SYNTHETIC_PATTERN_A_LUA = `
function launch_exploration(state, node_id, slime_ids)
  state.active_exploration = { id = "exploration", target_node_id = node_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_exploration
end

function advance_cycle(state, color_specs)
  if state.active_exploration and state.active_exploration.status == "active" then
    local exploration = state.active_exploration
    -- ... resolution logic ...
    state.active_exploration = nil
  end
  return state
end
`;

// Synthetic with Pattern B (status transition) only — mimics dispatch's intended contract
const SYNTHETIC_PATTERN_B_LUA = `
function launch_dispatch(state, zone_id, slime_ids)
  state.active_dispatch = { id = "dispatch", zone_id = zone_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_dispatch
end

function advance_cycle(state, color_specs)
  if state.active_dispatch and state.active_dispatch.status == "active" then
    state.active_dispatch.status = "completed"
  end
  return state
end

function retrieve_completed_dispatch(state)
  local dispatch = state.active_dispatch
  if dispatch == nil or dispatch.status ~= "completed" then return nil, "No completed dispatch" end
  state.active_dispatch = nil
  return dispatch, nil
end
`;

// Synthetic with a genuinely unresolved field (no completion anywhere)
const SYNTHETIC_UNRESOLVED_LUA = `
function launch_scouting(state, node_id, slime_ids)
  state.active_scouting = { id = "scouting", target_node_id = node_id, slime_ids = slime_ids, cycles_remaining = 2, status = "active" }
  return state.active_scouting
end

function advance_cycle(state, color_specs)
  state.cycle = state.cycle + 1
  return state
end
`;

// Synthetic with a field that has no matching manifest entry
const SYNTHETIC_NO_MANIFEST_LUA = `
function launch_something(state, x, y)
  state.active_something = { id = "something", target = x, items = y, status = "active" }
  return state.active_something
end

function advance_cycle(state, color_specs)
  state.cycle = state.cycle + 1
  return state
end
`;

describe('Lifecycle Completeness Detector', () => {
  it('test_detects_real_known_pattern_retroactively', () => {
    // The load-bearing test: run against synthetic pre-fix Lua that reproduces
    // the exact bug shape — all three launch functions set status="active"
    // but nothing ever clears or transitions them.
    const result = detectLifecycles('synthetic_pre_fix.lua', SYNTHETIC_PRE_FIX_LUA);

    expect(result.findings.length).toBe(3);

    const fieldNames = result.findings.map(f => f.fieldName);
    expect(fieldNames).toContain('active_dispatch');
    expect(fieldNames).toContain('active_exploration');
    expect(fieldNames).toContain('active_mediation');

    // All three must be flagged
    for (const finding of result.findings) {
      expect(finding.status).toBe('POTENTIALLY_UNRESOLVED_LIFECYCLE');
      expect(finding.completions.length).toBe(0);
    }

    expect(result.flaggedCount).toBe(3);
    expect(result.resolvedCount).toBe(0);
  });

  it('test_pattern_a_full_clear_recognized_as_resolved', () => {
    // A field using the Exploration/Mediation clear-to-nil pattern
    // must be correctly recognized as RESOLVED, not flagged.
    const result = detectLifecycles('synthetic_pattern_a.lua', SYNTHETIC_PATTERN_A_LUA);

    const exploration = result.findings.find(f => f.fieldName === 'active_exploration');
    expect(exploration).toBeTruthy();
    expect(exploration!.status).toBe('RESOLVED');
    expect(exploration!.completions.length).toBeGreaterThan(0);
    expect(exploration!.completions.some(c => c.pattern === 'full_clear')).toBe(true);
  });

  it('test_pattern_b_status_transition_recognized_as_resolved', () => {
    // A field using Dispatch's mark-completed pattern must be correctly
    // recognized as RESOLVED, not flagged.
    const result = detectLifecycles('synthetic_pattern_b.lua', SYNTHETIC_PATTERN_B_LUA);

    const dispatch = result.findings.find(f => f.fieldName === 'active_dispatch');
    expect(dispatch).toBeTruthy();
    expect(dispatch!.status).toBe('RESOLVED');
    expect(dispatch!.completions.length).toBeGreaterThan(0);
    // Should find either the status transition or the nil clear (or both)
    const hasStatusTransition = dispatch!.completions.some(c => c.pattern === 'status_transition');
    const hasFullClear = dispatch!.completions.some(c => c.pattern === 'full_clear');
    expect(hasStatusTransition || hasFullClear).toBe(true);
  });

  it('test_genuinely_unresolved_field_is_flagged', () => {
    // A deliberately-broken synthetic case must be correctly flagged.
    const result = detectLifecycles('synthetic_unresolved.lua', SYNTHETIC_UNRESOLVED_LUA);

    const scouting = result.findings.find(f => f.fieldName === 'active_scouting');
    expect(scouting).toBeTruthy();
    expect(scouting!.status).toBe('POTENTIALLY_UNRESOLVED_LIFECYCLE');
    expect(scouting!.completions.length).toBe(0);
    expect(scouting!.launchSite.functionName).toBe('launch_scouting');
    expect(scouting!.launchSite.initialStatus).toBe('active');
  });

  it('test_cross_reference_finds_real_manifest_entry', () => {
    // For active_dispatch, the manifest should have resolveDispatch
    const result = detectLifecycles(LUA_PATH, luaText);
    const dispatch = result.findings.find(f => f.fieldName === 'active_dispatch');
    expect(dispatch).toBeTruthy();

    const xref = crossReferenceManifest(dispatch!, manifestText, sourceText);
    expect(xref.status).toBe('MATCHED');
    expect(xref.manifestEntry).toBeTruthy();
    expect(xref.manifestEntry!.name).toBe('resolveDispatch');
    expect(xref.sourceLocation).toBeTruthy();
    expect(xref.sourceLocation).toContain('line');
  });

  it('test_no_matching_entry_reported_honestly', () => {
    // A synthetic field with no real manifest match must report
    // NO_MATCHING_MANIFEST_ENTRY, not a guessed near-miss.
    const result = detectLifecycles('synthetic_no_manifest.lua', SYNTHETIC_NO_MANIFEST_LUA);
    const something = result.findings.find(f => f.fieldName === 'active_something');
    expect(something).toBeTruthy();

    const xref = crossReferenceManifest(something!, manifestText, sourceText);
    expect(xref.status).toBe('NO_MATCHING_MANIFEST_ENTRY');
    expect(xref.manifestEntry).toBeNull();
    expect(xref.sourceLocation).toBeNull();
  });

  it('test_report_includes_real_line_numbers', () => {
    // Every flagged case must have real, verifiable line references.
    const result = detectLifecycles('synthetic_unresolved.lua', SYNTHETIC_UNRESOLVED_LUA);
    const scouting = result.findings.find(f => f.fieldName === 'active_scouting');
    expect(scouting).toBeTruthy();

    // Launch site must have a real line number
    expect(scouting!.launchSite.lineNumber).toBeGreaterThan(0);
    expect(scouting!.launchSite.lineNumber).toBeLessThanOrEqual(SYNTHETIC_UNRESOLVED_LUA.split('\n').length);

    // Verify the line number actually points to the launch line
    const lines = SYNTHETIC_UNRESOLVED_LUA.split('\n');
    const launchLine = lines[scouting!.launchSite.lineNumber - 1];
    expect(launchLine).toContain('state.active_scouting');
    expect(launchLine).toContain('status = "active"');

    // Near-misses should also have real line numbers
    for (const miss of scouting!.nearMisses) {
      expect(miss).toMatch(/^Line \d+:/);
    }
  });
});
