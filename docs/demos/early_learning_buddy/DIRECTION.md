# early_learning_buddy direction (2026-10-04)
## What it tried to be
A voice-powered learning companion for young children: practice letters, numbers and words by speaking, a fuzzy matcher accepts approximate pronunciations, AI-generated story beats reward progress, stars and characters persist, parents get settings and can request characters. It arrived whole on 2026-08-15 in a commit titled "add backend dependencies" (`767b8ca1`: express, firebase, @google/genai, monitoring), i.e. it was imported as a finished AI Studio project, not grown in this repo. `config.ts` says it is "intentionally unlisted from the public arcade", and the board row classes it `separate_infrastructure` (`ts/src/status/board.data.ts:100`). It never was an arcade game; it is a different product living in the games folder.
## Where it is now
- Not in the registry (`ts/src/games/registry.ts:12` excludes it by glob); no embed, no page, no audit row (batch2 excludes it).
- 3,152 lines of ts/tsx: PracticeCard 605, CharacterVisual 421, RequestCharacterModal 368, PlaygroundScene 314, App 283, audio 250, server 178.
- Needs a server: `App.tsx:72` fetches `/api/generate-story`, `server/server.ts` calls Gemini; a static build cannot serve it, and the failure path only logs (`App.tsx:95`).
- Tests exist for the archetype matcher and audio (`test_early_learning_buddy_archetype_matcher.ts`, `_audio.ts`, added through the 09-23 auto-untested directives).
- Persistence via shared module since `b5940844` (ADR-014); last functional change 2026-08-15; board row says `active`, config says `dev`: they disagree.
- No privacy or consent text found for microphone use by children.
## Player experience today vs the target
Target audience is children plus a parent; the arcade's "inviting for game players" test does not apply. First 60 s cannot be verified (no live page, needs microphone and server). Best moment (by design): a child says a letter and gets a star. Biggest turn-off, for anyone who ever ships it: a child's microphone and an LLM call with no consent or failure path. Way back: none, it is outside the cabinet.
## Verdict
**PARK.**
1. Its own config states it stays unlisted, and it needs a Gemini server plus children's data handling, which a solo, no-servers studio should not run.
2. It is a separate product by origin and by board classification; it does not belong in the arcade's roadmap or polish tiers.
3. Nothing is broken for anyone today, so parking costs nothing; polishing it costs real legal and ops surface.
## Replan
1. Record it (S). ADD: a "tier N/A, parked" line in its SCOPE row and fix the board row to say parked (reason: board `active` contradicts `config.ts`). CUT: nothing. Verify: `grep -n early_learning ts/src/status/board.data.ts` shows `parked`; registry test still passes.
2. Only if Robert wants it published (L, not scheduled): move it to its own repo with its own server decision and a privacy review first; do not add it to the arcade. CUT from the arcade repo after the move (reason: one home per product). Verify: out of scope until asked.
## First three directives
1. early_learning_buddy: set the board row to parked and add a SCOPE "N/A" line. S. Depends: none.
2. early_learning_buddy: replace the console-only story-fetch failure with a visible fallback message (only if it is ever shown to anyone). S. Depends: Robert wants it live.
3. early_learning_buddy: privacy and microphone consent review of `utils/speech.ts` and the server env handling. S, review only. Depends: Robert wants it live.
## Open question for Robert
Is this a product you intend to ship (then it gets its own repo and server decision) or a private experiment? Recommended default: private, parked.
