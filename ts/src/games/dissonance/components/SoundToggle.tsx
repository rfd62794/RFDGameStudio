// new: ts/src/games/dissonance/components/SoundToggle.tsx
import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '../../../ui/components';
import { isSoundMuted, setSoundMuted } from '../utils/soundPrefs';

/** Mute button for the header. The choice is remembered between visits. */
export default function SoundToggle() {
  const [muted, setMuted] = useState<boolean>(isSoundMuted);

  const toggle = () => {
    const next = !muted;
    setSoundMuted(next);
    setMuted(next);
  };

  return (
    <Button
      id="dissonance-sound-toggle"
      icon={muted ? <VolumeX style={{ width: '1rem', height: '1rem' }} /> : <Volume2 style={{ width: '1rem', height: '1rem' }} />}
      onClick={toggle}
      variant="neutral"
      size="sm"
      title={muted ? 'Unmute sound' : 'Mute sound'}
    />
  );
}
