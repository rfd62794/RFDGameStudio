import { useState } from 'react';
import type { GameRendererProps } from '../../../engine/types';
import { MenuShell, OptionSelectGroup } from '../../../components';
import ReefPreview from './ReefPreview';

export interface StartConfig {
  initial_fish: number;
  initial_sharks: number;
  initial_algae_hubs: number;
  seed: number | string | null;
}

export interface TitleScreenProps {
  session: GameRendererProps['session'];
  onStart: (config: StartConfig) => void;
}

interface Scenario {
  value: string;
  title: string;
  subtitle: string;
  fish: number;
  sharks: number;
  hubs: number;
}

const SCENARIOS: Scenario[] = [
  { value: 'balanced', title: 'Balanced Reef', subtitle: '60 fish / 8 sharks / 6 hubs', fish: 60, sharks: 8, hubs: 6 },
  { value: 'sparse', title: 'Sparse Reef', subtitle: '30 fish / 4 sharks / 4 hubs', fish: 30, sharks: 4, hubs: 4 },
  { value: 'frenzy', title: 'Feeding Frenzy', subtitle: '50 fish / 16 sharks / 5 hubs', fish: 50, sharks: 16, hubs: 5 },
  { value: 'lush', title: 'Lush Garden', subtitle: '70 fish / 4 sharks / 10 hubs', fish: 70, sharks: 4, hubs: 10 },
];

export default function TitleScreen({ session, onStart }: TitleScreenProps) {
  const [selectedScenario, setSelectedScenario] = useState('balanced');

  const current = SCENARIOS.find((s) => s.value === selectedScenario)!;

  const startWithScenario = (scenario: Scenario, seed: number | string | null) => {
    onStart({
      initial_fish: scenario.fish,
      initial_sharks: scenario.sharks,
      initial_algae_hubs: scenario.hubs,
      seed,
    });
  };

  return (
    <MenuShell
      gameTitle="SHOAL"
      subtitle="A living reef simulation"
      ctaLabel="Start Game"
      onCta={() => startWithScenario(current, null)}
      heroSlot={<ReefPreview session={session} />}
      classNames={{
        shell: 'shoal-title-shell',
        inner: 'shoal-title-inner',
        titleWrap: 'shoal-title-wrap',
        title: 'shoal-title-h1',
        subtitle: 'shoal-title-subtitle',
        grid: 'shoal-title-grid',
        cta: 'shoal-title-cta',
        launchBtn: 'shoal-title-launch-btn',
      }}
    >
      <div className="shoal-title-card">
        <OptionSelectGroup
          label="Scenario"
          options={SCENARIOS.map((s) => ({ value: s.value, title: s.title, subtitle: s.subtitle }))}
          selected={selectedScenario}
          onSelect={setSelectedScenario}
          classNames={{
            group: 'shoal-title-section',
            label: 'shoal-title-label',
            row: 'shoal-scenario-row',
            btn: 'shoal-scenario-btn',
            btnActive: ' shoal-scenario-btn--active',
            title: 'shoal-scenario-title',
            sub: 'shoal-scenario-sub',
          }}
        />
        <div className="shoal-title-seed-actions">
          <button
            className="shoal-title-seed-btn"
            onClick={() => startWithScenario(current, Math.floor(Math.random() * 0xFFFFFFFF))}
          >
            🎲 Random Seed
          </button>
          <button
            className="shoal-title-seed-btn"
            onClick={() => startWithScenario(current, 'daily')}
          >
            📅 Today's Reef
          </button>
        </div>
        <p className="shoal-title-hint">
          Same seed reproduces the starting reef. The simulation itself is not seeded.
        </p>
      </div>
    </MenuShell>
  );
}
