import { useState } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { GameShell } from '../../components';
import { TitleScreen } from '../../ui/components';
import App from './App';
import { clearSandboxSave } from './simulation/sandboxSave';

export default function TitleGate(props: GameRendererProps) {
  const [screen, setScreen] = useState<'title' | 'play'>('title');
  const [runKey, setRunKey] = useState<number>(0);

  if (screen === 'title') {
    return (
      <GameShell
        gameLabel="GrainWorks"
        gameId="grainworks"
        phase="GRAINWORKS"
        className="bg-[#070913] text-slate-200 font-sans"
      >
        <TitleScreen
          title="GrainWorks"
          tagline="Drop it. Catch it. Build on it."
          pitch="Sand, gas and glowing crystals fall through a tiny space station. Catch the debris, pipe it through machines, and grow a little factory that remembers the universe."
          menuItems={[
            {
              id: 'sandbox-start',
              label: 'Start Building',
              variant: 'primary',
              onClick: () => setScreen('play'),
            },
          ]}
        />
      </GameShell>
    );
  }

  return (
    <App
      key={runKey}
      {...props}
      onRestart={() => {
        clearSandboxSave();
        setRunKey((k) => k + 1);
        setScreen('title');
      }}
    />
  );
}
