import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Trophy, Sparkles, MousePointer, Keyboard, HelpCircle,
  ShieldAlert
} from 'lucide-react';
import type { GameSession } from '../../../engine/types';
import type { HighScore } from '../types';

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
    <div className="sr-menu-shell">
      <div className="sr-menu-bg-glow sr-menu-bg-glow--tl" />
      <div className="sr-menu-bg-glow sr-menu-bg-glow--br" />

      <div className="sr-menu-inner">
        <div className="sr-menu-title-wrap">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sr-menu-badge"
          >
            <Sparkles className="sr-icon-sm sr-pulse" /> TS/React Roguelike Slitherer
          </motion.div>
          <motion.h1
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="sr-menu-h1"
          >
            SLITHER ROGUE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="sr-menu-subtitle"
          >
            MUTATE YOUR DNA &bull; STEAL SEGMENTS &bull; EVOLVE OR DIE
          </motion.p>
        </div>

        <div className="sr-menu-grid">
          {/* LEFT: Settings */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="sr-menu-card"
          >
            {/* Color Picker */}
            <div className="sr-menu-section">
              <div className="sr-menu-label-row">
                <span className="sr-label-sm">Select Your Genome</span>
                <span className="sr-label-accent">{COLOR_PRESETS[selectedColorIndex].name}</span>
              </div>
              <div className="sr-color-row">
                {COLOR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColorIndex(idx)}
                    className={`sr-color-btn${selectedColorIndex === idx ? ' sr-color-btn--active' : ''}`}
                    title={p.name}
                  >
                    <div className="sr-color-swatch">
                      <div className="sr-dot" style={{ backgroundColor: p.color }} />
                      <div className="sr-dot sr-dot--head" style={{ backgroundColor: p.headColor }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="sr-menu-section">
              <span className="sr-label-sm">Movement Controls</span>
              <div className="sr-toggle-grid">
                <button
                  onClick={() => setControlType('mouse')}
                  className={`sr-toggle-btn${controlType === 'mouse' ? ' sr-toggle-btn--active' : ''}`}
                >
                  <MousePointer className="sr-icon-md" />
                  <div>
                    <p className="sr-toggle-title">Mouse Follow</p>
                    <p className="sr-toggle-sub">360° fluid slither</p>
                  </div>
                </button>
                <button
                  onClick={() => setControlType('keyboard')}
                  className={`sr-toggle-btn${controlType === 'keyboard' ? ' sr-toggle-btn--active' : ''}`}
                >
                  <Keyboard className="sr-icon-md" />
                  <div>
                    <p className="sr-toggle-title">Keyboard</p>
                    <p className="sr-toggle-sub">WASD &amp; Arrows</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="sr-menu-section">
              <span className="sr-label-sm">Run Duration</span>
              <div className="sr-dur-grid">
                {DURATIONS.map(opt => (
                  <button
                    key={opt.seconds}
                    onClick={() => setGameDuration(opt.seconds)}
                    className={`sr-dur-btn${gameDuration === opt.seconds ? ' sr-dur-btn--active' : ''}`}
                  >
                    <span>{opt.label}</span>
                    <span className="sr-dur-sub">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
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
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="sr-menu-cta"
        >
          <button onClick={handleStart} className="sr-launch-btn">
            <Play className="sr-icon-md sr-fill-dark" />
            Launch Run
          </button>
        </motion.div>
      </div>
    </div>
  );
}
