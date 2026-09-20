# Shared UI, wave 1: the three published games with no way out

## 1. Why these three, and why now

Robert's direction, 2026-09-20: refactor existing demos toward compatible, reusable UI components.
This is the first wave, chosen because it fixes a live defect rather than tidying code.

**Measured state of the studio's UI, 2026-09-20:**

- `ts/src/ui/components/` is a real 14-component library: Badge, Button, Card, EmptyState,
  EndStateScreen, ErrorBox, Modal, MoreGamesByMe, OnboardingGate, Panel, ProgressIndicator,
  StatBar, TabBar, TitleScreen.
- **13 games import from it.** 23 games with a `config.ts` do not.
- `ts/src/components/GameShell.tsx` has 14 consumers and is the studio's proven shell.

**The defect.** `gladiator_arena`, `house_of_kings_collab` and `voiddrift_redux` are all **published
on the live arcade** and all three contain **zero** files matching `GameShell`, `navigateHome`,
`isEmbed`, "All games" or "Arcade". Verified by grep across each game's directory. A player who
opens any of them has no way back to the arcade — they are stuck until they hit the browser's back
button.

That is a live, user-facing bug on three shipped games, and the fix is adopting the shell the other
14 games already use.

## 2. Scope — three games, in this order

```
ts/src/games/gladiator_arena/
ts/src/games/house_of_kings_collab/
ts/src/games/voiddrift_redux/
```

Do not touch any other game. Do not modify `GameShell.tsx` or anything in `ts/src/ui/components/`
unless a genuine gap blocks you — and if one does, say so in your report rather than working around
it silently.

**Read first:** `docs/superpowers/specs/2026-09-20-shared-ui-and-logic-plan.md`, and
`ts/src/games/shoal/App.tsx` as a worked example of a game that adopts the shell correctly.

## 3. What to do per game

1. **Adopt `GameShell`.** Its existing props — `headerExtra`, `statusArea`, `footer` — already cover
   what these games' bespoke Navbar and Header components do. Move their chrome into those props
   rather than nesting a custom header inside the shell.
2. **Verify the arcade exit actually works**, which is the point of the whole exercise: from inside
   the running game there must be a visible, working route back to the arcade.
3. **Replace bespoke equivalents with the shared primitives** where the game hand-rolls something
   the library already has — a button, a card, a badge, a panel, a modal, a stat bar. One-for-one
   swaps only.

## 4. What NOT to unify — read this before you start deleting

**Do not unify palettes or visual identity.** Each game sets its own colours and must keep them.
`gladiator_arena`'s amber and stone palette sits close to retired Brewfield's, and a chrome
unification pass is exactly how a palette bleed happens by accident. Games that differ in feel
should differ in look; you are unifying *structure*, not *style*.

**Do not touch log or event-history panels.** Six games render what looks like the same scrollable
list of timestamped strings, and they are not the same: four incompatible field sets, and
`gladiator_arena`'s log array actually drives combat animation timing rather than display. Leave all
of them alone. This one looks like the most obvious shared component in the studio and is the most
dangerous.

**Do not change game logic, balance, or state shape.** This is a presentation refactor. If a UI swap
would require touching logic, stop and report it.

## 5. Verification, per game

Behaviour must be unchanged except for gaining the arcade exit:

- the game still starts, plays a turn, and reaches its end state
- its palette and visual identity are unchanged — compare before and after
- the arcade exit is present and navigates correctly
- `npm run build` (or the game's own build script per AGENTS.md) succeeds

Say plainly in your report what you verified by running versus by reading. "It compiles" is not
"it plays".

## 6. Rules for this run

- **Write only inside this worktree.** Never `%TEMP%`, never `/tmp`. Scratch goes in `.devin-scratch/`.
- **Do not delete anything.** `rm` is not permitted in a headless run and ends it silently. Replacing
  a bespoke component means editing the file that uses it; leave orphaned files in place and list
  them in your report.
- **One shell command at a time.** No `&&` or `;` chains, no `$(...)`, no heredocs, no `cat` piped
  into a command.
- Commit per game, with a plain single-line message: `git commit -m "one line"`.
- No servers, no long-running processes, no `npm run dev`.
- Never merge, rebase onto, or push to `main`.
- If a command is refused, **stop immediately** and report Blocked with the refused command.

## 7. Completion criteria

- [ ] All three games use `GameShell` and have a working arcade exit.
- [ ] Bespoke duplicates of existing shared primitives are replaced, one for one.
- [ ] No palette or visual identity changed.
- [ ] No log or event-history panel touched.
- [ ] No game logic, balance or state shape changed.
- [ ] Each game builds, and you state which you actually ran.
- [ ] Three commits, one per game.

## 8. Report

Per game: what you swapped, what you deliberately left bespoke and why, what you verified by running.
Any gap in `ui/components` or `GameShell` that made a swap awkward — those are the next extractions,
so name them precisely. And say whether the arcade-exit defect was as described for all three.

<!-- check: git status --porcelain -->
<!-- outputs: ts/src/games/gladiator_arena/App.tsx; ts/src/games/house_of_kings_collab/App.tsx; ts/src/games/voiddrift_redux/App.tsx -->

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | - |
| Branch | - |
| Base branch | - |

**Status log**
<!-- queue:end -->
