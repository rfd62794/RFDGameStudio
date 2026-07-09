import type { ReactNode } from 'react';
import { navigateHome } from '../arcade/routing';

export interface GameShellProps {
  /** Display name used in the marquee title treatment */
  gameLabel: string;
  /** Machine-readable game id rendered in monospace */
  gameId: string;
  /** Optional build phase badge (e.g. "PHASE A.1") */
  phase?: string;
  /** Game-specific status readout — funds, roster, room, score, etc. */
  statusArea?: ReactNode;
  /** Main content — tabs, canvas, or free layout */
  children: ReactNode;
  /** Optional footer region */
  footer?: ReactNode;
  className?: string;
}

/**
 * Structural wrapper for a game's App component.
 * Renders the shared cabinet-marquee header (title, phase, back link) and
 * leaves the actual stat readout to each game via `statusArea`.
 */
export function GameShell({
  gameLabel,
  gameId,
  phase,
  statusArea,
  children,
  footer,
  className = '',
}: GameShellProps) {
  return (
    <div className={`game-shell ${className}`}>
      <header className="game-shell-header">
        <div className="game-shell-header-inner">
          <button
            type="button"
            className="game-shell-back"
            onClick={navigateHome}
            aria-label="Back to Arcade"
          >
            ← Arcade
          </button>

          <div className="game-shell-brand">
            <h1 className="game-shell-title">{gameLabel}</h1>
            <span className="game-shell-id">{gameId}</span>
            {phase && <span className="game-shell-phase">{phase}</span>}
          </div>

          {statusArea && <div className="game-shell-status">{statusArea}</div>}
        </div>
      </header>

      <div className="game-shell-main">{children}</div>

      {footer && <div className="game-shell-footer">{footer}</div>}
    </div>
  );
}
