// new: ts/src/games/succession/components/ConfirmButton.tsx
import { useEffect, useState } from 'react';
import { Button } from '../../../ui/components';

interface ConfirmButtonProps {
  id: string;
  label: string;
  /** Shown after the first click; a second click within 3 seconds confirms. */
  confirmLabel: string;
  onConfirm: () => void;
}

/** Two-click button: the first click arms it, the second confirms, and it disarms itself after 3 seconds. */
export default function ConfirmButton({ id, label, confirmLabel, onConfirm }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  const handleClick = () => {
    if (armed) {
      setArmed(false);
      onConfirm();
    } else {
      setArmed(true);
    }
  };

  return (
    <Button
      id={id}
      label={armed ? confirmLabel : label}
      onClick={handleClick}
      variant={armed ? 'danger' : 'neutral'}
      size="sm"
    />
  );
}
