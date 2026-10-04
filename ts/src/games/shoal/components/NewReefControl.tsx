// new: ts/src/games/shoal/components/NewReefControl.tsx
import { Button } from '../../../ui/components';

export default function NewReefControl({ onNewReef }: { onNewReef: () => void }) {
  return (
    <Button
      id="shoal-new-reef"
      label="New Reef"
      onClick={onNewReef}
      variant="neutral"
      size="sm"
    />
  );
}
