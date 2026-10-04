# dissonance_prototype scope analysis (2026-10-03, Sonnet scope agent, registry status: external, Origin, supersededBy dissonance)
Direction: preserved Origin project, not a competing game: the AI Studio core-loop prototype behind Dissonance Depths (ts/src/games/dissonance_prototype/config.ts:3-7,11-14; docs/adr/ADR-023-legacy-origin-projects-type.md:83; docs/RFDGameStudio_DemoPortingRoadmap.md:43). Origin entries get Tier A only (docs/superpowers/specs/2026-10-03-demo-polish-standard.md section 2 rule 1).
Working:
- Source is in the repo: examples/dissonance-prototype/ (package.json "build": "vite build" line 8, src/App.tsx, src/components/).
- Registry wiring is honest: supersededBy, status external, embedUrl '/arcade/dissonance_prototype/' (config.ts:11,14,17).
- The source makes no Gemini call (grep of src/ for GEMINI/GoogleGenAI finds nothing), so an embed needs no API key.
Rough:
- Not live: /games/dissonance-prototype/ returns 404 (audit batch1:11,34,69), so A1, A3, A4, A8 fail.
- Description leaks a repo path to players (config.ts:12; audit batch1:54,76).
- config.ts:5 and ADR-023:18 say the source is tmp/dissonance-src/, but it lives in examples/dissonance-prototype/: stale reference.
Class: refine - frozen history; only publishing and labelling are in play.
Top 3 changes, in order: 1. Build examples/dissonance-prototype and publish it at /arcade/dissonance_prototype/ so the card and iframe load (A1, A8). 2. Strip the repo path from the description and keep the "Origin" label honest (A5, A8). 3. Fix the stale source-location comment and ADR note.
Out of scope: gameplay changes or bug fixes, merging with Dissonance Depths, un-superseding, new features, any TS-native rewrite.
Dependencies / risks: why the site export omitted this embed is unknown (I did not read the site pipeline); how other Origin embeds (corpworld) are built is unverified; blurb word count is 27 (audit batch1:54).
Effort: S
Open question for Robert: none
Decision 2026-10-04 (Robert approved all recommendations): FOLD-INTO dissonance. The registry entry stays (external, supersededBy) as a labelled Origin exhibit, and Dissonance's title links to it ("Where Dissonance began"). The home-grid treatment (hide the card, or keep the labelled card as Slimebreeder does) is decided in the site repo.
Phone layout: framed (an AI Studio export with a fixed layout).
