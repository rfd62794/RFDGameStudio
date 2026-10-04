// new: ts/src/games/dissonance/components/FirstCombatHint.tsx
import { useState } from 'react';
import { Panel, Button } from '../../../ui/components';
import { loadSave, writeSave } from '../../../engine/shared/persistence';

/** localStorage key: set once the player has dismissed the hint, so it shows only on the first fight ever. */
export const COMBAT_HINT_SEEN_KEY = 'dissonance_combat_hint_seen';

export default function FirstCombatHint() {
  const [visible, setVisible] = useState<boolean>(() => loadSave<boolean>(COMBAT_HINT_SEEN_KEY) !== true);

  if (!visible) return null;

  const dismiss = () => {
    writeSave(COMBAT_HINT_SEEN_KEY, true);
    setVisible(false);
  };

  return (
    <Panel padding="sm">
      <div
        id="dissonance-first-combat-hint"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}
      >
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text)' }}>
          Pick a card to play it. Every card pairs two elements, and how they relate (same, neighbouring or opposed)
          shapes what the card does. Try different cards and watch the enemy's health.
        </span>
        <Button id="dissonance-first-combat-hint-dismiss" label="Got it" onClick={dismiss} variant="primary" size="sm" />
      </div>
    </Panel>
  );
}
