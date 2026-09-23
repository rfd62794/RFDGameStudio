import { Trophy, Skull } from 'lucide-react';
import { EndStateScreen } from '../../../ui/components';
import type { RunStats } from '../types';

interface GameOverScreenProps {
  won: boolean;
  stats: RunStats;
  onRestart: () => void;
}

export default function GameOverScreen({ won, stats, onRestart }: GameOverScreenProps) {
  return (
    <EndStateScreen
      id="game-over-container"
      won={won}
      headline={won ? 'Run Cleared!' : 'Dissolved...'}
      flavorLine={
        won
          ? 'You successfully navigated the 9 Cauldron Floors and cleansed the ancient Rootbound Guardian!'
          : 'Your physical matrix collapsed under the volatile pressure of the Cauldron Hall.'
      }
      stats={[
        { label: 'Enemies Cleansed', value: `${stats.enemiesDefeated} / 4` },
        { label: 'Brews Synthesized', value: stats.brewsCreated },
        { label: 'Total Damage Dealt', value: `${stats.totalDamageDealt} HP` },
        { label: 'Aura Shields Warded', value: `${stats.totalShieldGained} HP` },
        { label: 'Vitality Mended', value: `${stats.totalHealed} HP` },
        {
          label: 'Volatility Gambles',
          value: (
            <>
              <span style={{ color: 'var(--green)' }}>{stats.volatileSuccesses} ⚡</span>
              {' / '}
              <span style={{ color: 'var(--red)' }}>{stats.volatileFails} 💨</span>
            </>
          ),
        },
      ]}
      onRestart={onRestart}
      restartLabel="Brew Again"
      wonIcon={<Trophy style={{ width: '3rem', height: '3rem', fill: 'currentColor', opacity: 0.15 }} />}
      lostIcon={<Skull style={{ width: '3rem', height: '3rem', fill: 'currentColor', opacity: 0.15 }} />}
    />
  );
}
