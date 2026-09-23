import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Sparkles, MousePointer, Keyboard, HelpCircle,
  ShieldAlert
} from 'lucide-react';
import type { GameSession } from '../../../engine/types';
import type { HighScore } from '../types';
import { MenuShell, OptionSelectGroup } from '../../../components';

interface MainMenuProps {
  session: GameSession;
  onStartGame: (settings: {
    controlType: 'mouse' | 'keyboard';
    playerColor: string;
    playerHeadColor: string;
    gameDuration: number;
  }) => void;
}

const COLOR_PRESETS = [
  { name: 'Electric Teal', color: '#14b8a6', headColor: '#06b6d4' },
  { name: 'Toxic Lime', color: '#84cc16', headColor: '#a3e635' },
  { name: 'Cyber Purple', color: '#a855f7', headColor: '#c084fc' },
  { name: 'Amber Fury', color: '#f59e0b', headColor: '#fbbf24' },
  { name: 'Rose Phantom', color: '#f43f5e', headColor: '#f472b6' },
];

const DURATIONS = [
  { label: '2 Mins', seconds: 120, sub: 'Quickie' },
  { label: '5 Mins', seconds: 300, sub: 'Standard' },
  { label: 'Endless', seconds: 999999, sub: 'Chill' },
];

export default function MainMenu({ onStartGame }: MainMenuProps) {
  const [controlType, setControlType] = useState<'mouse' | 'keyboard'>('mouse');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [gameDuration, setGameDuration] = useState(300);
  const [highScores, setHighScores] = useState<HighScore[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('sr_highscores');
    if (raw) {
      try { setHighScores(JSON.parse(raw).slice(0, 5)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleStart = () => {
    const preset = COLOR_PRESETS[selectedColorIndex];
    onStartGame({ controlType, playerColor: preset.color, playerHeadColor: preset.headColor, gameDuration });
  };

  return (
    <MenuShell
      gameTitle="SLITHER ROGUE"
      subtitle="MUTATE YOUR DNA \u2022 STEAL SEGMENTS \u2022 EVOLVE OR DIE"
      ctaLabel="Launch Run"
      onCta={handleStart}
      classNames={{
        shell: 'sr-menu-shell',
        inner: 'sr-menu-inner',
        titleWrap: 'sr-menu-title-wrap',
        title: 'sr-menu-h1',
        subtitle: 'sr-menu-subtitle',
        grid: 'sr-menu-grid',
        cta: 'sr-menu-cta',
        launchBtn: 'sr-launch-btn',
      }}
      beforeInner={
        <>
          <div className="sr-menu-bg-glow sr-menu-bg-glow--tl" />
          <div className="sr-menu-bg-glow sr-menu-bg-glow--br" />
          <div className="sr-menu-badge">
            <Sparkles className="sr-icon-sm sr-pulse" /> TS/React Roguelike Slitherer
          </div>
        </>
      }
    >
      {/* LEFT: Settings */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="sr-menu-card"
      >
        {/* Color Picker */}
        <OptionSelectGroup
          label={
            <div className="sr-menu-label-row">
              <span className="sr-label-sm">Select Your Genome</span>
              <span className="sr-label-accent">{COLOR_PRESETS[selectedColorIndex].name}</span>
            </div>
          }
          options={COLOR_PRESETS.map((p) => ({ value: p.name, title: p.name }))}
          selected={COLOR_PRESETS[selectedColorIndex].name}
          onSelect={(name) => {
            const idx = COLOR_PRESETS.findIndex((p) => p.name === name);
            if (idx >= 0) setSelectedColorIndex(idx);
          }}
          renderOption={(opt) => {
            const preset = COLOR_PRESETS.find((p) => p.name === opt.value)!;
            return (
              <div className="sr-color-swatch">
                <div className="sr-dot" style={{ backgroundColor: preset.color }} />
                <div className="sr-dot sr-dot--head" style={{ backgroundColor: preset.headColor }} />
              </div>
            );
          }}
          classNames={{
            group: 'sr-menu-section',
            row: 'sr-color-row',
            btn: 'sr-color-btn',
            btnActive: ' sr-color-btn--active',
          }}
        />

        {/* Controls */}
        <OptionSelectGroup
          label={<span className="sr-label-sm">Movement Controls</span>}
          options={[
            { value: 'mouse' as const, title: 'Mouse Follow', subtitle: '360° fluid slither' },
            { value: 'keyboard' as const, title: 'Keyboard', subtitle: 'WASD & Arrows' },
          ]}
          selected={controlType}
          onSelect={(v) => setControlType(v)}
          renderOption={(opt) => (
            <>
              {opt.value === 'mouse' ? (
                <MousePointer className="sr-icon-md" />
              ) : (
                <Keyboard className="sr-icon-md" />
              )}
              <div>
                <p className="sr-toggle-title">{opt.title}</p>
                <p className="sr-toggle-sub">{opt.subtitle}</p>
              </div>
            </>
          )}
          classNames={{
            group: 'sr-menu-section',
            row: 'sr-toggle-grid',
            btn: 'sr-toggle-btn',
            btnActive: ' sr-toggle-btn--active',
          }}
        />

        {/* Duration */}
        <OptionSelectGroup
          label={<span className="sr-label-sm">Run Duration</span>}
          options={DURATIONS.map((d) => ({ value: d.seconds, title: d.label, subtitle: d.sub }))}
          selected={gameDuration}
          onSelect={(v) => setGameDuration(v)}
          classNames={{
            group: 'sr-menu-section',
            row: 'sr-dur-grid',
            btn: 'sr-dur-btn',
            btnActive: ' sr-dur-btn--active',
            title: 'sr-dur-label',
            sub: 'sr-dur-sub',
          }}
        />
      </motion.div>

      {/* RIGHT: How-to + High Scores */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="sr-menu-card sr-menu-card--right"
      >
        <div className="sr-howto">
          <div className="sr-howto-header">
            <HelpCircle className="sr-icon-sm sr-color-emerald" />
            <h3 className="sr-howto-title">How to Survive the Arena</h3>
          </div>
          <div className="sr-howto-list">
            <div className="sr-howto-item">
              <div className="sr-step sr-step--amber">1</div>
              <p><strong>Slither &amp; Eat:</strong> Guide your snake to glowing fruits. Eating grows your body and grants speed buffs.</p>
            </div>
            <div className="sr-howto-item">
              <div className="sr-step sr-step--rose">2</div>
              <p>
                <strong className="sr-color-rose"><ShieldAlert className="sr-icon-xs" /> Joint Exposure!</strong>{' '}
                If an NPC head touches your joints, they <strong>steal</strong> everything behind it. Protect your joints.
              </p>
            </div>
            <div className="sr-howto-item">
              <div className="sr-step sr-step--purple">3</div>
              <p><strong>Evolve &amp; Counter:</strong> Every 3 fruits lets you pick 1 of 3 random DNA Mutations kept permanently.</p>
            </div>
          </div>
        </div>

        <div className="sr-scores-tray">
          <div className="sr-scores-header">
            <Trophy className="sr-icon-xs sr-color-yellow" />
            <span>Top High Scores</span>
          </div>
          {highScores.length === 0 ? (
            <p className="sr-scores-empty">No runs logged yet. Build the perfect slitherer!</p>
          ) : (
            <div className="sr-scores-list">
              {highScores.map((score, i) => (
                <div key={i} className="sr-score-row">
                  <div className="sr-score-left">
                    <span className="sr-score-rank">#{i + 1}</span>
                    <span className="sr-score-name">{score.name}</span>
                  </div>
                  <div className="sr-score-right">
                    <span>🍒 <strong className="sr-color-emerald">{score.fruitsEaten}</strong></span>
                    <span>📏 <strong className="sr-color-sky">{score.peakLength}</strong></span>
                    <span>🧬 <strong className="sr-color-violet">{score.evolutionsCollected}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </MenuShell>
  );
}
