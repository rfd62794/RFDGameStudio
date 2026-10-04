# antsim_redux scope analysis (2026-10-03, Sonnet scope agent, registry status: external)
Direction: top-down ant colony simulation with pheromone signaling, direct food sensing, emergent population dynamics (ts/src/games/antsim_redux/config.ts:7). Grown through Phase 4g to two colonies, tunnels, brood care, Lanchester combat, infiltration (examples/antsim-redux/docs/state/current.md:1,9). The roadmap calls it the most AI-rich external demo and a TS-native port "real, substantial future work" (docs/RFDGameStudio_DemoPortingRoadmap.md:62,110-112).
Working:
- Deep simulation split into modules (src/simulation.ts 928 lines, tunnel_network.ts, colony_lifecycle.ts, combat.ts); tests/simulation.test.ts is 3,674 lines.
- Controls: Reset, Pause, 1x/2x/5x speed (src/App.tsx:147,258-261; docs/state/demo-audit-batch1-2026-10-03.md:28).
- Live: 0 console errors, A1/A3/A5 pass (batch1:28).
Rough:
- On phone the in-frame content is 394 px wide in a 374 px frame, so A4 and A8 fail (batch1:28, finding 3).
- No dedicated test in ts/tests and no build script in ts/package.json (batch1:28 "none dedicated", "none"); the example's tests run inside the example only.
- It is a spectator sim with no goal or end state found (grep of App.tsx for win/extinct/goal: none), so Tier B6 (end screens) would need a direction.
Class: refine - external embed, Tier A only until a TS-native rewrite is chosen (polish standard rule 3; wave 2 candidate, spec section 4).
Top 3 changes, in order: 1. Fix the 394 px overflow so the canvas fits a 374 px frame (A4/A8). 2. Add a one-line "what you are watching" intro and keep Reset visible. 3. Add a small check that the example builds and `tests/simulation.test.ts` passes under the studio runner, or record it as example-only.
Out of scope: TS-native rewrite, new colony mechanics, goals/scoring, art, multi-colony balance, Gemini features (README.md:18 is generic setup text).
Dependencies / risks: source is example-only (examples/antsim-redux whitelisted at .gitignore:199); rewrite would depend on the shared aiBehavior adapter work and is a separate L decision.
Effort: S
Open question for Robert: none
