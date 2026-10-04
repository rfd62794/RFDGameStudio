# dissonance_prototype scope analysis (2026-10-03, Sonnet scope agent, registry status: external, Origin of dissonance)
Direction: preserved AI Studio (Gemini API) core-loop prototype that became Dissonance Depths, shown as history (ts/src/games/dissonance_prototype/config.ts:3-7,11,16). Tier A only (polish standard rule 1).
Working:
- Source is tracked: examples/dissonance-prototype/ (src/App.tsx plus about 13 components such as CombatHand.tsx, MapGraphView.tsx; whitelisted at .gitignore:200).
- Registered with supersededBy: 'dissonance' (registry.ts:31,85; config.ts:11).
- Blurb says what it is and what it became (config.ts:12).
Rough:
- 404 live at /games/dissonance-prototype/ and /arcade/dissonance_prototype/ (docs/state/demo-audit-batch1-2026-10-03.md:34, finding 1): A1, A3, A4, A8 fail.
- Blurb leaks a repo path (config.ts:12; audit finding 8).
- No test file under examples/dissonance-prototype (git ls-files grep "test": none); README is the generic AI Studio text (README.md:5-20).
Class: refine - Origin entry; the only work is making it publish or deliberately unlisting it.
Top 3 changes, in order: 1. Publish the build to /arcade/dissonance_prototype/ via the normal deploy path (embedUrl, config.ts:17), or record a decision to unregister. 2. Drop the repo path from the blurb. 3. Confirm Start/restart and phone fit once live.
Out of scope: gameplay changes, merging with Dissonance Depths, new features, TS-native rewrite.
Dependencies / risks: needs a built dist and `studio_deploy_arcade` (deploy is a separate confirmed step); why it 404s was not investigated (site export not inspected).
Effort: S
Open question for Robert: none
