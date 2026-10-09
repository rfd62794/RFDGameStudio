// new: ts/src/games/shoal/components/RotateHint.tsx
import { useEffect, useState } from 'react';
import { shouldShowRotateHint } from '../utils/rotateHint';

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

/** A small dismissible card shown only on portrait phones. Never blocks the reef. */
export default function RotateHint() {
  const [viewport, setViewport] = useState(readViewport);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!shouldShowRotateHint(viewport, dismissed)) return null;
  return (
    <div className="shoal-rotate-hint" data-testid="shoal-rotate-hint" role="status">
      <span>Turn your phone sideways for a wider reef.</span>
      <button type="button" className="shoal-rotate-hint-dismiss" onClick={() => setDismissed(true)}>
        Got it
      </button>
    </div>
  );
}
