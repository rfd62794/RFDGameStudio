# early_learning_buddy scope analysis (2026-10-03, Sonnet scope agent, registry status: NOT registered; config status dev, intentionally unlisted)
Direction: voice-powered learning companion for young learners, deliberately kept out of the public arcade (ts/src/games/early_learning_buddy/config.ts:4-7,11). Points at a private/unlisted project, not a portfolio card.
Working:
- Persists stars/characters via shared persistence (App.tsx:44-51,147-155).
- Speech recognition wrapper with feature check (utils/speech.ts:16); archetype fuzzy matcher with tests (ts/tests/test_early_learning_buddy_archetype_matcher.ts, test_early_learning_buddy_audio.ts).
- Parent settings and character-request flows exist (components/ParentSettingsModal.tsx, RequestCharacterModal.tsx).
Rough:
- Needs a server: App.tsx:72 fetches /api/generate-story and server/server.ts:5,124 calls Gemini; a static arcade build cannot serve this. The failure path only logs (App.tsx:95).
- Not in registry.ts (no import), so no audit row and no live page (docs/state/demo-audit-batch2-2026-10-03.md:6 excludes it).
- Audience is children with a microphone; no privacy/consent text found in the files read (App.tsx, utils/speech.ts).
Class: refine - nothing to rebuild; the stated intent is to stay unlisted.
Top 3 changes, in order: 1. Leave unregistered and record that in the scorecard row (tier N/A). 2. If ever published, a story-fetch failure must degrade visibly, not just console.error (App.tsx:95). 3. Review mic/child-data handling before any publish.
Out of scope: registering it, deploying the Gemini server, new characters/art, new voice features, any publication.
Dependencies / risks: Gemini key plus Express server (server/server.ts); children's data and mic are sensitive; server/.env handling not read.
Effort: S
Open question for Robert: none (config.ts:4-7 already states it stays unlisted)
Tier: N/A, parked (2026-10-04, Robert's approval of the PARK verdict). Not in the registry, not polished, not published; the code stays in ts/src/games/early_learning_buddy.
