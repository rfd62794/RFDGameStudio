import { useState } from 'react';
import type { GameRendererProps } from '../../../engine/types';
import { TitleScreen as SharedTitleScreen } from '../../../ui/components';
import { OptionSelectGroup } from '../../../components';
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
  onHowToPlay: () => void;
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

export default function TitleScreen({ session, onStart, onHowToPlay }: TitleScreenProps) {
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
    <div className="shoal-title-shell">
      <ReefPreview session={session} />
      <SharedTitleScreen
        title="Shoal"
        tagline="A living reef simulation"
        pitch="Fish graze, sharks hunt, and algae rises and sinks with the pressure of grazing. You tend the water column — the reef runs itself."
        menuItems={[
          {
            id: 'shoal-start-reef',
            label: 'Start Reef',
            variant: 'primary',
            onClick: () => startWithScenario(current, null),
          },
          {
            id: 'shoal-how-to-play',
            label: 'How to Play',
            variant: 'secondary',
            onClick: onHowToPlay,
          },
        ]}
        className="shoal-title-shared"
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
      </SharedTitleScreen>
    </div>
  );
}
