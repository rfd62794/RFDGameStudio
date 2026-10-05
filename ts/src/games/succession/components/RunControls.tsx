// new: ts/src/games/succession/components/RunControls.tsx
import ConfirmButton from './ConfirmButton';

interface RunControlsProps {
  onRestart: () => void;
  onBackToTitle: () => void;
}

/** In-play controls: start the same origin again, or leave the run for the title screen. */
export default function RunControls({ onRestart, onBackToTitle }: RunControlsProps) {
  return (
    <>
      <ConfirmButton
        id="succession-restart-run"
        label="Restart run"
        confirmLabel="Restart this run?"
        onConfirm={onRestart}
      />
      <ConfirmButton
        id="succession-back-to-title"
        label="Back to title"
        confirmLabel="Leave this run?"
        onConfirm={onBackToTitle}
      />
    </>
  );
}
