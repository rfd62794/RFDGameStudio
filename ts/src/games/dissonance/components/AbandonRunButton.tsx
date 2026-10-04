// new: ts/src/games/dissonance/components/AbandonRunButton.tsx
import { useEffect, useState } from 'react';
import { Button } from '../../../ui/components';

interface AbandonRunButtonProps {
  onAbandon: () => void;
}

export default function AbandonRunButton({ onAbandon }: AbandonRunButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  const handleClick = () => {
    if (armed) {
      onAbandon();
    } else {
      setArmed(true);
    }
  };

  return (
    <Button
      id="dissonance-abandon-run"
      label={armed ? 'Confirm abandon?' : 'Abandon run'}
      onClick={handleClick}
      variant={armed ? 'danger' : 'neutral'}
      size="sm"
    />
  );
}
