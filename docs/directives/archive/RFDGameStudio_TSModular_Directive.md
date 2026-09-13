# RFDGameStudio — Phase TS-Modular: UI Consistency + Types Extraction

*June 2026 | Structural refactor. No behavior changes. Read fully before executing.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Must report **86 passed, 0 failed** (pytest) and **39 passed, 0 failed** (vitest).
> If counts differ, stop and report — do not proceed.

---

## §0 Context

Four games are now certified in RFDGameStudio. The shared infrastructure
(`hooks/`, `ui/components/`, `engine/`) exists but is not consistently used
across all games. This phase closes three gaps:

1. **Modal consistency** — `ui/Modal.tsx` exists but games use custom overlay
   divs. All modals should use the shared component.
2. **Modal forced-pick support** — `ui/Modal.tsx` currently always shows a
   close (✕) button. Some modals (CardSelect) must not be dismissible. Needs
   `showClose` prop.
3. **horse_racing types** — horse_racing-specific types live in `engine/types.ts`
   alongside engine-level types. Should be extracted to a local `types.ts` for
   consistency with the other three games.

**No behavior changes.** No canvas refactoring. No new hooks. Pure structural.

---

## §1 Scope

| File | Action |
|---|---|
| `ts/src/ui/components/Modal.tsx` | Add `showClose?: boolean` prop (default `true`) |
| `ts/src/ui/components/index.ts` | Verify `Modal` is exported |
| `ts/src/games/horse_racing/types.ts` | CREATE — extract horse-specific types |
| `ts/src/games/slither_rogue/components/EvolutionModal.tsx` | READ first → if custom div, replace with `ui/Modal` |
| `ts/src/games/slither_rogue/components/GameOverModal.tsx` | READ first → if custom div, replace with `ui/Modal` |
| `ts/src/games/slime_coin/components/CardSelectModal.tsx` | READ first → if custom div, replace with `ui/Modal` |
| `ts/src/games/mutant_battle_ball/components/MatchCanvas.tsx` | Replace inline sub-modal div with `ui/Modal` |

**Read-only — do not touch:**
`engine/types.ts` (do not remove types from it — only add re-export),
`hooks/`, `engine/`, canvas components, `App.tsx` files, `data.yaml`,
`logic.lua`, all Python files.

---

## §2 Implementation

### Step 1: Update `ui/Modal.tsx`

Add `showClose?: boolean` prop. When `showClose` is false, omit the ✕ button
and do not close on overlay click.

```typescript
interface ModalProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;      // optional when showClose is false
  showClose?: boolean;       // default: true
}

export function Modal({ title, children, onClose, showClose = true }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={showClose ? onClose : undefined}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          {showClose && onClose && (
            <button className="btn-dismiss" onClick={onClose}>✕</button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
```

> ⚠️ RULE: `onClose` becomes optional when `showClose` is false. TypeScript
> should not require `onClose` for forced-pick modals.

---

### Step 2: Verify `ui/components/index.ts` exports Modal

Check that `Modal` is exported from `ui/components/index.ts`. If not, add it.
Do not change any other exports.

---

### Step 3: Create `games/horse_racing/types.ts`

READ `engine/types.ts` first. Identify which types are horse_racing-specific
(not used by other games or the engine itself). These are candidates:
`Horse`, `CurrentRace`, `RaceHistoryEntry`, `RaceResult`, `Bet`,
`RaceParticipant`, `GameState` (horse_racing's game state).

**Action:** Create `ts/src/games/horse_racing/types.ts` that re-exports those
types from `engine/types.ts`.

```typescript
// types.ts — horse_racing game types
// Re-exported from engine/types for consistency with other games
export type {
  Horse,
  CurrentRace,
  RaceHistoryEntry,
  RaceResult,
  Bet,
  RaceParticipant,
  GameState,
} from '../../engine/types';
```

> ⚠️ RULE: Do NOT remove these types from `engine/types.ts`. Only add the
> re-export file. `horse_racing/App.tsx` imports from `engine/types` today —
> do NOT change those imports. This is additive only.

> ⚠️ RULE: If any of those type names conflict with engine-level types (e.g.
> `GameState` is used by other games too), use a type alias:
> `export type { GameState as HorseRacingState } from '../../engine/types'`
> and note the alias in a comment.

---

### Step 4: Audit and update slither_rogue modals

**READ** `EvolutionModal.tsx` and `GameOverModal.tsx` before touching them.

**If they use a custom overlay div:**
Replace the outer overlay div with `ui/Modal`. Import `Modal` from
`'../../../ui/components'`. Keep all inner content as `children`.

- `EvolutionModal`: player must pick an evolution — use `showClose={false}`,
  no `onClose` required.
- `GameOverModal`: player can close/restart — use `showClose={true}` with
  existing `onClose` prop.

**If they already use `ui/Modal`:** No change needed. Document this in the
completion report.

---

### Step 5: Audit and update SlimeCoin CardSelectModal

**READ** `CardSelectModal.tsx` before touching it.

**If it uses a custom overlay div:**
Replace with `ui/Modal`. Card selection is mandatory — use `showClose={false}`,
no `onClose`.

```typescript
import { Modal } from '../../../ui/components';

export default function CardSelectModal({ cards, onSelect }: CardSelectModalProps) {
  return (
    <Modal title="Choose a Card" showClose={false}>
      {/* existing card list content */}
    </Modal>
  );
}
```

**If it already uses `ui/Modal`:** No change needed.

---

### Step 6: Replace MatchCanvas inline sub-modal

In `MatchCanvas.tsx`, the inline sub-modal block:

```tsx
{showSubModal && (
  <div className="sub-modal-overlay">
    <div className="sub-modal">
      <h3>Mutant Down</h3>
      ...
    </div>
  </div>
)}
```

Replace with `ui/Modal`:

```tsx
import { Modal } from '../../../ui/components';

{showSubModal && (
  <Modal title="Mutant Down" showClose={false}>
    <p>Choose a bench replacement or continue without substitution.</p>
    <button onClick={() => {
      call('resume_match');
      setShowSubModal(false);
      setDownAgentId(null);
    }}>Continue Without Sub</button>
  </Modal>
)}
```

> ⚠️ RULE: Keep all existing logic (call, setState, setDownAgentId) intact.
> Only replace the div structure with Modal. Do not touch the timeout button
> or any other MatchCanvas logic.

---

## §3 Verification Steps

After all changes:

1. Run `npx vitest run` — must report **39 passed, 0 failed** (or higher if
   new tests added).
2. Run `pytest -v` — must report **86 passed, 0 failed**.
3. Load each game in the browser and verify modals open and close correctly:
   - horse_racing: no change expected
   - slither_rogue: EvolutionModal opens on evolution event, GameOverModal
     opens on death
   - slime_coin: CardSelectModal opens after round with no close button
   - mutant_battle_ball: sub-modal opens when agent goes down, no close button

---

## §4 Completion Criteria

- [ ] `pytest -v` → 86/0/0 (unchanged)
- [ ] `npx vitest run` → 39/0/0 (unchanged)
- [ ] `ui/Modal.tsx` has `showClose` prop
- [ ] `games/horse_racing/types.ts` exists with re-exports
- [ ] `engine/types.ts` unchanged (types not removed)
- [ ] All modal components use `ui/Modal` — no custom overlay divs
- [ ] CardSelectModal and EvolutionModal have no close button
- [ ] GameOverModal and MatchCanvas sub-modal behavior unchanged
- [ ] No canvas components touched
- [ ] No App.tsx files touched
- [ ] No Lua files touched

---

## §5 What This Phase Does NOT Do

- No `useCanvas` hook — canvas patterns differ per game, abstraction not warranted
- No canvas component changes
- No new game features
- No Python changes
- No changes to `engine/types.ts` content (only addition of re-export file)
