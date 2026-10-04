# slimegarden scope analysis (2026-10-03, Sonnet scope agent, registry status: external, Origin)
Direction: frozen origin of SlimeWorld, shown as history, not a competing game (ts/src/games/slimegarden/config.ts:3-8, supersededBy line 11; docs/adr/ADR-023-legacy-origin-projects-type.md). Source is an AI Studio export (examples/slimegarden/README.md:5-9), 1299-line App.tsx.
Working:
- Iframe loads at /arcade/slimegarden/, 0 console errors, Origin tag (audit batch2 line 23).
- Labelled "Reset" (examples/slimegarden/src/App.tsx:707-712) and localStorage save (App.tsx:46,494).
- config.ts description is 31 words and honest about being an origin (config.ts:12).
Rough:
- Phone overflow: iframe scrollWidth 476 > 368 at 390px (audit batch2 line 43). Cause not isolated; one candidate is the decorative w-[500px] blob at App.tsx:652 (unverified, not tested).
- examples/slimegarden/README.md is AI Studio boilerplate asking for a GEMINI_API_KEY that does not apply (README.md:14-16).
- No tests and no build:<id> script in ts/package.json (external demos are exempt from A6 only; A7 still applies).
Class: refine. Origin entries get Tier A only (polish standard section 2, rule 1).
Top 3 changes: 1. Fix the 390px horizontal overflow in examples/slimegarden (A4); 2. Confirm the card still reads "(Origin)" and links the live SlimeWorld (A8); 3. Add a screenshot to the arcade manifest (A5, audit shows n/v).
Out of scope: any gameplay change, porting to TS, merging features from slimeworld, edits to examples/slimeworld, Tier B/C.
Dependencies / risks: examples/* is gitignored except what is force-tracked (.gitignore:193; slimegarden is tracked on main), so confirm the fix lands in the tracked tree; until slimeworld's deploy bug is fixed (see docs/demos/slimeworld/SCOPE.md) the live /arcade/slimeworld/ is this same build.
Effort: S
Open question for Robert: none
