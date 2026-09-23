import { Sparkles, Play, RotateCcw } from 'lucide-react';
import { TitleScreen } from '../../../ui/components';

interface TitlePhaseProps {
  hasSave: boolean;
  onNewRun: () => void;
  onContinue: () => void;
}

export default function TitlePhase({ hasSave, onNewRun, onContinue }: TitlePhaseProps) {
  return (
    <TitleScreen
      id="viewport-title-phase"
      title="Dissonance"
      tagline={
        <>
          <Sparkles style={{ width: '0.875rem', height: '0.875rem' }} />
          Card-Combination Roguelike
        </>
      }
      pitch="A card-combination roguelike. Descend the floors of a dying station, floor by floor, run by run."
      quote="Please piece me back together, every floor costs us something."
      menuItems={[
        {
          id: 'new-run',
          label: 'New Run',
          icon: <Play style={{ width: '1rem', height: '1rem', fill: 'currentColor' }} />,
          onClick: onNewRun,
          variant: 'primary',
        },
        ...(hasSave
          ? [
              {
                id: 'continue',
                label: 'Continue',
                icon: <RotateCcw style={{ width: '1rem', height: '1rem' }} />,
                onClick: onContinue,
                variant: 'secondary' as const,
              },
            ]
          : []),
      ]}
    />
  );
}
