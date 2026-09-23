import {
  Play, Pause, RotateCcw, Zap, Magnet, Shield, Maximize2,
  Compass, Ghost, Sparkles, Flame, Clock
} from 'lucide-react';

interface GameHUDProps {
  score: number;
  fruitsToNextEvolution: number;
  fruitsPerLevel: number;
  peakLength: number;
  currentLength: number;
  shieldCharges: number;
  evolutionsCount: number;
  timeLeft: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onReturnToMenu: () => void;
  activeEvolutions: Record<string, number>;
}

interface MutationBadgeConfig {
  icon: React.ReactNode;
  label: string;
  cls: string;
}

function getMutationConfig(id: string, count: number, shieldCharges: number): MutationBadgeConfig | null {
  if (count <= 0) return null;
  switch (id) {
    case 'speed':   return { icon: <Zap className="sr-icon-xs" />, label: `Speed +${count * 15}%`, cls: 'sr-badge--amber' };
    case 'magnet':  return { icon: <Magnet className="sr-icon-xs" />, label: `Magnet +${count * 60}px`, cls: 'sr-badge--sky' };
    case 'shield':  return { icon: <Shield className="sr-icon-xs" />, label: `Shield (${shieldCharges} Chrg)`, cls: 'sr-badge--emerald' };
    case 'wide':    return { icon: <Maximize2 className="sr-icon-xs" />, label: `Girth +${count * 3}px`, cls: 'sr-badge--violet' };
    case 'sense':   return { icon: <Compass className="sr-icon-xs" />, label: `Radar +${count * 200}px`, cls: 'sr-badge--rose' };
    case 'ghost':   return { icon: <Ghost className="sr-icon-xs" />, label: `Ghost tail: ${count} seg`, cls: 'sr-badge--indigo' };
    case 'regen':   return { icon: <Sparkles className="sr-icon-xs" />, label: `Growth (${count}x)`, cls: 'sr-badge--fuchsia' };
    case 'venom':   return { icon: <Flame className="sr-icon-xs" />, label: `Acid trail (${count}x)`, cls: 'sr-badge--orange' };
    default: return null;
  }
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function GameHUD({
  score, fruitsToNextEvolution, fruitsPerLevel, currentLength, peakLength,
  shieldCharges, evolutionsCount, timeLeft, isPaused,
  onTogglePause, onReset, onReturnToMenu, activeEvolutions,
}: GameHUDProps) {
  const isTimeCritical = timeLeft <= 30;
  const earned = fruitsPerLevel - fruitsToNextEvolution;

  return (
    <div className="sr-hud">
      <div className="sr-hud-row">
        {/* Left: logo + timer */}
        <div className="sr-hud-left">
          <div className="sr-hud-logo">
            <div className="sr-hud-logo-icon">S</div>
            <div>
              <h1 className="sr-hud-logo-name">Slither Rogue</h1>
              <span className="sr-hud-logo-sub">Slither &amp; Mutate</span>
            </div>
          </div>
          <div className={`sr-hud-timer${isTimeCritical ? ' sr-hud-timer--critical' : ''}`}>
            <Clock className={`sr-icon-sm${isTimeCritical ? ' sr-spin' : ''}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Middle: evolution progress */}
        <div className="sr-hud-progress">
          <div className="sr-hud-progress-label">
            <span><Sparkles className="sr-icon-xs sr-color-emerald" /> Genetic Progress</span>
            <span className="sr-color-emerald sr-mono">{earned}/{fruitsPerLevel} fruits</span>
          </div>
          <div className="sr-progress-track">
            <div
              className="sr-progress-fill"
              style={{ width: `${(earned / fruitsPerLevel) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: stats + controls */}
        <div className="sr-hud-right">
          <div className="sr-hud-stats">
            <div className="sr-stat">
              <span className="sr-stat-label">Fruits</span>
              <span className="sr-stat-value">{score}</span>
            </div>
            <div className="sr-hud-divider" />
            <div className="sr-stat">
              <span className="sr-stat-label">Length (Peak)</span>
              <span className="sr-stat-value">{currentLength} <span className="sr-stat-sub">({peakLength})</span></span>
            </div>
            <div className="sr-hud-divider" />
            <div className="sr-stat">
              <span className="sr-stat-label">Evolutions</span>
              <span className="sr-stat-value sr-color-violet">{evolutionsCount}</span>
            </div>
          </div>

          <div className="sr-hud-controls">
            <button onClick={onTogglePause} className="sr-hud-btn" title={isPaused ? 'Resume' : 'Pause'}>
              {isPaused ? <Play className="sr-icon-sm sr-color-emerald" /> : <Pause className="sr-icon-sm" />}
            </button>
            <button onClick={onReset} className="sr-hud-btn" title="Restart">
              <RotateCcw className="sr-icon-sm" />
            </button>
            <button onClick={onReturnToMenu} className="sr-hud-btn sr-hud-btn--text">
              Menu
            </button>
          </div>
        </div>
      </div>

      {Object.values(activeEvolutions).some(v => v > 0) && (
        <div className="sr-badges-tray">
          <span className="sr-badges-label">Active Genes:</span>
          <div className="sr-badges-row">
            {Object.entries(activeEvolutions).map(([id, count]) => {
              const cfg = getMutationConfig(id, count, shieldCharges);
              if (!cfg) return null;
              return (
                <div key={id} className={`sr-badge ${cfg.cls}`}>
                  {cfg.icon}
                  <span>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
