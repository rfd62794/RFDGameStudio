import React, { useState } from 'react';
import { RunState, DeckCard } from '../types';
import { computeDeckPowerLevel, computeLiveDifficultyMultiplier } from '../utils';
import { executeTurnResolution } from '../logic/combatResolution';
import EnemyIntentDisplay from '../components/EnemyIntentDisplay';
import CombatHand from '../components/CombatHand';

interface CombatPhaseProps {
  runState: RunState;
  setRunState: React.Dispatch<React.SetStateAction<RunState | null>>;
  onFightWon: (isBoss: boolean) => void;
  onDone: (won: boolean) => void;
}

export default function CombatPhase({
  runState,
  setRunState,
  onFightWon,
  onDone
}: CombatPhaseProps) {
  const [phase2Triggered, setPhase2Triggered] = useState<boolean>(false);
  const [phase3Triggered, setPhase3Triggered] = useState<boolean>(false);

  const activeDeckCardIds = runState?.deckCardIds || (runState?.deckState
    ? [...runState.deckState.drawPile, ...runState.deckState.hand, ...runState.deckState.discard].map(c => c.cardId)
    : []);

  const [liveDifficultyMultiplier] = useState(() => {
    if (!runState) return 1.0;
    const deckPower = computeDeckPowerLevel(activeDeckCardIds);
    return computeLiveDifficultyMultiplier(deckPower, runState.playerHp, runState.playerMaxHp);
  });

  if (!runState || !runState.enemy) return null;

  const handlePlayCard = (playedCard: DeckCard) => {
    if (runState.status !== 'combat' || !runState.enemy) return;

    const res = executeTurnResolution({
      playedCard,
      runState,
      liveDifficultyMultiplier,
      phase2Triggered,
      phase3Triggered
    });

    setPhase2Triggered(res.phase2Triggered);
    setPhase3Triggered(res.phase3Triggered);
    setRunState(res.nextState);

    if (res.fightWon === true) {
      onFightWon(res.isBoss);
    } else if (res.fightWon === false) {
      onDone(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl relative" id="viewport-combat">
      <EnemyIntentDisplay
        runState={runState}
        liveDifficultyMultiplier={liveDifficultyMultiplier}
      />

      <CombatHand
        deckState={runState.deckState}
        boons={runState.boons || []}
        enemy={runState.enemy}
        onPlayCard={handlePlayCard}
      />
    </div>
  );
}
