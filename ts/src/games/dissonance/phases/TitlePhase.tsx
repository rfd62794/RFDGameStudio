import { Sparkles, Play, RotateCcw } from 'lucide-react';
import { Button, TitleScreen } from '../../../ui/components';

interface TitlePhaseProps {
  hasSave: boolean;
  onNewRun: () => void;
  onContinue: () => void;
  /** Opens the original prototype this game grew from. Omit to hide the link. */
  onOpenOrigin?: () => void;
}

export default function TitlePhase({ hasSave, onNewRun, onContinue, onOpenOrigin }: TitlePhaseProps) {
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
    >
      {onOpenOrigin && (
        <Button id="dissonance-origin-link" label="Where Dissonance began" onClick={onOpenOrigin} variant="neutral" size="sm" />
      )}
    </TitleScreen>
  );
}
