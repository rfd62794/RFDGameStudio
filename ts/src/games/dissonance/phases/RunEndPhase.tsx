import { EndStateScreen } from '../../../ui/components';
import type { RunState } from '../types';

interface RunEndPhaseProps {
  run: RunState;
  onReturnToTitle: () => void;
}

export default function RunEndPhase({ run, onReturnToTitle }: RunEndPhaseProps) {
  const won = run.status === 'victory';

  return (
    <EndStateScreen
      id="viewport-run-end-phase"
      won={won}
      headline={won ? 'Stability Achieved' : 'Run Failed'}
      flavorLine={
        won
          ? 'You held the station together long enough for the resonance to stabilize.'
          : 'The dissonance collapsed your run into static.'
      }
      stats={[
        { label: 'Final Essence', value: run.essence },
        { label: 'Floors Reached', value: run.currentFloor },
        { label: 'Turns Taken', value: run.turnCount },
      ]}
      onRestart={onReturnToTitle}
      restartLabel="Return to Title"
    />
  );
}
