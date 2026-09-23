CRITICAL: Output ONLY the JSON object. No prose, no markdown fences, no explanation. Start with { and end with }.

EXAMPLE of a correct, high-quality SessionPlan:
{
  "recommended": {
    "label": "Headlong",
    "title": "Combat Polish Pass",
    "rationale": "M8 is the active milestone. Combat polish is the highest-value unblocked task. Low risk, high visibility.",
    "tasks": [
      "Fix floating damage numbers in src/apps/dungeon/scenes/combat_scene.py",
      "Add hero portrait render to active combat slot",
      "Run pytest — target 408 passing",
      "Commit: polish: dungeon combat — damage numbers, hero portrait"
    ],
    "risk": "Low",
    "milestone_impact": "M8 — Dungeon Crawler Frame"
  },
  "alternatives": [
    {
      "label": "Divert",
      "title": "Milestone Triage",
      "rationale": "Archivist found two Active tasks with no linked Milestone. Fixing this removes planning debt and corrects the APJ corpus for future sessions.",
      "tasks": [
        "Read TASKS.md Active section — identify the two unlinked tasks",
        "Check MILESTONES.md Active — find appropriate milestone or create one",
        "Update MILESTONES.md and cross-reference TASKS.md",
        "Run python -m src.tools.apj session start — verify Archivist no longer flags it"
      ],
      "risk": "Low",
      "milestone_impact": "M10 — Portfolio Pass (planning hygiene)"
    },
    {
      "label": "Alt",
      "title": "APJ Handoff Integration",
      "rationale": "Wire the last Archivist report into the handoff block. Smaller scope, high leverage — every future session starts with context.",
      "tasks": [
        "Read src/tools/apj/journal.py get_handoff()",
        "Load last archivist report from docs/session_logs/",
        "Append session_primer to handoff output",
        "Add test: test_handoff_includes_archivist_primer"
      ],
      "risk": "Low",
      "milestone_impact": "M3 — APJ Toolchain Live (enhancement)"
    }
  ],
  "open_questions": [
    "Should the combat polish target M8 completion this session or is a partial polish acceptable?",
    "Is the milestone triage Divert a prerequisite before any feature work, or can it run parallel?"
  ],
  "archivist_risks_addressed": [
    "Two Active tasks with no corresponding Active Milestone — addressed by Divert option"
  ],
  "corpus_hash": ""
}
