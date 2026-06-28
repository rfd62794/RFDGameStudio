import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw, Home, Sparkles, Bookmark } from 'lucide-react';
import { Modal } from '../../../ui/components';
import type { GameSession } from '../../../engine/types';
import { call } from '../../../engine/runtime';
import type { HighScore } from '../types';

interface GameOverModalProps {
  session: GameSession;
  score: number;
  peakLength: number;
  evolutionsCount: number;
  onRestart: () => void;
  onHome: () => void;
}

export default function GameOverModal({
  session, score, peakLength, evolutionsCount, onRestart, onHome
}: GameOverModalProps) {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  const data = session.files.data as Record<string, unknown>;
  const gradeResult = call(session, 'calculate_grade', score, data['grade_thresholds']) as { title: string; description: string } | null;
  const grade = gradeResult ?? { title: 'Newborn Hatchling', description: 'Survival is tough. Gather more mutations next time!' };

  const saveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const entry: HighScore = {
      name: name.trim().slice(0, 15),
      fruitsEaten: score,
      peakLength,
      evolutionsCollected: evolutionsCount,
      date: new Date().toLocaleDateString(),
    };
    const raw = localStorage.getItem('sr_highscores');
    let list: HighScore[] = [];
    if (raw) { try { list = JSON.parse(raw); } catch (e) { console.error(e); } }
    list.push(entry);
    list.sort((a, b) => b.fruitsEaten !== a.fruitsEaten ? b.fruitsEaten - a.fruitsEaten : b.peakLength - a.peakLength);
    localStorage.setItem('sr_highscores', JSON.stringify(list.slice(0, 30)));
    setSaved(true);
  };

  return (
    <Modal title="Survival Log" onClose={onHome} showClose={true}>
      <div className="sr-gameover-accent-bar" />

      <div className="sr-gameover-header">
        <div className="sr-gameover-badge">
          <Trophy className="sr-icon-xs sr-color-yellow" /> Run Concluded!
        </div>
        <h2 className="sr-gameover-title">Survival Log</h2>
      </div>

      <div className="sr-grade-block">
        <p className="sr-grade-label">Genome Rating</p>
        <h3 className="sr-grade-name">{grade.title}</h3>
        <p className="sr-grade-desc">{grade.description}</p>
      </div>

      <div className="sr-gameover-stats">
        <div className="sr-gameover-stat">
          <span className="sr-gameover-stat-label">Total Fruits</span>
          <span className="sr-gameover-stat-value sr-color-emerald">{score}</span>
          <span className="sr-gameover-stat-sub">Eaten</span>
        </div>
        <div className="sr-gameover-stat">
          <span className="sr-gameover-stat-label">Peak Length</span>
          <span className="sr-gameover-stat-value sr-color-sky">{peakLength}</span>
          <span className="sr-gameover-stat-sub">Segments</span>
        </div>
        <div className="sr-gameover-stat">
          <span className="sr-gameover-stat-label">Evolutions</span>
          <span className="sr-gameover-stat-value sr-color-violet">{evolutionsCount}</span>
          <span className="sr-gameover-stat-sub">Acquired</span>
        </div>
      </div>

      {!saved ? (
        <form onSubmit={saveScore} className="sr-score-form">
          <label className="sr-score-form-label">Log in the High Scores Board</label>
          <div className="sr-score-form-row">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter snake pilot name..."
              required
              maxLength={15}
              className="sr-score-input"
            />
            <button type="submit" className="sr-score-submit">
              <Bookmark className="sr-icon-xs sr-fill-dark" />
              Submit
            </button>
          </div>
        </form>
      ) : (
        <div className="sr-score-saved">
          <Sparkles className="sr-icon-sm" /> Genome Logged Successfully!
        </div>
      )}

      <div className="sr-gameover-actions">
        <button onClick={onRestart} className="sr-gameover-btn sr-gameover-btn--primary">
          <RefreshCw className="sr-icon-sm" />
          New Run
        </button>
        <button onClick={onHome} className="sr-gameover-btn sr-gameover-btn--secondary">
          <Home className="sr-icon-sm" />
          Main Menu
        </button>
      </div>
    </Modal>
  );
}
