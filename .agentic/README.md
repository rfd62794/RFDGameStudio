# .agentic/ scripts - usage notes

Three scripts operate on bible/games/{game}/:

- expand_game_bible.py --game <slug> --title ... --core-loop ... --win-condition ... --loss-condition ... --theme ...
  Creates a new bible/games/<slug>/ folder with index.md + gdd.md.
- validate_gdd.py --game <slug>
  Validates bible/games/<slug>/gdd.md's frontmatter against schemas/gdd.schema.json.
- sync_gdd_to_memory.py --game <slug>
  Reads bible/games/<slug>/gdd.md's frontmatter and writes it to RFD Memory MCP
  at key rfdgamestudio:<slug>_gdd, with source="openclaw-rfdgamestudio-bible"
  explicitly set (do not rely on the memory service's default source - it
  silently tags unlabeled writes as "claude" regardless of actual caller).

## IMPORTANT: <slug> is the bible FOLDER name, not the frontmatter game field

These are allowed to differ and currently do for voiddrift:
- Bible folder: bible/games/voiddrift/
- Frontmatter game: field inside gdd.md: "voiddrift-redux-core-loop" (an
  examples/ prototype folder name, kept for provenance/traceability)

All three --game arguments above take the FOLDER name (voiddrift), never
the frontmatter value. Passing the frontmatter value will fail with
FileNotFoundError since no such bible folder exists.

## Source tagging convention

Any future script that writes to RFD Memory MCP (port 8007) must explicitly
set "source" in its payload - never rely on the service's default. Use a
value that identifies the actual writer, e.g. "openclaw-<script-purpose>",
not "claude" unless a real Claude session is genuinely the writer.