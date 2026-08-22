# ADR-006: GameShell Adoption and Audience Progressive Disclosure

**Date:** August 22, 2026
**Status:** Accepted — two independent fixes, both verified against real
precedent in other games (`chimera_wilds`, `planetofgreed`) rather than
invented from scratch.

## Context

Two real, unrelated problems in Succession's presentation layer:

**Problem 1 — hand-rolled shell chrome, no scroll fix.** `App.tsx`
rendered its own root (`min-h-screen ... flex flex-col`) with a
hand-rolled sticky `<header>` (`components/SegmentHeader.tsx`)
containing a duplicate "SUCCESSION" title and its own back-button-free
chrome, instead of using the shared `GameShell` component
(`ts/src/components/GameShell.tsx`) that every other arcade game uses.
Confirmed by direct read of `chimera_wilds/App.tsx` and
`planetofgreed/App.tsx`: both wrap every real view branch (title,
playing, end-state) in `<GameShell>`, passing `mode`/`arcadeBaseUrl`
derived from `import.meta.env`, and both use
`mainClassName="game-shell-main--scrollable"` specifically because
`GameShell`'s default `.game-shell-main` sets `overflow: hidden`
(`ts/src/ui/base.css`) — the arcade shell's `.arcade-game-content` is
also `overflow: hidden`. Without the scrollable modifier, any view
taller than the viewport is silently clipped with no way to reach the
rest of it. Succession's hand-rolled root had no equivalent scroll
mechanism.

**Problem 2 — AudienceStage renders five full approach panels
simultaneously.** `components/AudienceStage.tsx` rendered Whisper,
Appeal, Evidence, Indictment, and Discredit as five always-expanded
cards stacked vertically with no way to collapse any of them — a wall
of interactive UI on every visit to a councilor's antechamber,
regardless of which approach the player actually intends to use.

## Decision

### GameShell adoption

All three of `App.tsx`'s real view branches (title, playing, verdict)
now return through `<GameShell>`, matching the exact prop pattern used
by `chimera_wilds`/`planetofgreed`:

- `gameLabel="Succession"`, `gameId="succession"` — GameShell now owns
  the single marquee title and the single arcade-level back button.
- `phase="The Council of Three"` — static flavor subtitle, matching the
  intent of the text this replaces.
- `mode`/`arcadeBaseUrl` derived from `import.meta.env.VITE_STANDALONE`
  / `VITE_ARCADE_BASE_URL`, identical to the real precedent files.
- `mainClassName="game-shell-main--scrollable"` on every branch — the
  real fix for the clipping bug, not a cosmetic choice.
- `statusArea={<SegmentHeader segment={gameState.segment} />}` on the
  playing branch only (title/verdict have no segment to show).

`components/SegmentHeader.tsx` was rewritten to render only real status
content (Segment progress dots, "2 of 3 Councils needed by Midnight",
the current segment/time badge, and the final-segment warning) as a
plain fragment, dropping its own `<header>` wrapper, sticky
positioning, and the duplicate "SUCCESSION" / "The Council of Three"
title text now owned by `GameShell`'s `gameLabel`/`phase` props.

`AudienceStage.tsx`'s own "Step Back to Grand Chamber" button was
**not** touched — direct inspection confirms it is real in-game
navigation (`PlayStage` transition from `'audience'` back to
`'chamber'`), not arcade-level shell chrome, and is entirely distinct
from `GameShell`'s single arcade-back link. Removing it would break a
real, necessary in-game action.

### Audience progressive disclosure

`AudienceStage.tsx` now owns a single `expandedApproach: ApproachId |
null` state (initialized to `null` — collapsed by default). Selecting
any approach's header replaces whichever approach was previously
expanded; there is never more than one expanded at a time. The
transition itself is a pure, exported function —
`nextExpandedApproach(current, selected)` in the new
`utils/approachDisclosure.ts` — so it can be tested directly rather
than only through DOM interaction.

`WhisperPanel.tsx`, `EvidencePanel.tsx`, and `IndictmentPanel.tsx` each
gained `isExpanded: boolean` and `onToggle: () => void` props. Their
existing header row (icon, title, real cost/risk badge) became a
clickable button with a `ChevronDown` indicator; their existing body
content (previously always rendered) is now conditionally rendered
behind `{isExpanded && (...)}`. The Appeal and Discredit actions
(previously inline JSX in `AudienceStage.tsx` with no separate
component) got the identical treatment directly inline. No panel's
real cost/risk information was removed or genericized — the same real
badges (`"High Sway (+20) | Zero-Sum Faction Friction (-4)"`,
`"Decisive Proof (+40) | High Stakes Perjury Risk"`, etc.) remain
visible even while collapsed, since they live in the always-visible
header row.

**Real numbering bug fixed as part of this change:** `IndictmentPanel.tsx`
and the inline Discredit card were both labeled "Approach 4" before
this directive — a genuine pre-existing collision, not something this
directive introduced. Discredit is now labeled "Approach 5."

The two-column `md:grid-cols-2` grid that previously held Appeal and
Evidence side-by-side was replaced with a single vertical stack for all
five approaches — a collapsed card and an expanded card have very
different real heights, and a 2-column grid forces the shorter cell to
match the taller one's height, which looks broken once collapse/expand
is introduced.

## Testing

`tests/test_succession_gameshell_and_disclosure.ts` — 7 tests, two
groups:

**GameShell adoption (4 tests)** — structural checks against the real
`App.tsx` source (not a rendered snapshot, since no DOM-rendering
dependency like `@testing-library/react` is present in this project):
imports `GameShell` from the shared module; all three real view
branches render through `<GameShell>`; `mainClassName="game-shell-main--scrollable"`
is present on every one of the three usages (the real fix, checked
directly rather than assumed); the old arcade-level back button text is
gone while `AudienceStage`'s real in-game "Step Back to Grand Chamber"
navigation is confirmed still present and still wired.

**Progressive disclosure (3 tests)** — exercise the exact
`nextExpandedApproach` function `AudienceStage.tsx` calls from
`toggleApproach`, not a reimplementation: starts at `null` (collapsed
by default, checked directly against the component's own
`useState<ApproachId | null>(null)` call); selecting a second approach
while a first is expanded replaces it (`expect(expanded).not.toBe(
'whisper')` after selecting `'evidence'` — the real regression this
guards is an accidental `Set`-based implementation that would allow
both to remain expanded); and a full 5-approach selection sequence
holds the "exactly one expanded" invariant at every step, with
re-selecting the last one collapsing back to `null`.

`npx tsc --noEmit` clean. **1451/1451** tests pass across the full
suite (1444 pre-existing + 7 new); the 127 pre-existing Succession
tests are unmodified and still pass.

### Manual verification

No screenshot/vision tool is available in this environment. A live dev
server + browser preview was handed to the user to confirm visually
that the segment status header no longer clips at any real viewport
height, and that only one Audience approach panel expands at a time.

## Consequences

### What changed

- `App.tsx` — `GameShell` import and wrapping on all three view
  branches; `mode`/`arcadeBaseUrl` derived the same way as
  `chimera_wilds`/`planetofgreed`
- `components/SegmentHeader.tsx` — rewritten as a `statusArea` fragment,
  dropped own `<header>`/sticky positioning/duplicate title
- `components/AudienceStage.tsx` — `expandedApproach` state,
  `toggleApproach` delegating to `nextExpandedApproach`; Appeal and
  Discredit cards gained inline collapse toggles; approach numbering
  fixed (Discredit is now "Approach 5")
- `components/WhisperPanel.tsx`, `components/EvidencePanel.tsx`,
  `components/IndictmentPanel.tsx` — gained `isExpanded`/`onToggle`
  props, header converted to a toggle button, body conditionally
  rendered
- `utils/approachDisclosure.ts` — new, exports `ApproachId` and
  `nextExpandedApproach`
- `tests/test_succession_gameshell_and_disclosure.ts` — new, 7 tests

### What did NOT change

- `TitleScreen.tsx`, `VerdictScreen.tsx` — untouched. They are now
  rendered as children of `GameShell` (wrapping happens in `App.tsx`
  only), which incidentally gives them the same scroll fix without
  editing their own source.
- No engine/orchestration file touched — `gameOrchestration.ts`,
  `favor.ts`, `verdict.ts`, `rivalAI.ts`, `origins.ts` are all
  unrelated to this directive and untouched.
- No real cost/risk information was hidden or removed from any
  approach — collapsing only hides the *action* body (option grids,
  execute buttons), never the header's real badge numbers.
- No new npm dependency added.
