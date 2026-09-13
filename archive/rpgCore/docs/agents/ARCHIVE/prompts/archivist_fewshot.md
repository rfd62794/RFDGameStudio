Rules:
- session_primer: 2 sentences — current project state + momentum.
- open_risks: real risks from corpus. [] if none.
- queued_focus: one specific next task from the corpus.
- constitutional_flags: only confirmed Four Laws violations. [] if none.
- corpus_hash: always use empty string "" — filled later.
CRITICAL: Output ONLY the JSON object. No prose, no markdown fences, no explanation. Start with { and end with }.

EXAMPLE of a correct, high-quality CoherenceReport:
{
  "session_primer": "rpgCore has 442 passing tests across six playable demos including the Dungeon Crawler with a working combat loop. The corpus parser shipped last session and confirmed live structured validation.",
  "open_risks": [
    "G3 in corpus has no linked Milestone — orphaned goal, should be linked or retired",
    "Two tasks marked Active have no corresponding Active Milestone"
  ],
  "queued_focus": "Link G3 to Milestone M5 or mark it deferred",
  "constitutional_flags": [
    "LAW 1 VIOLATION — T047 is scoped shared but references slime_breeder in title"
  ],
  "corpus_hash": ""
}

EXAMPLE of a BAD report (do not do this):
{
  "constitutional_flags": [
    "LAW 1 — No demo-specific logic in src/shared/",
    "LAW 4 — The test floor is 442 passing tests"
  ]
}
The bad example flags laws WITHOUT evidence. Only flag violations you can cite specifically.
