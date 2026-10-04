import { Button, EndStateScreen } from '../../../ui/components';
import type { RunState } from '../types';

interface RunEndPhaseProps {
  run: RunState;
  onReturnToTitle: () => void;
  onNewRun: () => void;
}

export default function RunEndPhase({ run, onReturnToTitle, onNewRun }: RunEndPhaseProps) {
  const won = run.status === 'victory';

  return (
    <>
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
        onRestart={onNewRun}
        restartLabel="New Run"
      />
      <Button
        id="dissonance-return-title"
        label="Return to Title"
        onClick={onReturnToTitle}
        variant="secondary"
      />
    </>
  );
}
